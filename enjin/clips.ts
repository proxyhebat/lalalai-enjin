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

function workflowLogger(clipsId: string, ...anyColorYouLike: unknown[]) {
  console.info(`[${clipsId}]`, ...anyColorYouLike);
}

export const clipsGenerationWorkflow = workflow.define({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (step, args) => {
    let captions = null;
    let videoPath = null;

    const result = await step.runQuery(internal.clips.preWorkflowChecks, {
      clipsId: args.clipsId,
      youtubeURL: args.youtubeURL
    });
    workflowLogger(args.clipsId, "succesfuly checked existence", result.exists);

    if (!result.exists) {
      // fetch video details & save to db
      await step.runAction(internal.clips.fetchYouTubeVideoDetails, {
        clipsId: args.clipsId,
        youtubeURL: args.youtubeURL
      });

      videoPath = await step.runAction(internal.steps.download, {
        clipsId: args.clipsId,
        youtubeURL: args.youtubeURL
      });
      workflowLogger(args.clipsId, "succesfuly download video", videoPath);

      const [audioPath] = await Promise.all([
        step.runAction(internal.steps.extractAudio, {
          clipsId: args.clipsId,
          filepath: videoPath
        }),
        step.runAction(internal.steps.extractMediaInfo, {
          clipsId: args.clipsId,
          filepath: videoPath
        })
      ]);
      workflowLogger(args.clipsId, "succesfuly extracted media info");
      workflowLogger(args.clipsId, "succesfuly extracted audio", audioPath);

      captions = await step.runAction(internal.steps.transcribeAudio, {
        clipsId: args.clipsId,
        filepath: audioPath
      });
      workflowLogger(args.clipsId, "succesfuly transcribed audio");
    } else {
      captions = result.captions;
      videoPath = result.originalVideoPath;
    }

    const clips = await step.runAction(internal.steps.analyzeTranscription, {
      clipsId: args.clipsId,
      captions
    });
    workflowLogger(args.clipsId, "succesfuly analyzed transcription");

    await step.runAction(internal.steps.sliceAndStoreVideos, {
      clipsId: args.clipsId,
      filepath: videoPath!,
      clips
    });
    workflowLogger(args.clipsId, "succesfuly sliced video");
  }
});

export const fetchYouTubeVideoDetails = internalAction({
  args: {
    clipsId: v.id("clips"),
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
      id: args.clipsId,
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
    clipsId: v.id("clips"),
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
    const clipsId = await ctx.db.insert("clips", {
      youtubeURL: args.youtubeURL
    });

    // kickstart the workflow
    const workflowId: string = await workflow.start(
      ctx,
      internal.clips.clipsGenerationWorkflow,
      {
        clipsId,
        youtubeURL: args.youtubeURL
      }
    );

    // save the workflow id
    await ctx.db.patch(clipsId, {
      workflowId,
      status: "Downloading Video",
      progress: 5
    });

    return {
      clipsId,
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
    clipsId: v.id("clips")
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
    const clipDoc = await ctx.db.get(args.clipsId);
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
          const name = `${args.clipsId}_${sanitizedTitle}_${editing.id}.mp4`;
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
