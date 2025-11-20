import { createTikTokStyleCaptions } from "@remotion/captions";
import { useEffect, useMemo } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useVideoConfig
} from "remotion";

import { Caption, Clip, Editing } from "@/enjin/types";

import { loadFont } from "../load-font";
import SubtitlePage from "./SubtitlePage";

interface Segment extends Editing {
  startFrame: number;
  durationFrames: number;
}

// How many captions should be displayed at a time?
const SWITCH_CAPTIONS_EVERY_MS = 1200;

export const CaptionedVideo: React.FC<{
  clipData: Clip;
  captions: Caption[];
}> = ({ clipData, captions }) => {
  const { fps } = useVideoConfig();

  // Calculate segments
  const segments: Segment[] = useMemo(() => {
    return clipData.editings.reduce((acc, editing) => {
      const durationMs = editing.endMs - editing.startMs;
      const durationFrames = Math.round((durationMs / 1000) * fps);
      const startFrame =
        acc.length === 0
          ? 0
          : acc[acc.length - 1].startFrame + acc[acc.length - 1].durationFrames;
      const segment: Segment = { ...editing, startFrame, durationFrames };
      return [...acc, segment];
    }, [] as Segment[]);
  }, [clipData.editings, fps]);

  // Create global pages for captions
  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      captions: captions ?? []
    });
  }, [captions]);

  useEffect(() => {
    async function loadFonts() {
      await loadFont();
    }
    loadFonts();
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      {segments.map((segment: Segment, segIndex: number) => (
        <Sequence
          key={segIndex}
          from={segment.startFrame}
          durationInFrames={segment.durationFrames}
        >
          <AbsoluteFill>
            <OffthreadVideo
              style={{
                objectFit: "cover"
              }}
              src={`/api/files/${segment.fileId}`}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
      {pages.map((page, index) => {
        // Find which segment this page belongs to
        const segmentIndex = segments.findIndex(
          (seg: Segment) =>
            page.startMs >= seg.startMs && page.startMs < seg.endMs
        );
        if (segmentIndex === -1) return null;

        const segment = segments[segmentIndex];
        const nextPage = pages[index + 1] ?? null;
        const subtitleStartFrame =
          segment.startFrame + ((page.startMs - segment.startMs) / 1000) * fps;
        const subtitleEndFrame = Math.min(
          nextPage
            ? segment.startFrame +
                ((nextPage.startMs - segment.startMs) / 1000) * fps
            : segment.startFrame + segment.durationFrames,
          subtitleStartFrame + (SWITCH_CAPTIONS_EVERY_MS / 1000) * fps
        );
        const durationInFrames = subtitleEndFrame - subtitleStartFrame;
        if (durationInFrames <= 0) return null;

        return (
          <Sequence
            key={index}
            from={subtitleStartFrame}
            durationInFrames={durationInFrames}
          >
            <SubtitlePage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
