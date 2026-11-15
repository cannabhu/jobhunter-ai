import { ChevronDown } from "lucide-react";
import { raisedInputClass } from "@/components/profile/fieldStyles";

type Option = { value: string; label: string };

type Props = {
  id: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
};

export function SelectInput({ id, name, options, defaultValue = "", placeholder }: Props) {
  return (
    <div className="relative">
      <select id={id} name={name} defaultValue={defaultValue} className={`${raisedInputClass} appearance-none pr-10`}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-text-secondary"
        aria-hidden="true"
      />
    </div>
  );
}
