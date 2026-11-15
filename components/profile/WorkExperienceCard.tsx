"use client";

import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { FilledBadge } from "@/components/profile/FilledBadge";
import { useIsFilled } from "@/components/profile/FilledFieldsContext";
import { FormField } from "@/components/profile/FormField";
import { labelClass, raisedInputClass } from "@/components/profile/fieldStyles";
import type { WorkExperienceEntry } from "@/types";

type Props = {
  index: number;
  entry: WorkExperienceEntry;
  onRemove?: () => void;
};

export function WorkExperienceCard({ index, entry, onRemove }: Props) {
  const id = useId();
  const [current, setCurrent] = useState(entry.current);
  const field = (name: string) => `workExperience.${index}.${name}`;
  const endDateFilled = useIsFilled(field("endDate"));

  return (
    <div className="relative rounded-xl border border-border bg-surface-secondary p-5">
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove role ${index + 1}`}
          className="absolute top-3 right-3 rounded-md p-1.5 text-text-muted hover:bg-surface-tertiary hover:text-text-primary"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <FormField label="Company Name" htmlFor={`${id}-company`} name={field("company")}>
          <input id={`${id}-company`} name={field("company")} type="text" placeholder="E.g. Acme Inc." defaultValue={entry.company} className={raisedInputClass} />
        </FormField>
        <FormField label="Job Title" htmlFor={`${id}-title`} name={field("title")}>
          <input id={`${id}-title`} name={field("title")} type="text" placeholder="E.g. Frontend Engineer" defaultValue={entry.title} className={raisedInputClass} />
        </FormField>
        <FormField label="Start Date" htmlFor={`${id}-start`} name={field("startDate")}>
          <input id={`${id}-start`} name={field("startDate")} type="month" defaultValue={entry.startDate} className={raisedInputClass} />
        </FormField>
        <div className="group/field" data-filled={endDateFilled ? "true" : undefined}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor={`${id}-end`} className={labelClass}>
                End Date
              </label>
              {endDateFilled ? <FilledBadge /> : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                name={field("current")}
                checked={current}
                onChange={(event) => setCurrent(event.target.checked)}
                className="size-4 accent-accent"
              />
              Currently working here
            </label>
          </div>
          <input id={`${id}-end`} name={field("endDate")} type="month" disabled={current} defaultValue={entry.endDate} className={raisedInputClass} />
        </div>
        <FormField label="Key Responsibilities" htmlFor={`${id}-responsibilities`} name={field("responsibilities")} className="sm:col-span-2">
          <textarea
            id={`${id}-responsibilities`}
            name={field("responsibilities")}
            rows={3}
            placeholder="Describe what you built, owned or improved."
            defaultValue={entry.responsibilities}
            className={`${raisedInputClass} resize-y`}
          />
        </FormField>
      </div>
    </div>
  );
}
