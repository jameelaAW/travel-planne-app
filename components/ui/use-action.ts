"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/data/types";

export const NETWORK_ERROR = "Could not save. Check your connection and retry.";

/**
 * Runs a server action with pending state and turns thrown errors
 * (e.g. network failure) into a friendly message instead of a crash.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function run<T>(fn: () => Promise<ActionResult<T>>, onSuccess?: (data?: T) => void) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.ok) {
          setFieldErrors({});
          onSuccess?.(res.data);
        } else {
          setError(res.error);
          setFieldErrors(res.fieldErrors ?? {});
        }
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  }

  return { pending, error, fieldErrors, setError, setFieldErrors, run };
}
