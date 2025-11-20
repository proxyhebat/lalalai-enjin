import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { use } from "react";

import { api } from "@/enjin/_generated/api";
import { Id } from "@/enjin/_generated/dataModel";

import Client from "./client";

export default function Page({
  params
}: {
  params: Promise<{ id: Id<"clips"> }>;
}) {
  const usedParams = use(params);
  return <Client clipId={usedParams.id} />;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: Id<"clips"> }>;
}): Promise<Metadata> {
  const clipId = (await params).id;

  try {
    const clip = await fetchQuery(api.clips.get, { id: clipId });
    if (!clip) {
      return redirect("/not-found");
    }
  } catch (error) {
    console.error(error);
    return redirect("/not-found");
  }

  return {
    title: clipId + " - Enjin Clips"
  };
}
