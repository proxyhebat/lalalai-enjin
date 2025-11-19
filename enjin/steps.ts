"use node";

import { spawn } from "child_process";
import path from "path";

import { createThread } from "@convex-dev/agent";
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  toCaptions
} from "@remotion/install-whisper-cpp";
import { v } from "convex/values";

import { Caption } from "@/lib/types";

import { components, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { clipper } from "./agents/clipper";
import { clipperOutputSchema } from "./schemas/clipper";

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
    await Promise.all([
      // Install Whisper if needed
      installWhisperCpp({
        to: path.join(process.cwd(), "whisper.cpp"),
        version: "1.5.5"
      }),
      // Download Whisper model if needed
      downloadWhisperModel({
        model: "base",
        folder: path.join(process.cwd(), "whisper.cpp")
      })
    ]);

    const whisperCppOutput = await transcribe({
      inputPath: args.filepath,
      whisperPath: path.join(process.cwd(), "whisper.cpp"),
      whisperCppVersion: "1.5.5",
      model: "base",
      tokenLevelTimestamps: true
    });

    const { captions } = toCaptions({
      whisperCppOutput
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
    captions: v.any()
  },
  handler: async (ctx, args) => {
    const threadId = await createThread(ctx, components.agent);

    const prompt = `Analyze this video transcript and identify 3-5 high-value clip opportunities.

Transcript with timestamps:
${args.captions.map((c: Caption) => `[${(c.startMs / 1000).toFixed(1)}s - ${(c.endMs / 1000).toFixed(1)}s] ${c.text}`).join("\n")}

**IMPORTANT NOTE**:

- Only include clips that are relevant to the main topic of the video.
- Avoid including clips that are too short or too long.
- Make sure the clips are visually interesting and engaging.
- Use a variety of angles and perspectives to create a dynamic video.
- Consider the audience and their interests when selecting clips.
- Response in JSON only as defined by the schema. No Additional Information or Reply.
`;

    const result = await clipper.generateObject(
      ctx,
      { threadId },
      {
        prompt,
        output: "object",
        schema: clipperOutputSchema
      }
    );

    const clips = result.object;

    await ctx.runMutation(internal.clips.patch, {
      id: args.clipsId,
      data: {
        status: "Editing the clips",
        progress: 50,
        clips
      }
    });

    return clips;
  }
});
