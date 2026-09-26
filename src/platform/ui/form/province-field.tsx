"use client";

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { PROVINCES } from "@/platform/geo/provinces";

/**
 * The province, picked from the 81 by typing a few letters (the owner asked on 2026-09-26 that a
 * field whose answers are known is never typed freely). An empty value means none is chosen.
 */
export function ProvinceField({
  id,
  value,
  onChange,
  label = "İl",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={PROVINCES}
        onValueChange={(picked: string | null) => onChange(picked ?? "")}
        value={value || null}
      >
        <ComboboxInput id={id} placeholder="İl arayın" showClear />
        <ComboboxPopup>
          <ComboboxEmpty>Bu adla il yok.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </Field>
  );
}
