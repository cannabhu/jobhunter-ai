"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Names of the form fields whose current value came from the resume (see `mergeExtractedValues`). */
const FilledFieldsContext = createContext<ReadonlySet<string>>(new Set());

export function FilledFieldsProvider({ fields, children }: { fields: ReadonlySet<string>; children: ReactNode }) {
  return <FilledFieldsContext value={fields}>{children}</FilledFieldsContext>;
}

export const useFilledFields = (): ReadonlySet<string> => useContext(FilledFieldsContext);

export function useIsFilled(name: string | undefined): boolean {
  const fields = useFilledFields();
  return name !== undefined && fields.has(name);
}

/** True when any filled field name starts with one of the prefixes — used for section headers. */
export function useAnyFilled(prefixes: readonly string[]): boolean {
  const fields = useFilledFields();
  for (const field of fields) {
    if (prefixes.some((prefix) => field.startsWith(prefix))) return true;
  }
  return false;
}
