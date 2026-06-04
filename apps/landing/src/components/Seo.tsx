import { Helmet } from 'react-helmet-async';
import { canonicalUrl, SEO_DEFAULT, SITE_URL } from '../constants/seo';

type Props = {
  title?: string;
  description?: string;
  path?: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function Seo({
  title = SEO_DEFAULT.title,
  description = SEO_DEFAULT.description,
  path = '/',
  robots = 'index, follow',
  jsonLd,
}: Props) {
  const url = canonicalUrl(path);
  const ogImage = SEO_DEFAULT.ogImage;

  return (
    <Helmet>
      <html lang="es-PE" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SEO_DEFAULT.keywords} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Bosque Mágico" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="es_PE" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
      {/* Ayuda a crawlers que no ejecutan JS */}
      <link rel="alternate" hrefLang="es-PE" href={SITE_URL} />
    </Helmet>
  );
}
