import React, { ReactNode } from 'react';

export const ProductListEmptyRender = ({
  message
}: {
  message: string | ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 px-8 text-center shadow-sm">
      <div className="mb-4 text-4xl">🔍</div>
      {typeof message === 'string' ? (
        <p className="text-lg font-medium text-slate-500">{message}</p>
      ) : (
        message
      )}
    </div>
  );
};
