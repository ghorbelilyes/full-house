import React, { useState } from 'react';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

interface SidebarCategory {
  categoryId?: number | null;
  name: string;
  url: string;
  children?: SidebarCategory[];
}

function hasActiveCategory(category: SidebarCategory, categoryId: number) {
  if (category.categoryId === categoryId) {
    return true;
  }

  return (category.children || []).some((child) =>
    hasActiveCategory(child, categoryId)
  );
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
  const isChildActive = (category.children || []).some((child) =>
    hasActiveCategory(child, currentCategoryId)
  );

  const [expanded, setExpanded] = useState(isCurrent || isChildActive);

  const isLinkable = category.url && category.url !== '#';

  return (
    <li>
      <div
        className={`group/item flex items-center rounded-xl transition-colors duration-150 ${
          isCurrent
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-sm shadow-orange-200'
            : isChildActive
              ? 'bg-orange-50'
              : 'hover:bg-slate-50'
        }`}
      >
        {/* Chevron toggle — only rendered for parents */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
              isCurrent
                ? 'text-white/80 hover:text-white hover:bg-white/15'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            aria-label={expanded ? _('Collapse') : _('Expand')}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
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
        )}

        {/* Category link — or toggle button when url is '#' */}
        {isLinkable ? (
          <a
            href={category.url}
            title={category.name}
            className={`flex w-full items-center justify-between gap-2 rounded-xl py-2 text-[13px] leading-snug transition-all duration-150 ${
              hasChildren ? 'px-2' : 'px-3.5'
            } ${
              isCurrent
                ? 'font-bold text-white'
                : isChildActive
                  ? 'font-semibold text-orange-600'
                  : 'font-medium text-slate-700 hover:text-orange-600'
            }`}
          >
            <span className="min-w-0 break-words">{category.name}</span>
            {hasChildren && (
              <span
                className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {category.children!.length}
              </span>
            )}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => hasChildren && setExpanded(!expanded)}
            title={category.name}
            className={`flex w-full items-center justify-between gap-2 rounded-xl py-2 text-[13px] leading-snug transition-all duration-150 cursor-pointer ${
              hasChildren ? 'px-2' : 'px-3.5'
            } ${
              isChildActive
                ? 'font-semibold text-orange-600'
                : 'font-medium text-slate-700 hover:text-orange-600'
            }`}
          >
            <span className="min-w-0 break-words">{category.name}</span>
            {hasChildren && (
              <span className="flex-shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-400">
                {category.children!.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul className="relative ml-5 mt-1 space-y-1 pl-4">
          <div
            className="absolute left-0 top-0 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-orange-300 to-orange-100"
            aria-hidden
          />
          {category.children!.map((child) => (
            <CategoryBranch
              key={child.categoryId || child.url || child.name}
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
  categoryTree,
  showHeader = true,
  showSeparator = true
}: {
  categoryTree: SidebarCategory[];
  showHeader?: boolean;
  showSeparator?: boolean;
}) {
  const currentCategory = useCategory();
  const [isOpen, setIsOpen] = useState(true);

  if (!categoryTree || categoryTree.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Collapsible header */}
      {showHeader && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group mb-2 flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-orange-50"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-slate-800">
            <svg
              className="h-4 w-4 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
            </svg>
            {_('Categories')}
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
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
      )}

      {/* Tree */}
      {isOpen && (
        <ul className="mt-1 space-y-1">
          {categoryTree.map((cat) => (
            <CategoryBranch
              key={cat.categoryId || cat.url || cat.name}
              category={cat}
              currentCategoryId={currentCategory.categoryId}
            />
          ))}
        </ul>
      )}

      {/* Separator */}
      {showSeparator && <hr className="mt-5 border-slate-200" />}
    </div>
  );
}
