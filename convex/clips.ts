import { v } from "convex/values";

import { workflow } from ".";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";

function workflowLogger(clipsId: string, ...anyColorYouLike: unknown[]) {
  console.info(`[INFO]::[${clipsId}]`, ...anyColorYouLike);
}

export const generateClipsWorkflow = workflow.define({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (step, args) => {
    workflowLogger(args.clipsId, "downloading the video", args.youtubeURL);
    const downloadResult = await step.runAction(internal.steps.download, {
      clipsId: args.clipsId,
      youtubeURL: args.youtubeURL
    });
    workflowLogger(args.clipsId, "succesfuly download video", downloadResult);
  }
});

export const generate = mutation({
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
      internal.clips.generateClipsWorkflow,
      {
        clipsId,
        youtubeURL: args.youtubeURL
      }
    );

    // save the workflow id
    await ctx.db.patch(clipsId, {
      workflowId
    });

    return {
      clipsId,
      workflowId
    };
  }
});
