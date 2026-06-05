export function waMeUrlCotizacion(celular: string, mensaje: string) {
  const digits = celular.replace(/\D/g, '');
  return `https://wa.me/51${digits}?text=${encodeURIComponent(mensaje)}`;
}

/** Reutiliza pestaña abierta en el gesto del usuario; evita bloqueo de popups tras await. */
export function abrirWhatsApp(url: string, tabPreabierta?: Window | null) {
  if (tabPreabierta && !tabPreabierta.closed) {
    tabPreabierta.location.href = url;
    tabPreabierta.focus();
    return true;
  }

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.target = '_blank';
  enlace.rel = 'noopener noreferrer';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  return true;
}
