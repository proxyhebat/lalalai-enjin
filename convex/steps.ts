"use node";

import { spawn } from "child_process";
import path from "path";

import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  convertToCaptions
} from "@remotion/install-whisper-cpp";
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
    filepath: v.string()
  },
  handler: async (ctx, args) => {
    return new Promise((resolve, reject) => {
      // Extract video metadata including FPS
      const probeTask = spawn(
        "ffprobe",
        [
          "-v",
          "quiet",
          "-print_format",
          "json",
          "-show_format",
          "-show_streams",
          args.filepath
        ],
        {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env }
        }
      );

      let probeOutput = "";
      probeTask.stdout.on("data", (data) => {
        probeOutput += data.toString();
      });

      probeTask.on("close", async (code) => {
        if (code != 0) {
          reject("Error while trying to download the video");
        }

        try {
          const metadata = JSON.parse(probeOutput);
          const videoStream = metadata.streams.find(
            (s: { codec_type: string }) => s.codec_type === "video"
          );

          const fps = videoStream ? videoStream.r_frame_rate : 30; // fallback to 30

          await ctx.runMutation(internal.clips.patch, {
            id: args.clipsId,
            data: {
              status: "Extracting Audio",
              progress: 15,
              videoFps: fps // Store the real FPS
            }
          });

          resolve(void 0);
        } catch (error) {
          await ctx.runMutation(internal.clips.patch, {
            id: args.clipsId,
            data: {
              status: "Failed while parsing media metadata",
              progress: 0,
              error
            }
          });
          reject("Failed while parsing media metadata");
        }
      });
    });
  }
});

//extract audio using ffmpeg
export const extractAudio = internalAction({
  args: {
    clipsId: v.id("clips"),
    filepath: v.string()
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return new Promise<string>((resolve, reject) => {
      const outputPath = path.join(process.cwd(), `${args.clipsId}.wav`);

      const extractTask = spawn(
        "ffmpeg",
        [
          "-i",
          args.filepath,
          "-ar",
          "16000",
          "-ac",
          "2",
          "-c:a",
          "pcm_s16le",
          outputPath,
          "-y"
        ],
        {
          stdio: "inherit",
          env: { ...process.env }
        }
      );

      extractTask.on("close", async (code) => {
        if (code !== 0) {
          reject(new Error(`Audio extraction failed with code ${code}`));
        }

        await ctx.runMutation(internal.clips.patch, {
          id: args.clipsId,
          data: {
            status: "Transcribing Audio",
            progress: 20
          }
        });

        resolve(outputPath);
      });

      extractTask.on("error", (error) => {
        console.error("Extraction error:", error);
        reject(error);
      });
    });
  }
});

//transcribe audio using whisper.cpp
export const transcribeAudio = internalAction({
  args: {
    clipsId: v.id("clips"),
    filepath: v.string()
  },
  handler: async (ctx, args) => {
    // Install Whisper if needed
    const { alreadyExisted: _whisperExist } = await installWhisperCpp({
      to: path.join(process.cwd(), "whisper.cpp"),
      version: "1.5.5"
    });

    const { alreadyExisted: _modelExist } = await downloadWhisperModel({
      model: "base",
      folder: path.join(process.cwd(), "whisper.cpp")
    });

    const { transcription } = await transcribe({
      inputPath: args.filepath,
      whisperPath: path.join(process.cwd(), "whisper.cpp"),
      whisperCppVersion: "1.5.5",
      model: "base",
      tokenLevelTimestamps: true
    });

    const { captions } = convertToCaptions({
      transcription,
      combineTokensWithinMilliseconds: 200
    });

    // Update captions in database
    await ctx.runMutation(internal.clips.patch, {
      id: args.clipsId,
      data: {
        status: "Analyzing & Understanding the video",
        progress: 30,
        captions
      }
    });

    return captions;
  }
});

//llm analyze potential viral clips on the video using transcribed audio
export const analyzeTranscription = internalAction({
  args: {
    clipsId: v.id("clips"),
    filepath: v.string()
  },
  handler: async (ctx, args) => {}
});
