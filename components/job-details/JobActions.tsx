type Props = {
  company: string;
  /** Null when the job has no usable link, which hides the button. */
  applyUrl: string | null;
};

export function JobActions({ company, applyUrl }: Props) {
  if (!applyUrl) return null;

  return (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark"
    >
      Apply Now at {company}
    </a>
  );
}
