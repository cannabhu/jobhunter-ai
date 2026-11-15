import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type Props = {
  label: string;
  name: string;
  options: Option[];
  defaultValue: string;
  emphasized?: boolean;
};

export function FilterSelect({ label, name, options, defaultValue, emphasized = false }: Props) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        name={name}
        defaultValue={defaultValue}
        className={`cursor-pointer appearance-none rounded-md border border-border bg-surface py-1.5 pr-9 pl-4 text-sm font-medium shadow-card focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
          emphasized ? "text-text-primary" : "text-text-dark"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary"
        aria-hidden="true"
      />
    </div>
  );
}
