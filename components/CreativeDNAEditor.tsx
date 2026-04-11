"use client";

import { useState } from "react";
import { Save, Loader2, Sparkles } from "lucide-react";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "tags";
  placeholder?: string;
}

interface CreativeDNAEditorProps {
  title?: string;
  fields: FieldConfig[];
  data: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
}

export function CreativeDNAEditor({ title = "Creative DNA", fields, data, onSave }: CreativeDNAEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({ ...data });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleTagsChange = (key: string, value: string) => {
    const tags = value.split(",").map(t => t.trim()).filter(Boolean);
    handleChange(key, tags);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save Creative DNA:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateField = async (fieldKey: string) => {
    setGeneratingField(fieldKey);
    // Simulate AI generation time
    await new Promise(r => setTimeout(r, 1500));
    const mocks: Record<string, string | string[]> = {
      narrative_summary: "An atmospheric exploration of late-night thoughts and sudden awakenings, weaving between melancholic solitude and quiet epiphanies.",
      visual_identity: "Midnight blues transitioning into harsh, striking neon colors. Heavy use of film grain and blurred lights.",
      canonical_phrase: "Silence is the loudest scream.",
      visual_keywords: ["neon", "midnight", "isolation", "rain", "glass"],
      emotional_direction: "Starting in vulnerability and slowly building into a profound sense of self-acceptance and power.",
      prompt_notes: "Focus on cinematic lighting, high contrast, avoiding daylight or overly cheerful aesthetics.",
      emotional_summary: "The fleeting moment of clarity that happens completely alone in the dark.",
      themes: ["vulnerability", "epiphany", "solitude"],
      symbolism: ["mirrors", "shattered glass", "distant headlights"],
      campaign_tone: "Introspective, cinematic, highly aestheticized."
    };
    
    handleChange(fieldKey, mocks[fieldKey] || "Generated AI content for this field...");
    setGeneratingField(null);
  };

  return (
    <div className="glass border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
          <Sparkles className="w-4 h-4" />
          {title}
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            saved
              ? 'bg-green-500/10 border border-green-500/30 text-green-500'
              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
          } disabled:opacity-50`}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <>Saved</>
          ) : (
            <>
              <Save className="w-3 h-3" />
              Save
            </>
          )}
        </button>
      </div>

      <div className="space-y-5">
        {fields.map(field => {
          const value = formData[field.key];
          const isEmpty = !value || (Array.isArray(value) && value.length === 0);
          
          return (
            <div key={field.key} className="space-y-1.5 relative">
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[10px] uppercase font-bold tracking-widest ${isEmpty ? "text-red-400" : "text-white/30"}`}>
                  {field.label} {isEmpty && <span className="ml-1 text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300">Missing</span>}
                </label>
                {isEmpty && (
                  <button
                    onClick={() => handleGenerateField(field.key)}
                    disabled={generatingField === field.key}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[9px] font-bold uppercase tracking-widest transition-colors"
                  >
                    {generatingField === field.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generate
                  </button>
                )}
              </div>
              
              {field.type === "textarea" ? (
                <textarea
                  value={value || ""}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 text-sm text-white placeholder:text-white/15 focus:outline-none transition-colors resize-none ${isEmpty ? "border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)] focus:border-red-400" : "border border-white/10 focus:border-white/30"}`}
                />
              ) : field.type === "tags" ? (
                <input
                  type="text"
                  value={(value as string[] || []).join(", ")}
                  onChange={e => handleTagsChange(field.key, e.target.value)}
                  placeholder={field.placeholder || "tag1, tag2, tag3..."}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 text-sm text-white placeholder:text-white/15 focus:outline-none transition-colors ${isEmpty ? "border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)] focus:border-red-400" : "border border-white/10 focus:border-white/30"}`}
                />
              ) : (
                <input
                  type="text"
                  value={value || ""}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 text-sm text-white placeholder:text-white/15 focus:outline-none transition-colors ${isEmpty ? "border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)] focus:border-red-400" : "border border-white/10 focus:border-white/30"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pre-configured field sets
export const ALBUM_DNA_FIELDS: FieldConfig[] = [
  { key: "narrative_summary", label: "Narrative Summary", type: "textarea", placeholder: "The album's narrative arc and emotional journey..." },
  { key: "visual_identity", label: "Visual Identity", type: "textarea", placeholder: "Colors, textures, visual motifs..." },
  { key: "canonical_phrase", label: "Canonical Phrase", type: "text", placeholder: "A defining phrase for this album..." },
  { key: "visual_keywords", label: "Visual Keywords", type: "tags", placeholder: "neon, shadow, intimacy..." },
  { key: "emotional_direction", label: "Emotional Direction", type: "textarea", placeholder: "Core emotional tone and direction..." },
  { key: "prompt_notes", label: "Prompt Notes", type: "textarea", placeholder: "AI generation notes and constraints..." },
];

export const SONG_DNA_FIELDS: FieldConfig[] = [
  { key: "emotional_summary", label: "Emotional Summary", type: "textarea", placeholder: "The song's emotional core..." },
  { key: "visual_identity", label: "Visual Identity", type: "textarea", placeholder: "Colors, textures, visual motifs..." },
  { key: "canonical_phrase", label: "Canonical Phrase", type: "text", placeholder: "A defining phrase for this song..." },
  { key: "themes", label: "Themes", type: "tags", placeholder: "desire, memory, distance..." },
  { key: "symbolism", label: "Symbolism", type: "tags", placeholder: "fire, water, glass..." },
  { key: "visual_keywords", label: "Visual Keywords", type: "tags", placeholder: "neon, shadow, intimacy..." },
  { key: "campaign_tone", label: "Campaign Tone", type: "text", placeholder: "Elegant, provocative, introspective..." },
  { key: "prompt_notes", label: "Prompt Notes", type: "textarea", placeholder: "AI generation notes and constraints..." },
];
