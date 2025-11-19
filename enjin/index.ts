import { WorkflowManager } from "@convex-dev/workflow";

import { components } from "./_generated/api";

export const workflow = new WorkflowManager(components.workflow, {
  // the options are configured for minimal workload,
  // as we're still in development - Aryasena <asena@duck.com>
  workpoolOptions: {
    defaultRetryBehavior: {
      maxAttempts: 2, // retries
      initialBackoffMs: 1000, // delay between retries
      base: 2 // exponential backoff factor
    },
    maxParallelism: 5, // maximum number of concurrent tasks
    logLevel: "TRACE", // logging level
    retryActionsByDefault: true // retry actions by default
  }
});
