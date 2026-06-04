import { FAQ } from './content';

export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://bosquemagico.refugio.pe').replace(
  /\/$/,
  '',
);

export const SEO_DEFAULT = {
  title: 'Bosque Mágico | Fiestas infantiles en Refugio',
  description:
    'Celebra cumpleaños infantiles en Bosque Mágico, Refugio. Espacio privado por turno, shows, catering y cotización en línea.',
  keywords:
    'fiestas infantiles, cumpleaños niños, Refugio, Bosque Mágico, salón fiestas, shows infantiles, catering fiestas',
  ogImage: `${SITE_URL}/logo-bm.png`,
} as const;

export const SEO_COTIZACION = {
  title: 'Tu cotización | Bosque Mágico',
  description: 'Revisa y acepta tu propuesta de fiesta en Bosque Mágico.',
  robots: 'noindex, nofollow',
} as const;

export function canonicalUrl(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`;
}

export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#negocio`,
        name: 'Bosque Mágico',
        description: SEO_DEFAULT.description,
        url: SITE_URL,
        image: SEO_DEFAULT.ogImage,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Refugio',
          addressRegion: 'Lima',
          addressCountry: 'PE',
        },
        priceRange: '$$',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#sitio`,
        url: SITE_URL,
        name: 'Bosque Mágico',
        inLanguage: 'es-PE',
        publisher: { '@id': `${SITE_URL}/#negocio` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.pregunta,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.respuesta,
          },
        })),
      },
    ],
  };
}
