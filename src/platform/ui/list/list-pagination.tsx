import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

import { pageWindow } from "./page-window";

/**
 * The pagination of every list (SCREEN_PATTERNS section 1, D-219), composed from COSS Pagination
 * the way its particles do (`p-pagination-1…3`): `PaginationLink` renders a COSS `Button`, which
 * renders a Next.js `Link` (with `render`, PaginationLink leaves styling to the rendered element),
 * and at the first and last page the previous / next arrows become disabled buttons instead of
 * links. Previous and next are arrows only (owner request 2026-09-22); their names stay for
 * screen readers. COSS's own `PaginationPrevious` / `PaginationNext` carry English text, so they
 * are composed here instead, with Turkish accessible names (DESIGN_SYSTEM_RULES section 4.1, row 20); the COSS
 * files themselves are not edited. `PaginationEllipsis` is used as is: its text is hidden from
 * sight and from screen readers.
 *
 * Page links keep the list's filters: `hrefFor` builds the address of a page.
 */
export function ListPagination({
  page,
  lastPage,
  hrefFor,
}: {
  page: number;
  lastPage: number;
  hrefFor: (page: number) => string;
}) {
  if (lastPage <= 1) return null;
  const onFirst = page <= 1;
  const onLast = page >= lastPage;

  return (
    <Pagination aria-label="Sayfalama" className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          {onFirst ? (
            <Button aria-label="Önceki sayfa" disabled size="icon" variant="ghost">
              <ChevronLeftIcon />
            </Button>
          ) : (
            <PaginationLink
              aria-label="Önceki sayfa"
              render={
                <Button render={<Link href={hrefFor(page - 1)} />} size="icon" variant="ghost" />
              }
            >
              <ChevronLeftIcon />
            </PaginationLink>
          )}
        </PaginationItem>

        {pageWindow(page, lastPage).map((p, i) =>
          p === null ? (
            <PaginationItem className="max-sm:hidden" key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem className="max-sm:hidden" key={p}>
              <PaginationLink
                aria-label={`Sayfa ${p}`}
                isActive={p === page}
                render={
                  <Button
                    render={<Link href={hrefFor(p)} />}
                    size="icon"
                    variant={p === page ? "outline" : "ghost"}
                  />
                }
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem className="px-2 text-sm text-muted-foreground tabular-nums sm:hidden">
          {page} / {lastPage}
        </PaginationItem>

        <PaginationItem>
          {onLast ? (
            <Button aria-label="Sonraki sayfa" disabled size="icon" variant="ghost">
              <ChevronRightIcon />
            </Button>
          ) : (
            <PaginationLink
              aria-label="Sonraki sayfa"
              render={
                <Button render={<Link href={hrefFor(page + 1)} />} size="icon" variant="ghost" />
              }
            >
              <ChevronRightIcon />
            </PaginationLink>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
