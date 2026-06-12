import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { SearchX, RotateCcw } from 'lucide-react';
import React, { ReactNode } from 'react';

export const ProductListEmptyRender = ({
  message,
  onResetFilters
}: {
  message: string | ReactNode;
  onResetFilters?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center sm:px-12 sm:py-20">
      {/* Icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <SearchX className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
      </div>

      {/* Message */}
      {typeof message === 'string' ? (
        <h3 className="text-lg font-semibold text-slate-700">{message}</h3>
      ) : (
        message
      )}

      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {_('Try adjusting your search or filter criteria to find what you\'re looking for.')}
      </p>

      {/* Reset filters CTA */}
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          {_('Clear all filters')}
        </button>
      )}
    </div>
  );
};
