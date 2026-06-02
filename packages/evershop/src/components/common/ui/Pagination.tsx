/* eslint-disable jsx-a11y/anchor-has-content */
import { cn } from '@evershop/evershop/lib/util/cn';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import * as React from 'react';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex items-center gap-1.5', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none',
        isActive
          ? 'bg-orange-500 text-white shadow-md shadow-orange-200 pointer-events-none'
          : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600 active:scale-95',
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Page précédente"
      className={cn(
        'w-auto gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-slate-600 shadow-sm hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600',
        className
      )}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="hidden sm:block text-sm font-semibold">Précédent</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Page suivante"
      className={cn(
        'w-auto gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-slate-600 shadow-sm hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600',
        className
      )}
      {...props}
    >
      <span className="hidden sm:block text-sm font-semibold">Suivant</span>
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        'flex h-10 w-10 items-center justify-center text-slate-400',
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">Plus de pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
};
