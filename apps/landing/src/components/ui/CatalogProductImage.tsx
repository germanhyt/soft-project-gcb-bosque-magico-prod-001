import { resolveAssetUrl } from '../../lib/media';

type Props = {
  imagenUrl?: string | null;
  nombre: string;
};

export function CatalogProductImage({ imagenUrl, nombre }: Props) {
  const src = resolveAssetUrl(imagenUrl);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={nombre}
      loading="lazy"
      className="mb-4 h-36 w-full rounded-xl border border-surface-variant/60 object-cover"
    />
  );
}
