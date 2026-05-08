import Area from '@components/common/Area.js';
import { Editor } from '@components/common/Editor.js';
import { Image } from '@components/common/Image.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import React from 'react';

export function CategoryInfo() {
  const { name, description, image } = useCategory();
  return (
    <>
      <Area id="beforeCategoryInfo" />
      <div className="mb-10 category__general">
        {image && (
          <Image
            className="category__image mb-5"
            src={image.url}
            alt={image.alt || name}
            width={1800}
            height={1029}
            priority={true}
          />
        )}
        <div className="category__info page-width">
          <header className="text-center mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">
              {name}
            </h1>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-orange-500" />
          </header>
          {description && (
            <div className="category__description prose prose-base mx-auto">
              <Editor rows={description} />
            </div>
          )}
        </div>
      </div>
      <Area id="afterCategoryInfo" />
    </>
  );
}
