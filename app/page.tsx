import Image from "next/image";

import { DemoForm } from "@/components/forms/demo/form";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 md:flex-row max-w-5xl mx-auto min-h-screen items-center justify-center px-8 lg:px-16">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 sm:items-start">
        <Image
          className="hue-rotate-360 grayscale-75 scale-110"
          src="/logo.svg"
          alt="LaLaLai logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-black dark:text-zinc-50">
            Welcome to <span className="text-primary">La</span>
            <span className="text-secondary">La</span>
            <span className="text-accent">La</span>i
          </h1>
          <h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-black dark:text-zinc-50">
            To get started, enter the YouTube URL!
          </h1>
          <DemoForm />
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Found a bug or want to suggest a new feature? Contribute to the{" "}
            <a
              href="https://codeberg.org/aryasena/lalalai-enjin"
              className="font-medium text-accent underline"
            >
              Source
            </a>{" "}
            or the{" "}
            <a
              href="https://codeberg.org/aryasena/lalalai-enjin/issues"
              className="font-medium text-accent underline"
            >
              Open an Issue
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="bg-primary hover:bg-primary/80 text-background flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 transition-colors md:w-[158px]"
            href="https://codeberg.org/aryasena/lalalai-enjin"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-secondary text-secondary hover:border-secondary/80 hover:text-secondary/80 px-5 transition-colors md:w-[158px]"
            href="https://codeberg.org/aryasena/lalalai-enjin/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open an Issue
          </a>
        </div>
      </main>
      <Image
        src="/images/placeholder.jpeg"
        alt="LaLaLai logo"
        width={800}
        height={800}
        priority
      />
    </div>
  );
}
