import { ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogPage } from "@/modules/aud/application/audit";
import {
  AUDIT_EVENT_GROUPS,
  AUDIT_TARGET_TABLES,
  auditActorLabel,
  auditEventLabel,
  auditLogQuery,
  auditTargetLabel,
  type AuditLogFilters,
} from "@/modules/aud/domain/audit-log";
import { ListPagination } from "@/platform/ui/list/list-pagination";
import { formatDayShort } from "@/platform/date/day";
import { ColumnChart } from "@/platform/ui/chart/chart";

const ROUTE = "/audit-log";

const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});
const countFormat = new Intl.NumberFormat("tr-TR");

type Person = { id: string; displayName: string };
type Option = { value: string | null; label: string };

function FilterSelect({
  name,
  label,
  items,
  value,
}: {
  name: string;
  label: string;
  items: Option[];
  value: string | null;
}) {
  const all: Option[] = [{ value: null, label: "Tümü" }, ...items];
  return (
    <Field className="min-w-44 flex-1">
      <FieldLabel>{label}</FieldLabel>
      <Select defaultValue={value} items={all} name={name}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {all.map((item) => (
            <SelectItem key={item.value ?? "all"} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Field>
  );
}

/**
 * SCR-193 Denetim kayıtları (REQ-AUD-005, REQ-AUD-006, REQ-IAM-008): read-only, newest first,
 * filtered by person, operation type, record type and date range. Filters travel in the address,
 * so a filtered view can be bookmarked and shared among owners.
 */
export function AuditLogList({
  data,
  filters,
  people,
}: {
  data: AuditLogPage;
  filters: AuditLogFilters;
  people: readonly Person[];
}) {
  const personName = new Map(people.map((p) => [p.id, p.displayName]));
  const active = [
    filters.actorId && `Kişi: ${personName.get(filters.actorId) ?? "bilinmeyen kişi"}`,
    filters.eventPrefix &&
      `İşlem: ${AUDIT_EVENT_GROUPS.find((g) => g.value === filters.eventPrefix)?.label}`,
    filters.targetTable &&
      `Kayıt türü: ${AUDIT_TARGET_TABLES.find((t) => t.value === filters.targetTable)?.label}`,
    filters.fromDay && `Başlangıç: ${filters.fromDay}`,
    filters.toDay && `Bitiş: ${filters.toDay}`,
  ].filter(Boolean) as string[];

  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Denetim Kayıtları</FrameTitle>
        <FrameDescription>
          Giriş ve çıkışlar, rol ve yetki değişiklikleri, belge arşivleme ve toplu indirmeler, elle
          girilen kurlar, sıfırlamalar ve yapılandırma aktarımları. Kayıtlar değiştirilemez ve
          silinemez.
        </FrameDescription>
      </FrameHeader>

      <FramePanel>
        <form action={ROUTE} className="flex flex-wrap items-end gap-3" method="get">
          <FilterSelect
            items={people.map((p) => ({ value: p.id, label: p.displayName }))}
            label="Kişi"
            name="kisi"
            value={filters.actorId}
          />
          <FilterSelect
            items={AUDIT_EVENT_GROUPS.map((g) => ({ value: g.value, label: g.label }))}
            label="İşlem türü"
            name="islem"
            value={filters.eventPrefix}
          />
          <FilterSelect
            items={AUDIT_TARGET_TABLES.map((t) => ({ value: t.value, label: t.label }))}
            label="Kayıt türü"
            name="kayit"
            value={filters.targetTable}
          />
          <Field className="min-w-36">
            <FieldLabel>Başlangıç</FieldLabel>
            <Input defaultValue={filters.fromDay ?? ""} name="baslangic" type="date" />
          </Field>
          <Field className="min-w-36">
            <FieldLabel>Bitiş</FieldLabel>
            <Input defaultValue={filters.toDay ?? ""} name="bitis" type="date" />
          </Field>
          <Button type="submit">Süz</Button>
        </form>
        {active.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {active.map((text) => (
              <Badge key={text} variant="outline">
                {text}
              </Badge>
            ))}
            <Button render={<Link href={ROUTE} />} size="sm" variant="ghost">
              Temizle
            </Button>
          </div>
        )}
      </FramePanel>

      <FramePanel>
        <h3 className="mb-2 text-sm font-medium">Son 14 günün kayıtları</h3>
        <ColumnChart
          columns={data.perDay.map((one) => ({
            key: one.day,
            label: formatDayShort(one.day),
            values: [one.events],
          }))}
          label="Son 14 günün kayıtları, güne göre"
          series={["Kayıt"]}
          unit="kayıt"
        />
      </FramePanel>

      <FramePanel className="p-0">
        {data.entries.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheckIcon />
              </EmptyMedia>
              <EmptyTitle>Bu süzgeçle kayıt yok</EmptyTitle>
              <EmptyDescription>Süzgeçleri değiştirin ya da temizleyin.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="max-sm:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaman</TableHead>
                    <TableHead>Kişi</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Kayıt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {timeFormat.format(e.occurredAt)}
                      </TableCell>
                      <TableCell>
                        {auditActorLabel(e.actorUserId, e.actorName)}
                        {e.actorRoleName && (
                          <span className="text-muted-foreground"> · {e.actorRoleName}</span>
                        )}
                      </TableCell>
                      <TableCell>{auditEventLabel(e.eventType)}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {auditTargetLabel(e.targetSchema, e.targetTable) ?? "—"}
                        </span>
                        {e.targetName && <span> · {e.targetName}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y sm:hidden">
              {data.entries.map((e) => (
                <li className="flex flex-col gap-0.5 px-4 py-3" key={e.id}>
                  <span className="text-sm font-medium">
                    {auditEventLabel(e.eventType)}
                    {e.targetName && ` · ${e.targetName}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {auditActorLabel(e.actorUserId, e.actorName)} ·{" "}
                    {timeFormat.format(e.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </FramePanel>

      <FramePanel className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Toplam {countFormat.format(data.total)} kayıt
        </span>
        <ListPagination
          hrefFor={(p) => `${ROUTE}${auditLogQuery(filters, p)}`}
          lastPage={data.lastPage}
          page={data.page}
        />
      </FramePanel>
    </Frame>
  );
}
