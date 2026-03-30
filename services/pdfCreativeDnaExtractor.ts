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
    
    // Attempt tracking list via regex over the whole text block
    // Look for tracklist section until "Song Creative DNA"
    const tracklistRegex = /Tracklist[\s\S]*?Song\s*Title([\s\S]+?)(?:\d+\.\s+Song\s+Creative\s+DNA|\bSong\s+Creative\s+DNA\b|(?=\s*$))/i;
    const tracklistMatch = text.match(tracklistRegex);
    
    if (tracklistMatch) {
      const tracksString = tracklistMatch[1];
      // Regex to find things like "1 Prologue in Yellow" 
      // where 1 is a number, followed by spaces/newlines, followed by words, until another number or end
      const regex = /(\d+)[\s\n]+([^\d]+?)(?=[\s\n]+\d+[\s\n]+[A-Z]|\s*$)/g;
      let match;
      while ((match = regex.exec(tracksString)) !== null) {
        if (match[2].trim()) {
           songRows.push({
             trackNumber: parseInt(match[1]),
             songTitle: match[2].replace(/\n/g, ' ').trim(),
             action: 'create',
             warnings: []
           });
        }
      }
    }

    // Now attempt to extract "Song Creative DNA" for each track if present
    for (const song of songRows) {
      // Find the block for this specific song
      // It starts with Track X to Track X+1 or end of string
      const currentTrackLabel = `Track\\s+${song.trackNumber}\\b`;
      const nextTrackLabel = `(?:Track\\s+${song.trackNumber + 1}\\b|$)`;
      const blockRegex = new RegExp(`${currentTrackLabel}([\\s\\S]+?)(?=${nextTrackLabel})`, "is");
      
      const blockMatch = text.match(blockRegex);
      if (blockMatch) {
         const block = blockMatch[1];
         
         const emoMatch = block.match(/Emotional Summary([\s\S]+?)(?=Themes|Symbolism|Visual|Campaign|Prompt|$)/i);
         if (emoMatch) song.emotionalSummary = emoMatch[1].replace(/\n/g, ' ').trim();

         const themesMatch = block.match(/Themes([\s\S]+?)(?=Symbolism|Visual|Campaign|Prompt|$)/i);
         if (themesMatch) song.themes = themesMatch[1].replace(/\n/g, ' ').split(',').map((s: string) => s.trim());

         const symMatch = block.match(/Symbolism([\s\S]+?)(?=Visual|Campaign|Prompt|$)/i);
         if (symMatch) song.symbolism = symMatch[1].replace(/\n/g, ' ').split(',').map((s: string) => s.trim());

         const visMatch = block.match(/Visual Identity([\s\S]+?)(?=Campaign|Prompt|$)/i);
         if (visMatch) song.visualIdentity = visMatch[1].replace(/\n/g, ' ').trim();

         const toneMatch = block.match(/Campaign Tone([\s\S]+?)(?=Prompt|$)/i);
         if (toneMatch) song.campaignTone = toneMatch[1].replace(/\n/g, ' ').trim();

         const promptMatch = block.match(/Prompt Notes([\s\S]+?)(?=$)/i);
         if (promptMatch) song.promptNotes = promptMatch[1].replace(/\n/g, ' ').trim();
      }
    }
    
    // Extract album level data
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
