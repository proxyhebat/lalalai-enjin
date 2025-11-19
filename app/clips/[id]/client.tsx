import { useQuery } from "convex/react";

import { api } from "@/enjin/_generated/api";
import { Id } from "@/enjin/_generated/dataModel";

export default function Client({ clipId }: { clipId: Id<"clips"> }) {
  const clips = useQuery(api.clips.get, { id: clipId });

  return (
    <div>
      <h1>Clip Client</h1>
      <p>This is the client component for a specific clip.</p>
    </div>
  );
}
