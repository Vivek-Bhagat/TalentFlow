/**
 * Toast notification types
 */

import * as React from "react";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastAction;
  duration?: number | null;
  variant?: "default" | "destructive" | "success" | "warning";
};

export interface StoredNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
