"use client";

import { useQuery } from "convex/react";

import { api } from "@/enjin/_generated/api";
import { Id } from "@/enjin/_generated/dataModel";

export default function Client({ clipId }: { clipId: Id<"clips"> }) {
  const _clip = useQuery(api.clips.get, { id: clipId });

  return <>dawda</>;
}
