import React, { useState } from 'react';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

interface SidebarCategory {
  categoryId: number;
  name: string;
  url: string;
  children?: SidebarCategory[];
}

/* ─── Single branch (recursive) ─────────────────────────────── */
function CategoryBranch({
  category,
  currentCategoryId,
  level = 0
}: {
  category: SidebarCategory;
  currentCategoryId: number;
  level?: number;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isCurrent = category.categoryId === currentCategoryId;

  const isChildActive = hasChildren
    ? category.children!.some(
        (c) =>
          c.categoryId === currentCategoryId ||
          (c.children &&
            c.children.some((gc) => gc.categoryId === currentCategoryId))
      )
    : false;

  const [expanded, setExpanded] = useState(isCurrent || isChildActive);

  return (
    <li>
      <div className="group/item flex items-center">
        {/* Chevron toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mr-1.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label={expanded ? _('Collapse') : _('Expand')}
          >
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${
                expanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <span className="mr-1.5 inline-block w-5 flex-shrink-0" />
        )}

        {/* Category link */}
        <a
          href={category.url}
          className={`relative flex w-full items-center rounded-lg px-2 py-1.5 text-[13px] leading-snug transition-all duration-150 ${
            isCurrent
              ? 'bg-orange-500 font-semibold text-white'
              : isChildActive
                ? 'font-medium text-orange-600'
                : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          {category.name}
        </a>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-orange-200 pl-2">
          {[...category.children!]
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .map((child) => (
              <CategoryBranch
                key={child.categoryId}
                category={child}
                currentCategoryId={currentCategoryId}
                level={level + 1}
              />
            ))}
        </ul>
      )}
    </li>
  );
}

/* ─── Sidebar wrapper ───────────────────────────────────────── */
export function CategorySidebar({
  categoryTree
}: {
  categoryTree: SidebarCategory[];
}) {
  const currentCategory = useCategory();
  const [isOpen, setIsOpen] = useState(true);

  if (!categoryTree || categoryTree.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group mb-1 flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition-colors hover:bg-orange-50"
      >
        <span className="text-sm font-bold uppercase tracking-wide text-slate-800">
          {_('Categories')}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 ${
            isOpen ? '' : '-rotate-90'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Tree */}
      {isOpen && (
        <ul className="mt-1 space-y-0.5">
          {categoryTree.map((cat) => (
            <CategoryBranch
              key={cat.categoryId}
              category={cat}
              currentCategoryId={currentCategory.categoryId}
            />
          ))}
        </ul>
      )}

      {/* Separator */}
      <hr className="mt-5 border-slate-200" />
    </div>
  );
}
