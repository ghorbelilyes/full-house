import { Og } from '@components/frontStore/Og.js';
import React, {
  LinkHTMLAttributes,
  MetaHTMLAttributes,
  ScriptHTMLAttributes
} from 'react';

interface HeadTagsProps {
  pageInfo: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl: string;
    favicon: string;
    breadcrumbs: Array<{
      title: string;
      url: string;
    }>;
    ogInfo: {
      locale: string;
      title: string;
      description: string;
      image: string;
      url: string;
      type: 'website' | 'article' | 'product' | string;
      siteName: string;
      twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
      twitterSite: string;
      twitterCreator: string;
      twitterImage: string;
    };
  };
  currentProduct?: {
    name: string;
    sku: string;
    url: string;
    metaDescription?: string | null;
    image?: {
      url: string;
    } | null;
    price?: {
      regular?: {
        value: number;
      } | null;
      special?: {
        value: number;
      } | null;
    } | null;
    inventory?: {
      isInStock?: boolean;
    } | null;
    reviewSummary?: {
      averageRating?: number;
      totalReviews?: number;
    } | null;
  } | null;
  themeConfig: {
    headTags: {
      metas: Array<MetaHTMLAttributes<HTMLMetaElement>>;
      links: Array<LinkHTMLAttributes<HTMLLinkElement>>;
      scripts: Array<ScriptHTMLAttributes<HTMLScriptElement>>;
      base?: {
        href: string;
        target: '_blank' | '_self' | '_parent' | '_top';
      };
    };
  };
}
export default function HeadTags({
  pageInfo: {
    title,
    description,
    keywords,
    canonicalUrl,
    ogInfo,
    favicon,
    breadcrumbs
  },
  currentProduct,
  themeConfig: {
    headTags: { metas, links, scripts, base }
  }
}: HeadTagsProps) {
  let websiteOrigin = '';
  try {
    websiteOrigin = new URL(canonicalUrl || ogInfo.url).origin;
  } catch (e) {
    websiteOrigin = '';
  }

  const websiteName = ogInfo.siteName || title;
  const structuredData: Record<string, unknown>[] = [];

  if (websiteOrigin) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: websiteName,
      url: websiteOrigin,
      logo: ogInfo.image || favicon || undefined
    });

    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: websiteName,
      url: websiteOrigin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${websiteOrigin}/search?keyword={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });

    if (breadcrumbs?.length) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((breadcrumb, index) => {
          const itemUrl = breadcrumb.url.startsWith('http')
            ? breadcrumb.url
            : `${websiteOrigin}${breadcrumb.url.startsWith('/') ? '' : '/'}${breadcrumb.url}`;

          return {
            '@type': 'ListItem',
            position: index + 1,
            name: breadcrumb.title,
            item: itemUrl
          };
        })
      });
    }

    if (currentProduct?.url) {
      const productUrl = currentProduct.url.startsWith('http')
        ? currentProduct.url
        : `${websiteOrigin}${currentProduct.url}`;
      const productImage = currentProduct.image?.url
        ? currentProduct.image.url.startsWith('http')
          ? currentProduct.image.url
          : `${websiteOrigin}${currentProduct.image.url}`
        : ogInfo.image || undefined;
      const offerPrice =
        currentProduct.price?.special?.value ??
        currentProduct.price?.regular?.value;

      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: currentProduct.name,
        sku: currentProduct.sku,
        url: productUrl,
        description: currentProduct.metaDescription || description,
        image: productImage ? [productImage] : undefined,
        brand: {
          '@type': 'Brand',
          name: websiteName
        },
        offers: offerPrice
          ? {
              '@type': 'Offer',
              url: productUrl,
              priceCurrency: 'TND',
              price: offerPrice,
              availability: currentProduct.inventory?.isInStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock'
            }
          : undefined,
        aggregateRating:
          currentProduct.reviewSummary?.totalReviews &&
          currentProduct.reviewSummary.totalReviews > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: currentProduct.reviewSummary.averageRating || 0,
                reviewCount: currentProduct.reviewSummary.totalReviews
              }
            : undefined
      });
    }
  }

  React.useEffect(() => {
    const head = document.querySelector('head');
    scripts.forEach((script) => {
      const scriptElement = document.createElement('script');
      Object.keys(script).forEach((key) => {
        if (script[key]) {
          scriptElement[key] = script[key];
        }
      });
      head?.appendChild(scriptElement);
    });
  }, []);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {metas.map((meta, index) => (
        <meta key={index} {...meta} />
      ))}
      {links.map((link, index) => (
        <link key={index} {...link} />
      ))}
      {scripts.map((script, index) => (
        <script key={index} {...script} />
      ))}
      {favicon && <link rel="icon" href={favicon} />}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {structuredData.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      {base && <base {...base} />}
      <Og
        type={ogInfo.type}
        title={title}
        description={description}
        url={ogInfo.url}
        siteName={ogInfo.siteName}
        image={ogInfo.image}
        locale={ogInfo.locale}
        twitterCard={ogInfo.twitterCard}
        twitterSite={ogInfo.twitterSite}
        twitterCreator={ogInfo.twitterCreator}
        twitterImage={ogInfo.twitterImage}
      />
    </>
  );
}

export const layout = {
  areaId: 'head',
  sortOrder: 5
};

export const query = `
  query query {
    pageInfo {
      title
      description
      keywords
      canonicalUrl
      favicon
      breadcrumbs {
        title
        url
      }
      ogInfo {
        locale
        title
        description
        image
        url
        type
        siteName
        twitterCard
        twitterSite
        twitterCreator
        twitterImage
      }
    }
    currentProduct {
      name
      sku
      url
      metaDescription
      image {
        url
      }
      price {
        regular {
          value
        }
        special {
          value
        }
      }
      inventory {
        isInStock
      }
      reviewSummary {
        averageRating
        totalReviews
      }
    }
    themeConfig {
      headTags {
        metas {
          name
          content
          charSet
          httpEquiv
          property
          itemProp
          itemType
          itemID
          lang
        }
        links {
          rel
          href
          sizes
          type
          hrefLang
          media
          title
          as
          crossOrigin
          integrity
          referrerPolicy
        }
        scripts {
          src
          type
          async
          defer
          crossOrigin
          integrity
          noModule
          nonce
        }
        base {
          href
          target
        }
      }
    }
  }
`;
