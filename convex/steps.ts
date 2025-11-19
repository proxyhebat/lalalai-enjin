"use node";

import { spawn } from "child_process";
import path from "path";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

//download video using yt-dlp
export const download = internalAction({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  returns: v.string(), // returns path to a video
  handler: async (ctx, args): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const downloadTask = spawn(
        "yt-dlp",
        [args.youtubeURL, "-f", "mp4", "-o", `${args.clipsId}.%(ext)s`],
        {
          stdio: "inherit",
          env: { ...process.env }
        }
      );

      downloadTask.on("close", (code) => {
        if (code != 0) {
          reject("Error while trying to download the video");
        }

        const filepath = path.resolve(process.cwd(), `${args.clipsId}.mp4`);

        // update status & progress
        ctx.runMutation(internal.clips.patch, {
          id: args.clipsId,
          data: {
            status: "Extracting Metadata",
            progress: 10
          }
        });

        resolve(filepath);
      });
    });
  }
});

//extract media information using ffprobe
export const extractMediaInfo = internalAction({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (ctx, args) => {}
});

//extract audio using ffmpeg
export const extractAudio = internalAction({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (ctx, args) => {}
});

//transcribe audio using whisper.cpp
export const transcribeAudio = internalAction({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (ctx, args) => {}
});

//llm analyze potential viral clips on the video using transcribed audio
export const analyzeTranscription = internalAction({
  args: {
    clipsId: v.id("clips"),
    youtubeURL: v.string()
  },
  handler: async (ctx, args) => {}
});
