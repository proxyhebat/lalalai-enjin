import { v } from "convex/values";

import { workflow } from ".";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

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

    const result = await step.runQuery(internal.clips.preWorkflowChecks, {
      clipsId: args.clipsId,
      youtubeURL: args.youtubeURL
    });
    workflowLogger(args.clipsId, "succesfuly checked existence", result.exists);

    if (!result.exists) {
      const videoPath = await step.runAction(internal.steps.download, {
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
    }

    const clips = await step.runAction(internal.steps.analyzeTranscription, {
      clipsId: args.clipsId,
      captions
    });
    workflowLogger(args.clipsId, "succesfuly analyzed transcription");
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
    let result = false;
    let captions;

    const clip = await ctx.db
      .query("clips")
      // search for the clip by youtubeURL
      .filter((q) => q.eq(q.field("youtubeURL"), args.youtubeURL))
      .first();

    if (!clip || !clip?.captions || !clip?.captions.length) {
      result = false;
    } else {
      result = true;
      captions = clip.captions;
    }

    return { exists: result, captions };
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
