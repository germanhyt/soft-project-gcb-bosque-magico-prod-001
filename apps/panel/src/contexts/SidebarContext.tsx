import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'bm_panel_sidebar_expanded';

type SidebarContextValue = {
  /** true = barra completa; false = rail de iconos (desktop) u oculto (móvil) */
  expanded: boolean;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
  /** Drawer móvil abierto (solo relevante en viewport pequeño) */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function applySidebarWidth(expanded: boolean) {
  document.documentElement.dataset.sidebar = expanded ? 'expanded' : 'collapsed';
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpandedState] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expanded ? 'true' : 'false');
    applySidebarWidth(expanded);
  }, [expanded]);

  useEffect(() => {
    applySidebarWidth(expanded);
  }, []);

  const setExpanded = useCallback((value: boolean) => {
    setExpandedState(value);
    if (!value) setMobileOpen(false);
  }, []);

  const toggle = useCallback(() => setExpandedState((v) => !v), []);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      expanded,
      toggle,
      setExpanded,
      mobileOpen,
      setMobileOpen,
      toggleMobile,
    }),
    [expanded, toggle, setExpanded, mobileOpen, toggleMobile],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar debe usarse dentro de SidebarProvider');
  return ctx;
}

/** Compatibilidad con código que usaba `open` */
export function useSidebarOpen() {
  const { expanded } = useSidebar();
  return expanded;
}
