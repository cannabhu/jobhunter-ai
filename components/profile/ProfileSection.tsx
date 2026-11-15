import { useId, type ReactNode } from "react";
import { sectionHeadingClass } from "@/components/profile/fieldStyles";

type Props = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ProfileSection({ title, action, children }: Props) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="border-t border-border py-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 id={headingId} className={sectionHeadingClass}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}
