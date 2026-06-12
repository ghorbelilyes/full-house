import React, { useEffect } from 'react';

interface LoadingSkeletonProps {
  count?: number;
  gridColumns?: number;
  layout?: 'grid' | 'list';
}

// Inject shimmer keyframes once globally
let shimmerInjected = false;
function injectShimmer() {
  if (shimmerInjected || typeof document === 'undefined') return;
  shimmerInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

function ShimmerPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 bg-[length:200%_100%] ${className}`}
      style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
    />
  );
}

function GridSkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Image placeholder */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50">
        <ShimmerPulse className="absolute inset-0 rounded-none" />
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-3.5">
        {/* Brand */}
        <ShimmerPulse className="h-2.5 w-14" />
        {/* Title line 1 */}
        <ShimmerPulse className="h-3.5 w-full" />
        {/* Title line 2 */}
        <ShimmerPulse className="h-3.5 w-3/4" />
        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <ShimmerPulse className="h-3 w-16" />
          <ShimmerPulse className="h-2.5 w-10" />
        </div>
        {/* Price row */}
        <div className="mt-auto flex items-end justify-between pt-1">
          <ShimmerPulse className="h-5 w-20" />
          <ShimmerPulse className="h-3.5 w-14" />
        </div>
        {/* Action buttons */}
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <ShimmerPulse className="h-[38px] rounded-xl" />
          <ShimmerPulse className="h-[38px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ListSkeletonCard() {
  return (
    <div className="flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:gap-6 sm:p-4">
      {/* Image */}
      <ShimmerPulse className="h-28 w-28 flex-shrink-0 rounded-xl sm:h-40 sm:w-40" />
      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 py-0.5">
        <ShimmerPulse className="h-2.5 w-14" />
        <ShimmerPulse className="h-4 w-full" />
        <ShimmerPulse className="h-4 w-2/3" />
        <div className="mt-auto flex items-baseline gap-3">
          <ShimmerPulse className="h-5 w-24" />
          <ShimmerPulse className="h-3.5 w-16" />
        </div>
        <ShimmerPulse className="h-3.5 w-14" />
      </div>
    </div>
  );
}

export const ProductListLoadingSkeleton = ({
  count = 8,
  gridColumns = 4,
  layout = 'grid'
}: LoadingSkeletonProps) => {
  useEffect(() => {
    injectShimmer();
  }, []);

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ListSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const gridClassName = (() => {
    switch (gridColumns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      default:
        return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
    }
  })();

  return (
    <div className={`grid ${gridClassName} gap-3 sm:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <GridSkeletonCard key={i} />
      ))}
    </div>
  );
};
