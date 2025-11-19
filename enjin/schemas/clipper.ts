import z from "zod";

export const editing = z.object({
  id: z.string(),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  title: z.string().max(64),
  reason: z.string().max(255),
  hookScore: z
    .number()
    .min(0)
    .max(100)
    .describe("First 3sec engagement potential"),
  viralScore: z.number().min(0).max(100).describe("Overall viral potential"),
  transitionFunction: z
    .enum([
      "fade",
      "slide",
      "wipe",
      "flip",
      "clockWipe",
      "iris",
      "cube",
      "none",
      "cut"
    ])
    .default("cut")
});

export const clip = z.object({
  title: z.string().max(100).describe("Engaging title for social media"),
  description: z.string().max(500).optional(),
  categories: z.array(z.string().min(1).max(100)).max(5),
  hashtags: z.array(z.string().max(30)).max(10).optional(),
  targetDurationMs: z
    .number()
    .min(45000)
    .max(60000)
    .describe("45-60 seconds optimal"),
  platform: z
    .enum(["youtube-shorts", "tiktok", "instagram", "general"])
    .default("general"),
  editings: z.array(editing).min(1),
  overallScore: z.number().min(0).max(100).describe("Clip quality score")
});

export const clipperOutputSchema = z.object({
  clips: z.array(clip).max(10).describe("Top clips ranked by score")
});
