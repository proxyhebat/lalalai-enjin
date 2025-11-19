import { v } from "convex/values";

import { env } from "@/env";

import { workflow } from ".";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query
} from "./_generated/server";
import { YouTubeV3VideosResponse } from "./types";

function workflowLogger(clipId: string, ...anyColorYouLike: unknown[]) {
  console.info(`[${clipId}]`, ...anyColorYouLike);
}

export const clipsGenerationWorkflow = workflow.define({
  args: {
    clipId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (step, args) => {
    let captions = null;
    let videoPath = null;

    const result = await step.runQuery(internal.clips.preWorkflowChecks, {
      clipId: args.clipId,
      youtubeURL: args.youtubeURL
    });
    workflowLogger(args.clipId, "succesfuly checked existence", result.exists);

    if (!result.exists) {
      // fetch video details & save to db
      await step.runAction(internal.clips.fetchYouTubeVideoDetails, {
        clipId: args.clipId,
        youtubeURL: args.youtubeURL
      });

      videoPath = await step.runAction(internal.steps.download, {
        clipId: args.clipId,
        youtubeURL: args.youtubeURL
      });
      workflowLogger(args.clipId, "succesfuly download video", videoPath);

      const [audioPath] = await Promise.all([
        step.runAction(internal.steps.extractAudio, {
          clipId: args.clipId,
          filepath: videoPath
        }),
        step.runAction(internal.steps.extractMediaInfo, {
          clipId: args.clipId,
          filepath: videoPath
        })
      ]);
      workflowLogger(args.clipId, "succesfuly extracted media info");
      workflowLogger(args.clipId, "succesfuly extracted audio", audioPath);

      captions = await step.runAction(internal.steps.transcribeAudio, {
        clipId: args.clipId,
        filepath: audioPath
      });
      workflowLogger(args.clipId, "succesfuly transcribed audio");
    } else {
      captions = result.captions;
      videoPath = result.originalVideoPath;
    }

    const clips = await step.runAction(internal.steps.analyzeTranscription, {
      clipId: args.clipId,
      captions
    });
    workflowLogger(args.clipId, "succesfuly analyzed transcription");

    await step.runAction(internal.steps.sliceAndStoreVideos, {
      clipId: args.clipId,
      filepath: videoPath!,
      clips
    });
    workflowLogger(args.clipId, "succesfuly sliced video");
  }
});

export const fetchYouTubeVideoDetails = internalAction({
  args: {
    clipId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (ctx, args) => {
    const url = new URL(args.youtubeURL);
    const videoId = url.searchParams.get("v");
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/videos" +
        `?id=${videoId}` +
        `&key=${env.GOOGLE_API_KEY}` +
        `&part=contentDetails,snippet`,
      {
        method: "GET"
      }
    );

    const ytVideoResponse: YouTubeV3VideosResponse = await response.json();

    await ctx.runMutation(internal.clips.patch, {
      id: args.clipId,
      data: {
        youtubeVideoDetail: ytVideoResponse,
        youtubeVideoId: videoId
      }
    });
  }
});

//check if the video already have transcriptions
export const preWorkflowChecks = internalQuery({
  args: {
    clipId: v.id("clips"),
    youtubeURL: v.string()
  },
  returns: v.object({
    exists: v.boolean(),
    captions: v.optional(v.any())
  }),
  handler: async (ctx, args) => {
    let captions;
    let originalVideoPath;
    let result = false;

    const url = new URL(args.youtubeURL);
    const videoId = url.searchParams.get("v");

    const clip = await ctx.db
      .query("clips")
      // search for the clip by YouTube Video Id
      .filter((q) => q.eq(q.field("youtubeVideoId"), videoId))
      .first();

    if (!clip || !clip?.captions || !clip?.captions.length) {
      result = false;
    } else {
      result = true;
      captions = clip.captions;
      originalVideoPath = clip.originalVideoPath;
    }

    return { exists: result, captions, originalVideoPath };
  }
});

export const kickstartClipsGenerationWorkflow = mutation({
  args: {
    youtubeURL: v.string()
  },
  handler: async (ctx, args) => {
    // store the yt url so that we can add workflow id later
    const clipId = await ctx.db.insert("clips", {
      youtubeURL: args.youtubeURL
    });

    // kickstart the workflow
    const workflowId: string = await workflow.start(
      ctx,
      internal.clips.clipsGenerationWorkflow,
      {
        clipId,
        youtubeURL: args.youtubeURL
      }
    );

    // save the workflow id
    await ctx.db.patch(clipId, {
      workflowId,
      status: "Downloading Video",
      progress: 5
    });

    return {
      clipId,
      workflowId
    };
  }
});

//generic patch for clips table
export const patch = internalMutation({
  args: {
    id: v.id("clips"),
    data: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.data);
  }
});

export const getSlicedVideos = query({
  args: {
    clipId: v.id("clips")
  },
  returns: v.array(
    v.object({
      clipIndex: v.number(),
      editingIndex: v.number(),
      name: v.string(),
      url: v.nullable(v.string())
    })
  ),
  handler: async (ctx, args) => {
    const clipDoc = await ctx.db.get(args.clipId);
    if (!clipDoc || !clipDoc.clips) {
      return [];
    }

    const videosWithUrls = [];

    for (let i = 0; i < clipDoc.clips.length; i++) {
      const clip = clipDoc.clips[i];
      for (let j = 0; j < clip.editings.length; j++) {
        const editing = clip.editings[j];
        if (editing.fileId) {
          const url = await ctx.storage.getUrl(
            editing.fileId as Id<"_storage">
          );
          const sanitizedTitle = clip.title.replace(/[^a-zA-Z0-9]/g, "_");
          const name = `${args.clipId}_${sanitizedTitle}_${editing.id}.mp4`;
          videosWithUrls.push({
            clipIndex: i,
            editingIndex: j,
            name,
            url
          });
        }
      }
    }

    return videosWithUrls;
  }
});
