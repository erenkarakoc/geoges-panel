"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PARTY_ROLES,
  ROLE_LABELS,
  ROLE_NOTES,
  taxNoWarning,
  type PartyRole,
} from "@/modules/crm/domain/party";
import { ProvinceField } from "@/platform/ui/form/province-field";

/**
 * The firm card's fields (TASK-0122), shared by "new firm" and "edit card". Only the name and one
 * role are required; everything else can wait for the first invoice.
 */

export type PartyFormValue = {
  name: string;
  roles: PartyRole[];
  taxNo: string;
  taxOffice: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  note: string;
};

export const EMPTY_PARTY: PartyFormValue = {
  address: "",
  city: "",
  email: "",
  name: "",
  note: "",
  phone: "",
  roles: [],
  taxNo: "",
  taxOffice: "",
};

export function PartyForm({
  value,
  onChange,
  idPrefix,
}: {
  value: PartyFormValue;
  onChange: (value: PartyFormValue) => void;
  /** Keeps the field ids apart when two forms can exist on one page. */
  idPrefix: string;
}) {
  const set = (patch: Partial<PartyFormValue>) => onChange({ ...value, ...patch });
  const warning = taxNoWarning(value.taxNo);
  const field = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={field("name")}>Firma unvanı</FieldLabel>
        <Input
          id={field("name")}
          onChange={(event) => set({ name: event.currentTarget.value })}
          placeholder="Örnek İnşaat Sanayi ve Ticaret Ltd. Şti."
          value={value.name}
        />
        <FieldDescription>Faturadaki gibi yazın.</FieldDescription>
      </Field>

      <Fieldset className="sm:col-span-2">
        <FieldsetLegend className="text-sm font-medium">Rolleri</FieldsetLegend>
        <CheckboxGroup
          aria-label="Firmanın rolleri"
          className="grid gap-3 sm:grid-cols-2"
          onValueChange={(roles) => set({ roles: roles as PartyRole[] })}
          value={value.roles}
        >
          {PARTY_ROLES.map((role) => (
            <Label className="items-start" key={role}>
              <Checkbox value={role} />
              <span className="flex flex-col">
                <span>{ROLE_LABELS[role]}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {ROLE_NOTES[role]}
                </span>
              </span>
            </Label>
          ))}
        </CheckboxGroup>
      </Fieldset>

      <Field>
        <FieldLabel htmlFor={field("tax-no")}>Vergi numarası</FieldLabel>
        <Input
          id={field("tax-no")}
          inputMode="numeric"
          onChange={(event) => set({ taxNo: event.currentTarget.value })}
          value={value.taxNo}
        />
        <FieldDescription className={warning ? "text-warning-foreground" : undefined}>
          {warning ?? "Şahıs firmasında kimlik numarası. Aynı numarayla ikinci kart açılmaz."}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={field("tax-office")}>Vergi dairesi</FieldLabel>
        <Input
          id={field("tax-office")}
          onChange={(event) => set({ taxOffice: event.currentTarget.value })}
          value={value.taxOffice}
        />
      </Field>
      <ProvinceField id={field("city")} onChange={(city) => set({ city })} value={value.city} />
      <Field>
        <FieldLabel htmlFor={field("phone")}>Telefon</FieldLabel>
        <Input
          id={field("phone")}
          inputMode="tel"
          onChange={(event) => set({ phone: event.currentTarget.value })}
          type="tel"
          value={value.phone}
        />
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={field("email")}>E-posta</FieldLabel>
        <Input
          id={field("email")}
          inputMode="email"
          onChange={(event) => set({ email: event.currentTarget.value })}
          type="email"
          value={value.email}
        />
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={field("address")}>Adres</FieldLabel>
        <Textarea
          id={field("address")}
          onChange={(event) => set({ address: event.currentTarget.value })}
          rows={2}
          value={value.address}
        />
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={field("note")}>Not</FieldLabel>
        <Textarea
          id={field("note")}
          onChange={(event) => set({ note: event.currentTarget.value })}
          rows={2}
          value={value.note}
        />
      </Field>
    </div>
  );
}
