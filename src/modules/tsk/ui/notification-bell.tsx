"use client";

import { BellIcon, BellOffIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { NotificationItem } from "@/modules/tsk/application/tasks";
import {
  matchesNotificationFilter,
  NOTIFICATION_FILTERS,
  type NotificationFilter,
} from "@/modules/tsk/domain/tasks";
import { createRefresher } from "@/platform/signals/client";
import { useSignal } from "@/platform/signals/signal-provider";

type Summary = { unread: number; items: NotificationItem[] };

const API = "/api/notifications";

const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

async function loadSummary(): Promise<Summary> {
  const response = await fetch(API, { cache: "no-store" });
  if (!response.ok) throw new Error(`notifications ${response.status}`);
  return (await response.json()) as Summary;
}

async function markRead(body: { ids: string[] } | { all: true }) {
  await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * The bell and its drawer (SCR-015, REQ-TSK-009): a Popover on desktop, a Drawer on a phone
 * (SPECIAL_SCREENS). The counter shows unread notifications only, apart from open tasks. The
 * list reloads when the live signal says notifications changed, when the stream reopens and when
 * the browser comes back online (ADR-018, SPIKE-13); a failed load is retried.
 */
export function NotificationBell() {
  const isMobile = useMediaQuery("max-md");
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  // One refresher per mount: a stopped one never applies data again (React may mount twice).
  const refresher = useRef<ReturnType<typeof createRefresher<Summary>> | null>(null);
  useEffect(() => {
    const current = createRefresher(loadSummary, setSummary);
    refresher.current = current;
    current.refresh();
    return () => current.stop();
  }, []);
  const reload = useCallback(() => refresher.current?.refresh(), []);
  useSignal("notifications", reload);

  const openItem = useCallback(
    (item: NotificationItem) => {
      setOpen(false);
      if (!item.isRead) void markRead({ ids: [item.id] }).then(reload);
    },
    [reload],
  );

  const unread = summary?.unread ?? 0;
  const label = unread > 0 ? `Bildirimler, ${unread} okunmamış` : "Bildirimler";
  const trigger = (
    <Button aria-label={label} className="relative" size="icon" variant="ghost">
      <BellIcon aria-hidden="true" />
      {unread > 0 ? (
        <Badge
          aria-hidden="true"
          className="pointer-events-none absolute -end-1 -top-1 min-w-5 px-1 tabular-nums"
          size="sm"
        >
          {unread > 99 ? "99+" : unread}
        </Badge>
      ) : null}
    </Button>
  );

  const items = (summary?.items ?? []).filter((item) => matchesNotificationFilter(filter, item));
  // Next to the title (owner's request 2026-09-22), so the list starts right under the header.
  const filterSelect = (
    <Select
      items={NOTIFICATION_FILTERS}
      onValueChange={(value) => setFilter((value as NotificationFilter | null) ?? "all")}
      value={filter}
    >
      <SelectTrigger aria-label="Bildirim türü" className="w-auto min-w-36" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {NOTIFICATION_FILTERS.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
  const markAllButton =
    unread > 0 ? (
      <Button onClick={() => void markRead({ all: true }).then(reload)} size="sm" variant="ghost">
        Tümünü okundu say
      </Button>
    ) : null;

  const body = (
    <div className="flex min-h-0 flex-col gap-3">
      {items.length === 0 ? (
        <Empty className="py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellOffIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={3} className="text-base" role="heading">
              Bildirim yok.
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea className="max-h-96">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationRow item={item} onOpen={openItem} />
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerTrigger render={trigger} />
        <DrawerPopup showBar>
          <DrawerHeader>
            <div className="flex flex-wrap items-center gap-2">
              <DrawerTitle>Bildirimler</DrawerTitle>
              {filterSelect}
              <span className="ms-auto">{markAllButton}</span>
            </div>
          </DrawerHeader>
          <DrawerPanel>{body}</DrawerPanel>
        </DrawerPopup>
      </Drawer>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={trigger} />
      <PopoverPopup align="end" className="w-96">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PopoverTitle className="text-base">Bildirimler</PopoverTitle>
          {filterSelect}
          <span className="ms-auto">{markAllButton}</span>
        </div>
        {body}
      </PopoverPopup>
    </Popover>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
}) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-sm font-medium">
        {item.isCritical ? (
          <TriangleAlertIcon aria-label="Kritik" className="size-4 text-destructive-foreground" />
        ) : null}
        {!item.isRead ? <span className="sr-only">Okunmamış: </span> : null}
        {item.title}
        {!item.isRead ? (
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-primary" />
        ) : null}
      </span>
      {item.body ? <span className="text-sm text-muted-foreground">{item.body}</span> : null}
      <span className="text-xs text-muted-foreground">
        {timeFormat.format(new Date(item.createdAt))}
      </span>
    </>
  );
  const className =
    "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-start hover:bg-accent";
  return item.linkPath ? (
    <Link className={className} href={item.linkPath} onClick={() => onOpen(item)}>
      {content}
    </Link>
  ) : (
    <button className={className} onClick={() => onOpen(item)} type="button">
      {content}
    </button>
  );
}
