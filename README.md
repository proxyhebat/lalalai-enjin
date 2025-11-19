# Lalalai Enjin

![Banner](public/images/placeholder.jpeg)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.0+-orange)](https://www.convex.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--5--mini-green)](https://openai.com/)

Just another project that takes YouTube videos and cuts them into short viral clips using AI. Nobody will care, but here it is.

## What it does

- Downloads YouTube vids
- Transcribes audio with Whisper
- AI finds the juicy parts
- Slices into 45-60s clips
- Stores them somewhere

## Tech stuff

- Next.js, React, TS, Tailwind
- Convex for backend
- OpenAI GPT-5-mini + Whisper
- FFmpeg, yt-dlp for video stuff

## Setup (if you care)

Need Node >=18, pnpm, FFmpeg, yt-dlp, OpenAI key, Convex account.

1. Clone it: `git clone https://github.com/aryasena/lalalai-enjin.git && cd lalalai-enjin`
2. Install: `pnpm install`
3. Env: `cp .env.example .env.local` (add your keys)
4. Convex: `npx convex dev --once`
5. Run: `pnpm dev`

## How to use

Paste a YouTube URL, wait, get clips. Easy.

## Code structure

```
app/          # Next.js stuff
components/   # React bits
enjin/        # Backend logic
lib/          # Utils
public/       # Images etc.
```

## API stuff

Mutations: `kickstartClipsGenerationWorkflow`, `patch`

Queries: `getSlicedVideos`, `preWorkflowChecks`

## Contributing

Fork it, make changes, PR. Whatever.

## License

MIT, do what you want.

## Thanks to

- Convex
- OpenAI
- Remotion
- shadcn/ui
- tweakcn
