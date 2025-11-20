import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    GOOGLE_API_KEY: z.string().min(1)
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.url()
  },
  runtimeEnv: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL
  }
});
