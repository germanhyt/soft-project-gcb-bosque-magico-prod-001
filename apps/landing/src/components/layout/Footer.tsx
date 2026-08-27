import { CONTAINER } from '../../constants/design';
import { PartyDecor } from '../ui/PartyDecor';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t-4 border-tertiary-fixed-dim bg-primary px-4 py-12 text-on-primary sm:px-6 md:py-14">
      <PartyDecor placement="footer-globos" />
      <div className={`${CONTAINER} relative z-[1] flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-4">
          <img
            src="/logo-bm.png"
            alt=""
            className="h-20 w-20 object-contain"
          />
          <div>
            <p className="font-display text-lg font-bold">Bosque Mágico</p>
            <p className="mt-1 text-sm text-primary-fixed">Fiestas infantiles · Refugio</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <p className="text-sm leading-relaxed text-primary-fixed-dim">
            © {year} Bosque Mágico. Todos los derechos reservados.
          </p>
          <a
            href="#cotizar"
            className="font-display text-sm font-semibold text-secondary-container underline-offset-4 hover:underline"
          >
            Cotizar mi fiesta →
          </a>
        </div>
      </div>
    </footer>
  );
}
