import heroImage from '../assets/imgs/hero-01.png';
import espacioImage from '../assets/imgs/espacio-01.png';
import plantaTop from '../assets/imgs/planta-01.png';
import plantaBottom from '../assets/imgs/planta-02.png';
import decoradorGlobos from '../assets/imgs/decorador-globos.png';
import decoradorRegalos from '../assets/imgs/decorador-regalos.png';
import decoradorHelados from '../assets/imgs/decorador-helados.png';
import decoradorConoFiesta from '../assets/imgs/decorador-cono-cabeza.png';

export const LANDING_IMAGES = {
  hero: heroImage,
  espacio: espacioImage,
  plantaTop,
  plantaBottom,
} as const;

export const DECORADOR_IMAGES = {
  globos: decoradorGlobos,
  regalos: decoradorRegalos,
  helados: decoradorHelados,
  conoFiesta: decoradorConoFiesta,
} as const;
