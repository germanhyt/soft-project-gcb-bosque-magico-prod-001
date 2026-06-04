import { CONTAINER } from '../../constants/design';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-primary-container/80 bg-primary px-4 py-12 text-on-primary sm:px-6 md:py-14">
      <div className={`${CONTAINER} flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-4">
          <img src="/logo-bm.png" alt="" className="h-14 w-14 rounded-xl bg-surface/10 object-contain p-1" />
          <div>
            <p className="font-display text-lg font-bold">Bosque Mágico</p>
            <p className="mt-1 text-sm text-primary-fixed-dim">Zona infantil de Refugio</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-primary-fixed-dim md:text-right">
          © {year} Bosque Mágico. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
