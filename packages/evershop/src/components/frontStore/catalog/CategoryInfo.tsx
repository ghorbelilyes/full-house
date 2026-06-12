import Area from '@components/common/Area.js';
import { Editor } from '@components/common/Editor.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export function CategoryInfo() {
  const { name, description, children: childCategories } = useCategory();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hasChildCategories =
    Array.isArray(childCategories) && childCategories.length > 0;
  const updateScrollButtons = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }
    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
    setCanScrollLeft(slider.scrollLeft > 1);
    setCanScrollRight(slider.scrollLeft < maxScrollLeft - 1);
  }, []);
  const scrollSlider = (direction: 'left' | 'right') => {
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }
    slider.scrollBy({
      left: direction === 'left' ? -260 : 260,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [childCategories, updateScrollButtons]);

  return (
    <>
      <Area id="beforeCategoryInfo" />
      <div className="mb-8 category__general">
        <div className="category__info page-width">
          <header className="text-center mb-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl lg:text-4xl">
              {name}
            </h1>
            <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-primary" />
          </header>
          {description && (
            <div className="category__description prose prose-sm mx-auto max-w-2xl text-slate-600">
              <Editor rows={description} />
            </div>
          )}
        </div>
      </div>
      {hasChildCategories && (
        <div className="page-width mb-8">
          <div className="flex items-center gap-2">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollSlider('left')}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white text-slate-500 shadow-sm transition hover:border-primary hover:text-primary sm:hidden"
                aria-label="Catégories précédentes"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div
              ref={sliderRef}
              onScroll={updateScrollButtons}
              className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {childCategories.map((child) =>
                child.url ? (
                  <a
                    key={child.uuid || child.categoryId}
                    href={child.url}
                    className="snap-start whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary"
                  >
                    {child.name}
                  </a>
                ) : (
                  <span
                    key={child.uuid || child.categoryId}
                    className="snap-start whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    {child.name}
                  </span>
                )
              )}
            </div>
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollSlider('right')}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white text-slate-500 shadow-sm transition hover:border-primary hover:text-primary sm:hidden"
                aria-label="Catégories suivantes"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      <Area id="afterCategoryInfo" />
    </>
  );
}
