import { v } from "convex/values";

import { query } from "./_generated/server";

export const getFileUrl = query({
  args: {
    fileId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.fileId);
    return url;
  }
});

export const getFileUrls = query({
  args: {
    fileIds: v.array(v.id("_storage"))
  },
  handler: async (ctx, args) => {
    return await Promise.all(args.fileIds.map((id) => ctx.storage.getUrl(id)));
  }
});
