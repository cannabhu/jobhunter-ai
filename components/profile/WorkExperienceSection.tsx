"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { WorkExperienceCard } from "@/components/profile/WorkExperienceCard";
import type { WorkExperienceEntry } from "@/types";

const MAX_ROLES = 3;

const BLANK_ROLE: WorkExperienceEntry = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  current: false,
  responsibilities: "",
};

type Props = {
  initialRoles: WorkExperienceEntry[];
};

export function WorkExperienceSection({ initialRoles }: Props) {
  const nextKey = useRef(initialRoles.length);
  const [roles, setRoles] = useState(() =>
    initialRoles.map((entry, key) => ({ key, entry })),
  );
  const canAdd = roles.length < MAX_ROLES;

  const addRole = () => {
    if (!canAdd) return;
    setRoles([...roles, { key: nextKey.current++, entry: BLANK_ROLE }]);
  };

  const removeRole = (key: number) => setRoles(roles.filter((role) => role.key !== key));

  return (
    <ProfileSection
      title="Work Experience"
      fieldPrefixes={["workExperience."]}
      action={
        <button
          type="button"
          onClick={addRole}
          disabled={!canAdd}
          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark disabled:text-text-muted"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add role
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {roles.map(({ key, entry }, index) => (
          <WorkExperienceCard
            key={key}
            index={index}
            entry={entry}
            onRemove={roles.length > 1 ? () => removeRole(key) : undefined}
          />
        ))}
      </div>
    </ProfileSection>
  );
}
