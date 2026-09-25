"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { CURRENCIES } from "@/modules/prj/domain/project";
import { ChoiceField, NONE, type Choice } from "@/platform/ui/form/choice-field";

/**
 * The project card's fields (TASK-0123 step 1, REQ-PRJ-002, REQ-PRJ-010), shared by "new project"
 * and "edit card". The three durations are three fields with their own words (PRJ-K5); the
 * contract value is asked only of a person who may see it (D-292 rule 6).
 */

export type ProjectFormValue = {
  code: string;
  name: string;
  clientPartyId: string;
  authority: string;
  city: string;
  location: string;
  contractNo: string;
  contractSignedOn: string;
  contractStartOn: string;
  contractEndOn: string;
  theoreticalEndOn: string;
  managementTargetEndOn: string;
  coordinatorUserId: string;
};

export type ContractFormValue = { contractValue: string; currency: string };

export const EMPTY_PROJECT: ProjectFormValue = {
  authority: "",
  city: "",
  clientPartyId: "",
  code: "",
  contractEndOn: "",
  contractNo: "",
  contractSignedOn: "",
  contractStartOn: "",
  coordinatorUserId: "",
  location: "",
  managementTargetEndOn: "",
  name: "",
  theoreticalEndOn: "",
};

export const EMPTY_CONTRACT: ContractFormValue = { contractValue: "", currency: "TRY" };

export function ProjectForm({
  value,
  onChange,
  clients,
  people,
  contract,
  onContractChange,
  idPrefix,
}: {
  value: ProjectFormValue;
  onChange: (value: ProjectFormValue) => void;
  clients: readonly Choice[];
  people: readonly Choice[];
  /** Present only for a person who may see the contract value. */
  contract?: ContractFormValue;
  onContractChange?: (value: ContractFormValue) => void;
  idPrefix: string;
}) {
  const set = (patch: Partial<ProjectFormValue>) => onChange({ ...value, ...patch });
  const field = (name: string) => `${idPrefix}-${name}`;
  const text = (
    name: keyof ProjectFormValue,
    label: string,
    extra: { placeholder?: string; wide?: boolean; type?: string } = {},
  ) => (
    <Field className={extra.wide ? "sm:col-span-2" : undefined}>
      <FieldLabel htmlFor={field(name)}>{label}</FieldLabel>
      <Input
        id={field(name)}
        onChange={(event) => set({ [name]: event.currentTarget.value })}
        placeholder={extra.placeholder}
        type={extra.type}
        value={value[name]}
      />
    </Field>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {text("code", "Proje kodu", { placeholder: "2026-014" })}
      {text("name", "Proje adı", { placeholder: "Kavaklı istinat duvarları" })}
      <ChoiceField
        description="İşveren rolü olan firmalar. Yoksa önce firma kartını açın."
        items={[{ label: "Seçilmedi", value: NONE }, ...clients]}
        label="İşveren"
        onChange={(picked) => set({ clientPartyId: picked })}
        value={value.clientPartyId}
      />
      {text("authority", "Kurum / idare", { placeholder: "Karayolları 5. Bölge" })}
      {text("city", "İl")}
      {text("location", "Lokasyon", { placeholder: "Km 12+300 – 12+850" })}
      <ChoiceField
        items={[{ label: "Seçilmedi", value: NONE }, ...people]}
        label="Sorumlu koordinatör"
        onChange={(picked) => set({ coordinatorUserId: picked })}
        value={value.coordinatorUserId}
      />
      {text("contractNo", "Sözleşme numarası")}

      <Fieldset className="sm:col-span-2">
        <FieldsetLegend className="text-sm font-medium">Süreler</FieldsetLegend>
        <p className="text-xs text-muted-foreground">
          Üç süre ayrı ayrı girilir; biri diğerinden hesaplanmaz.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("contractSignedOn", "Sözleşme tarihi", { type: "date" })}
          {text("contractStartOn", "Sözleşme başlangıcı", { type: "date" })}
          <Field>
            <FieldLabel htmlFor={field("contractEndOn")}>Sözleşmedeki bitiş</FieldLabel>
            <Input
              id={field("contractEndOn")}
              onChange={(event) => set({ contractEndOn: event.currentTarget.value })}
              type="date"
              value={value.contractEndOn}
            />
            <FieldDescription>İşverene karşı resmî süre.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={field("theoreticalEndOn")}>Teorik bitiş</FieldLabel>
            <Input
              id={field("theoreticalEndOn")}
              onChange={(event) => set({ theoreticalEndOn: event.currentTarget.value })}
              type="date"
              value={value.theoreticalEndOn}
            />
            <FieldDescription>Mevcut ekip ve kaynaklarla beklenen.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={field("managementTargetEndOn")}>Yönetim hedef bitişi</FieldLabel>
            <Input
              id={field("managementTargetEndOn")}
              onChange={(event) => set({ managementTargetEndOn: event.currentTarget.value })}
              type="date"
              value={value.managementTargetEndOn}
            />
            <FieldDescription>Daha hızlı bitirmek için konan iç hedef.</FieldDescription>
          </Field>
        </div>
      </Fieldset>

      {contract && onContractChange ? (
        <>
          <Field>
            <FieldLabel htmlFor={field("contract-value")}>Sözleşme bedeli</FieldLabel>
            <Input
              id={field("contract-value")}
              inputMode="decimal"
              onChange={(event) =>
                onContractChange({ ...contract, contractValue: event.currentTarget.value })
              }
              placeholder="12.500.000"
              value={contract.contractValue}
            />
            <FieldDescription>Ticari bilgi; yalnız ticari yetkisi olan görür.</FieldDescription>
          </Field>
          <ChoiceField
            items={CURRENCIES.map((currency) => ({ label: currency, value: currency }))}
            label="Para birimi"
            onChange={(picked) => onContractChange({ ...contract, currency: picked })}
            value={contract.currency}
          />
        </>
      ) : null}
    </div>
  );
}
