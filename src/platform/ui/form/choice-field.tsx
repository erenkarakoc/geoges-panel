"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A labelled COSS select whose closed state shows the chosen name, never the stored value — the
 * select is handed its items for exactly that (the owner saw raw values on 2026-09-25). An empty
 * value shows the placeholder; `NONE` lets a form offer "none" as a real choice.
 */

export type Choice = { value: string; label: string };

/** The value of an explicit "none" choice; forms turn it back into an empty field. */
export const NONE = "__none__";

export function ChoiceField({
  label,
  items,
  value,
  placeholder,
  description,
  onChange,
  className,
}: {
  label: string;
  items: readonly Choice[];
  value: string;
  placeholder?: string;
  description?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        onValueChange={(picked) => onChange(picked === NONE ? "" : String(picked ?? ""))}
        value={value || (items.some((item) => item.value === NONE) ? NONE : "")}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPopup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
