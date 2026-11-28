import { z } from "zod";

export const socialMaterialSchema = z.object({
  draft_id: z.string().uuid(),
  kind: z.enum(["song", "audio", "video", "image", "cover", "listening_link"]),
  label: z.string().trim().min(1).max(160),
  reference: z.string().trim().min(1).max(2000),
  state: z.enum(["proposed", "provided"]),
  start_seconds: z.number().finite().min(0).optional(),
  end_seconds: z.number().finite().min(0).optional(),
}).superRefine((value, context) => {
  const hasStart = value.start_seconds !== undefined;
  const hasEnd = value.end_seconds !== undefined;
  if (hasStart !== hasEnd || ((hasStart || hasEnd) && value.kind !== "audio")) {
    context.addIssue({ code: "custom", message: "Audio excerpts require a start and end on an audio material." });
  }
  if (hasStart && hasEnd && value.end_seconds! <= value.start_seconds!) {
    context.addIssue({ code: "custom", message: "The audio excerpt end must be after its start." });
  }
  if (value.kind === "listening_link") {
    try {
      if (new URL(value.reference).protocol !== "https:") throw new Error();
    } catch {
      context.addIssue({ code: "custom", path: ["reference"], message: "Listening links must use HTTPS." });
    }
  }
});

export function summarizeMaterials(materials: Array<{ kind: string; state: string }>) {
  const provided = (kind: string) => materials.some((item) => item.kind === kind && item.state === "provided");
  return {
    song: provided("song"),
    audio: provided("audio"),
    visual: provided("video") || provided("image") || provided("cover"),
    listening_link: provided("listening_link"),
    note: "States describe supplied references. Access, file contents, rights and destination have not been verified.",
  };
}
