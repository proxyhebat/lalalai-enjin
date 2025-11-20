"use client";

import { Player } from "@remotion/player";
import { useQuery } from "convex/react";
import Link from "next/link";
import { toast } from "sonner";

import { wipToast } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { api } from "@/enjin/_generated/api";
import { Id } from "@/enjin/_generated/dataModel";
import { CaptionedVideo } from "@/remotion/CaptionedVideo";

// dummy
const VIDEO_HEIGHT = 1080;
const VIDEO_WIDTH = 1920;

export default function Client({ clipId }: { clipId: Id<"clips"> }) {
  const clip = useQuery(api.clips.get, { id: clipId });
  return (
    <div className="bg-card mt-16 min-h-screen font-sans">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* VideoHeader */}
        <div className="rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="shrink-0">
              <div className="bg-secondary rounded-xl p-1.5">
                <div className="bg-muted h-48 w-full max-w-sm rounded object-cover"></div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-foreground mb-2 text-2xl font-semibold">
                  Video Title
                </h1>
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-foreground font-medium">
                    Channel Name
                  </span>
                  <span>•</span>
                  <span>4:13</span>
                  <span>•</span>
                  <span className="uppercase">HD</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-foreground line-clamp-3">
                  Video description here.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-outline text-outline-foreground rounded px-2 py-1 text-xs">
                    #tag1
                  </span>
                  <span className="bg-outline text-outline-foreground rounded px-2 py-1 text-xs">
                    #tag2
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button>View Original</Button>
              </div>
            </div>
          </div>
        </div>
        {/* ProcessingStatus */}
        <div className="rounded-lg p-6 shadow-sm">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Processing Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Status</span>
              <span className="text-muted-foreground">Processing</span>
            </div>
            <div className="bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-1/2"></div>
            </div>
          </div>
        </div>
        {/* GeneratedClips */}
        <div className="rounded-lg p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">
              Generated Clips
            </h2>
            <div className="flex gap-2">
              <Button onClick={wipToast}>Share All</Button>
              <Button onClick={wipToast}>Download All</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clip?.clips?.map((x) => (
              <div key={x.title}>
                <div className="bg-muted/50 border border-border overflow-hidden rounded-lg">
                  <div className="bg-muted relative aspect-video">
                    <Player
                      className="absolute"
                      component={CaptionedVideo}
                      inputProps={{
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        clipData: x as any,
                        captions: clip.captions ?? []
                      }}
                      fps={Number(clip.videoFps?.split("/")[0] ?? 30)}
                      compositionHeight={VIDEO_HEIGHT}
                      compositionWidth={VIDEO_WIDTH}
                      style={{
                        // Can't use tailwind class for width since player's default styles take presedence over tailwind's,
                        // but not over inline styles
                        width: "100%"
                      }}
                      durationInFrames={
                        Math.round(x.targetDurationMs / 1000) *
                        Number(clip.videoFps?.split("/")[0] ?? 30)
                      }
                      controls
                      // autoPlay
                      // loop
                    />
                    <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {Math.round(x.targetDurationMs / 1000)}s
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-foreground mb-2 line-clamp-2 font-medium">
                      {x.title}
                    </h3>
                    <div className="flex gap-2">
                      <Button onClick={wipToast}>Download</Button>
                      <Button onClick={wipToast}>Share</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button asChild>
              <Link href="/new">Generate More Clips</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
