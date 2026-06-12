import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import React, { useState } from 'react';

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
        className={`group/item flex items-center rounded-lg transition-colors duration-150 ${
          isCurrent
            ? 'bg-primary text-white shadow-sm'
            : isChildActive
              ? 'bg-brand-soft'
              : 'hover:bg-slate-50'
        }`}
      >
        {/* Chevron toggle */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`ml-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
              isCurrent
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            aria-label={expanded ? _('Collapse') : _('Expand')}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Category button/link */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            title={category.name}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-1.5 py-2 text-[13px] leading-snug transition-all duration-150 ${
              isCurrent
                ? 'font-bold text-white'
                : isChildActive
                  ? 'font-semibold text-primary'
                  : 'font-medium text-slate-700 hover:text-primary'
            }`}
          >
            <span className="min-w-0 break-words">{category.name}</span>
          </button>
        ) : isLinkable ? (
          <a
            href={category.url}
            title={category.name}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] leading-snug transition-all duration-150 ${
              isCurrent
                ? 'font-bold text-white'
                : isChildActive
                  ? 'font-semibold text-primary'
                  : 'font-medium text-slate-700 hover:text-primary'
            }`}
          >
            <span className="min-w-0 break-words">{category.name}</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => hasChildren && setExpanded(!expanded)}
            title={category.name}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] leading-snug transition-all duration-150 ${
              isChildActive
                ? 'font-semibold text-primary'
                : 'font-medium text-slate-700 hover:text-primary'
            }`}
          >
            <span className="min-w-0 break-words">{category.name}</span>
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul className="border-l border-border ml-4 mt-0.5 space-y-0.5 pl-3">
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
          className="group mb-3 flex w-full items-center justify-between rounded-lg py-1.5 text-left transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <FolderOpen className="h-4 w-4 text-primary" />
            {_('Categories')}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? '' : '-rotate-90'
            }`}
          />
        </button>
      )}

      {/* Tree */}
      {isOpen && (
        <ul className="space-y-0.5">
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
      {showSeparator && <hr className="mt-4 border-slate-100" />}
    </div>
  );
}
