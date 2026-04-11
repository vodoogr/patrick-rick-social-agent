import { useState, useRef, useEffect } from "react";

// We'll import pdfjs directly in the functions to avoid initialization issues in Next.js/SSR
// if (typeof window !== 'undefined') { ... } 

export interface ExtractedPDFData {
  text: string;
  metadata?: any;
}

export class PdfCreativeDnaExtractor {
  
  static async extractTextFromFile(file: File): Promise<ExtractedPDFData> {
    // Import legacy build for better compatibility with Next.js webpack
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Set worker from a reliable CDN matching the version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    // In legacy mode, we might need a slightly different config or just wait for it.
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY = -1;
        let pageTextFragments = [];
        
        for (const rawItem of textContent.items) {
            const item = rawItem as any;
            if (!item.str) continue;
            const y = item.transform ? item.transform[5] : 0;
            
            // If the Y coordinate changes significantly, it's a new line.
            if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                pageTextFragments.push("\n");
            }
            pageTextFragments.push(item.str.trim());
            lastY = y;
        }
        
        // Clean up excessive spaces caused by multiple fragments per line
        const pageText = pageTextFragments.join(" ").replace(/ \n /g, "\n").replace(/\n /g, "\n").replace(/ \n/g, "\n");
        fullText += pageText + "\n\n";
    }

    // Attempt to get metadata
    const metadata = await pdf.getMetadata();

    return {
      text: fullText,
      metadata: metadata,
    };
  }

  static parseExtractedText(text: string): {
    albumUpdates: any,
    songRows: any[]
  } {
    let albumUpdates: any = {};
    let songRows: any[] = [];
    
    // Extract song DNA
    // 1. First, isolate the main Song Creative DNA section to avoid grabbing Tracklist rows
    let dnaSection = "";
    const dnaSectionMatch = text.match(/8\.?\s*Song\s*Creative\s*DNA([\s\S]+)/i) || text.match(/Song\s*Creative\s*DNA([\s\S]+)/i);
    if (dnaSectionMatch) {
       dnaSection = dnaSectionMatch[1];
    } else {
       dnaSection = text;
    }

    // 2. Split the DNA section by "Song Title" to perfectly isolate each song block.
    const dnaChunks = dnaSection.split(/Song\s*Title/i);
    
    // dnaChunks[0] is garbage before the first song title.
    let trackIndex = 1;
    for (let i = 1; i < dnaChunks.length; i++) {
      const chunk = dnaChunks[i];
      
      const tMatch = chunk.match(/^\s*([\s\S]+?)(?=\s*Emotional\s*Summary|$)/i);
      if (!tMatch) continue;

      const songTitle = tMatch[1].replace(/\n/g, ' ').trim();
      const cleanTitle = songTitle.replace(/—\s*Track\s*\d+/i, '').trim();

      const emoMatch = chunk.match(/Emotional\s*Summary\s*([\s\S]+?)(?=Themes|Symbolism|Visual\s*Identity|Campaign\s*Tone|Prompt\s*Notes|$)/i);
      const themesMatch = chunk.match(/Themes\s*([\s\S]+?)(?=Symbolism|Visual\s*Identity|Campaign\s*Tone|Prompt\s*Notes|$)/i);
      const symMatch = chunk.match(/Symbolism\s*([\s\S]+?)(?=Visual\s*Identity|Campaign\s*Tone|Prompt\s*Notes|$)/i);
      const visMatch = chunk.match(/Visual\s*Identity\s*([\s\S]+?)(?=Campaign\s*Tone|Prompt\s*Notes|$)/i);
      const toneMatch = chunk.match(/Campaign\s*Tone\s*([\s\S]+?)(?=Prompt\s*Notes|$)/i);
      
      // Stop prompt notes before any stray headers that might leak in from the next section if present
      const promptMatch = chunk.match(/Prompt\s*Notes\s*([\s\S]+?)(?=\b8\.?\s*Song\s*Creative\s*DNA\b|\bSong\s*Creative\s*DNA\b|$)/i);

      songRows.push({
        trackNumber: trackIndex++,
        songTitle: cleanTitle,
        emotionalSummary: emoMatch ? emoMatch[1].replace(/\n/g, ' ').trim() : "",
        themes: themesMatch ? themesMatch[1].replace(/\n/g, ' ').split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        symbolism: symMatch ? symMatch[1].replace(/\n/g, ' ').split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        visualIdentity: visMatch ? visMatch[1].replace(/\n/g, ' ').trim() : "",
        campaignTone: toneMatch ? toneMatch[1].replace(/\n/g, ' ').trim() : "",
        promptNotes: promptMatch ? promptMatch[1].replace(/\n/g, ' ').trim() : "",
        action: 'create',
        warnings: []
      });
    }

    // Pass dnaChunks[0] (which is the document start) to extract Album level data
    const titleMatch = text.match(/Album Title\s*([\s\S]+?)(?=Era|Year|Core Emotion|$)/i);
    if (titleMatch) albumUpdates.albumTitle = titleMatch[1].replace(/\n/g, ' ').trim();

    const eraMatch = text.match(/Era(?:\s*\([^)]+\))?\s*([\s\S]+?)(?=Year|Core Emotion|Narrative Position|$)/i);
    if (eraMatch) {
       let rawEra = eraMatch[1].replace(/\n/g, ' ').trim();
       albumUpdates.era = rawEra.toUpperCase(); // Map properly to enums on save
    }
    
    const narrativeMatch = text.match(/Narrative Summary[\s]*([\s\S]+?)(?=3\.|Visual Identity|Tracklist|Songs|$)/i);
    if (narrativeMatch) albumUpdates.narrativeSummary = narrativeMatch[1].replace(/\n/g, ' ').trim();

    const phraseMatch = text.match(/Canonical Phrase[\s]*([\s\S]+?)(?=5\.|Emotional Direction|$)/i);
    if (phraseMatch) albumUpdates.canonicalPhrase = phraseMatch[1].replace(/\n/g, ' ').trim();

    const visIdMatch = text.match(/3\.?\s*Visual Identity([\s\S]+?)(?=4\.|Canonical Phrase|$)/i);
    if (visIdMatch) {
       albumUpdates.visualIdentity = visIdMatch[1].replace(/\n/g, ' ').trim();
       // try to extract Visual Keywords
       const kwMatch = visIdMatch[1].match(/Visual Keywords\s*(?:\([^)]+\))?([\s\S]+?)(?=Color Palette|Visual Motifs|$)/i);
       const motifsMatch = visIdMatch[1].match(/Visual Motifs([\s\S]+?)(?=4\.|Canonical Phrase|$)/i);
       
       let kwString = "";
       let motifsString = "";
       
       if (kwMatch) {
         kwString = kwMatch[1].replace(/\n/g, ' ').trim();
         albumUpdates.visualKeywords = kwString.split(',').map((s: string) => s.trim()).filter(Boolean);
       }
       
       if (motifsMatch) {
         motifsString = motifsMatch[1].replace(/\n/g, ' ').trim();
       }
       
       let promptParts = [];
       if (kwString) promptParts.push(`Key elements: ${kwString}`);
       if (motifsString) promptParts.push(`Visual motifs: ${motifsString}`);
       if (promptParts.length > 0) albumUpdates.promptNotes = promptParts.join('. ');
    }

    const emotionMatch = text.match(/5\.?\s*Emotional Direction([\s\S]+?)(?=6\.|Sonic Identity|Tracklist|$)/i);
    if (emotionMatch) albumUpdates.emotionalDirection = emotionMatch[1].replace(/\n/g, ' ').trim();
    
    return {
      albumUpdates,
      songRows
    };
  }
}
