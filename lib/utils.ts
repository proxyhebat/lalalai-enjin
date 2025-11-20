import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const wipToast = () => {
  toast.warning("WIP!", {
    description: "Work in progress",
    duration: Infinity,
    action: {
      label: "Contribute here",
      onClick: () => {
        globalThis.window.open(
          "https://codeberg.org/aryasena/lalalai-enjin",
          "_blank"
        );
      }
    }
  });
};
