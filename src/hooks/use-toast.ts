// toast.ts

import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import type { ToastOptions } from "@/types";

// Optional: default values
const TOAST_DURATION = 2000; // default duration in ms

// Re-export types
export type { ToastOptions, ToastAction } from "@/types";

export function toast({
  title,
  description,
  action,
  duration,
  variant = "default",
}: ToastOptions) {
  // Enforce only one toast at a time
  sonnerToast.dismiss();

  // Map variant to sonner's toast types
  const toastFn =
    variant === "destructive"
      ? sonnerToast.error
      : variant === "success"
      ? sonnerToast.success
      : variant === "warning"
      ? sonnerToast.warning
      : sonnerToast;

  const id = toastFn(title ?? "", {
    description,
    duration: duration === null ? Infinity : duration ?? TOAST_DURATION,
    action:
      action !== undefined
        ? {
            label: action.label,
            onClick: () => {
              action.onClick();
              sonnerToast.dismiss(id); // optional: auto dismiss after action
            },
          }
        : undefined,
  });

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (updated: ToastOptions) => {
      sonnerToast(title ?? "", {
        id,
        description: updated.description ?? description,
        duration:
          updated.duration === null
            ? Infinity
            : updated.duration ?? duration ?? TOAST_DURATION,
        action:
          updated.action !== undefined
            ? {
                label: updated.action.label,
                onClick: () => {
                  updated.action!.onClick();
                  sonnerToast.dismiss(id);
                },
              }
            : action
            ? {
                label: action.label,
                onClick: () => {
                  action!.onClick();
                  sonnerToast.dismiss(id);
                },
              }
            : undefined,
      });
    },
  };
}

// Optional helper for global dismiss
toast.dismiss = (id?: string | number) => {
  sonnerToast.dismiss(id);
};

export function useToast() {
  return { toast } as const;
}

// Optional Toaster re-export for convenience
export const Toaster = SonnerToaster;
