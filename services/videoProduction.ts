import { z } from "zod";

const shortText = z.string().trim().min(1).max(200);
export const videoProductionSchema = z.object({
  artist: shortText,
  song: shortText,
  version: shortText,
  title: shortText,
  shots: z.array(z.object({
    number: z.number().int().min(1).max(100),
    description: z.string().trim().min(1).max(1500),
    status: z.enum(["planned", "provided", "approved"]),
    assetReference: z.string().trim().min(1).max(500).optional(),
  })).max(50),
  assets: z.array(z.object({
    kind: z.enum(["image", "video", "audio", "other"]),
    label: shortText,
    reference: z.string().trim().min(1).max(500),
  })).max(50),
}).superRefine((value, context) => {
  const numbers = value.shots.map(shot => shot.number);
  if (new Set(numbers).size !== numbers.length) {
    context.addIssue({ code: "custom", path: ["shots"], message: "Shot numbers must be unique." });
  }
});

