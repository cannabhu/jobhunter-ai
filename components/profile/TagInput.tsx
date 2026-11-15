"use client";

import { Sparkles, X } from "lucide-react";
import { useId, useState } from "react";
import { useFilledFields } from "@/components/profile/FilledFieldsContext";
import { FormField } from "@/components/profile/FormField";
import { inputClass } from "@/components/profile/fieldStyles";

type Props = {
  label: string;
  name: string;
  placeholder: string;
  initialTags: string[];
};

export function TagInput({ label, name, placeholder, initialTags }: Props) {
  const inputId = useId();
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState("");
  const filledFields = useFilledFields();

  const addTag = () => {
    const value = draft.trim();
    if (!value) return;
    const exists = tags.some((tag) => tag.toLowerCase() === value.toLowerCase());
    if (!exists) setTags([...tags, value]);
    setDraft("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((item) => item !== tag));

  return (
    <div>
      <FormField label={label} htmlFor={inputId} name={name} tint={false}>
        <div className="flex gap-3">
          <input
            id={inputId}
            type="text"
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            // Leaving the box commits what was typed, so clicking Save or Extract never drops a half-added tag.
            onBlur={addTag}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addTag();
            }}
            className={inputClass}
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-md bg-surface-tertiary px-4 text-sm font-medium text-text-dark hover:bg-border"
          >
            Add
          </button>
        </div>
      </FormField>
      {tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-3">
          {tags.map((tag) => {
            const fromResume = filledFields.has(`${name}:${tag.toLowerCase()}`);
            return (
            <li
              key={tag}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                fromResume ? "bg-accent-light text-accent" : "bg-surface-tertiary text-text-dark"
              }`}
            >
              {fromResume ? <Sparkles className="size-3" aria-label="From resume" /> : null}
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
              <input type="hidden" name={name} value={tag} />
            </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
