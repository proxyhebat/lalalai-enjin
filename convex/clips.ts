import { v } from "convex/values";

import { workflow } from ".";
import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";

function workflowLogger(clipsId: string, ...anyColorYouLike: unknown[]) {
  console.info(`[${clipsId}]`, ...anyColorYouLike);
}

export const clipsGenerationWorkflow = workflow.define({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (step, args) => {
    // ############################################### DOWNLOADING THE VIDEO
    workflowLogger(args.clipsId, "downloading the video", args.youtubeURL);
    const videoPath = await step.runAction(internal.steps.download, {
      clipsId: args.clipsId,
      youtubeURL: args.youtubeURL
    });
    workflowLogger(args.clipsId, "succesfuly download video", videoPath);

    // ############################################### EXTRACTING MEDIA INFO
    workflowLogger(args.clipsId, "extracting media info", videoPath);
    await step.runAction(internal.steps.extractMediaInfo, {
      clipsId: args.clipsId,
      filepath: videoPath
    });
    workflowLogger(args.clipsId, "succesfuly extracted media info");

    // ###################################################### EXTRACT AUDIO
    const audioPath = await step.runAction(internal.steps.extractAudio, {
      clipsId: args.clipsId,
      filepath: videoPath
    });
    workflowLogger(args.clipsId, "succesfuly extracted audio", audioPath);

    // ################################################### TRANSCRIBE AUDIO
    const captions = await step.runAction(internal.steps.transcribeAudio, {
      clipsId: args.clipsId,
      filepath: audioPath
    });
    workflowLogger(args.clipsId, "succesfuly transcribed audio");
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

export const patch = internalMutation({
  args: {
    id: v.id("clips"),
    data: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.data);
  }
});
