const base =
  "w-full rounded-md border border-border px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent group-data-[filled=true]/field:border-accent group-data-[filled=true]/field:bg-accent-muted";

/** Gray while it holds a value, white (with a soft shadow) while empty — so unfilled fields stand out. */
export const inputClass = `${base} bg-surface-secondary placeholder-shown:bg-surface placeholder-shown:shadow-card disabled:bg-surface-tertiary disabled:text-text-muted disabled:shadow-none read-only:text-text-secondary read-only:focus:border-border read-only:focus:bg-surface-secondary read-only:focus:ring-0`;

/** Always white — for fields flagged as missing, and for inputs sitting on a gray card. */
export const raisedInputClass = `${base} bg-surface shadow-card disabled:bg-surface-tertiary disabled:text-text-muted disabled:shadow-none`;

export const labelClass = "block text-xs font-semibold uppercase tracking-wide text-text-dark";

export const sectionHeadingClass = "text-base font-semibold text-text-primary";
