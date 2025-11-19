import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
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
  const clip = await fetchQuery(api.clips.get, { id: clipId });
  return {
    title: clip?._id + " - Enjin Clips"
  };
}
