import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clips: defineTable({
    captions: v.optional(
      v.array(
        v.object({
          confidence: v.number(),
          endMs: v.number(),
          startMs: v.number(),
          text: v.string(),
          timestampMs: v.number()
        })
      )
    ),
    clips: v.optional(
      v.array(
        v.object({
          categories: v.array(v.string()),
          description: v.string(),
          editings: v.array(
            v.object({
              endMs: v.number(),
              fileId: v.optional(v.string()),
              hookScore: v.number(),
              id: v.string(),
              reason: v.string(),
              startMs: v.number(),
              title: v.string(),
              transitionFunction: v.string(),
              viralScore: v.number()
            })
          ),
          hashtags: v.array(v.string()),
          overallScore: v.number(),
          platform: v.string(),
          targetDurationMs: v.number(),
          title: v.string()
        })
      )
    ),
    originalVideoPath: v.optional(v.string()),
    progress: v.optional(v.number()),
    status: v.optional(v.string()),
    videoFps: v.optional(v.string()),
    workflowId: v.optional(v.string()),
    youtubeVideoDetail: v.optional(v.any()),
    youtubeVideoId: v.optional(v.string()),
    youtubeURL: v.string()
  })
});
