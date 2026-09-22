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
 * and at the first and last page "Önceki" / "Sonraki" become disabled buttons instead of links. COSS's own `PaginationPrevious` / `PaginationNext` carry English text, so their
 * markup is repeated here with Turkish text (DESIGN_SYSTEM_RULES section 4.1, row 20); the COSS
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
            <Button
              aria-label="Önceki sayfa"
              className="max-sm:aspect-square max-sm:p-0"
              disabled
              variant="ghost"
            >
              <ChevronLeftIcon className="sm:-ms-1" />
              <span className="max-sm:hidden">Önceki</span>
            </Button>
          ) : (
            <PaginationLink
              aria-label="Önceki sayfa"
              className="max-sm:aspect-square max-sm:p-0"
              render={<Button render={<Link href={hrefFor(page - 1)} />} variant="ghost" />}
            >
              <ChevronLeftIcon className="sm:-ms-1" />
              <span className="max-sm:hidden">Önceki</span>
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
            <Button
              aria-label="Sonraki sayfa"
              className="max-sm:aspect-square max-sm:p-0"
              disabled
              variant="ghost"
            >
              <span className="max-sm:hidden">Sonraki</span>
              <ChevronRightIcon className="sm:-me-1" />
            </Button>
          ) : (
            <PaginationLink
              aria-label="Sonraki sayfa"
              className="max-sm:aspect-square max-sm:p-0"
              render={<Button render={<Link href={hrefFor(page + 1)} />} variant="ghost" />}
            >
              <span className="max-sm:hidden">Sonraki</span>
              <ChevronRightIcon className="sm:-me-1" />
            </PaginationLink>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
