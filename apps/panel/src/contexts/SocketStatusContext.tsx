import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type SocketConnectionStatus = 'connecting' | 'connected' | 'disconnected';

type SocketStatusContextValue = {
  status: SocketConnectionStatus;
  setStatus: (status: SocketConnectionStatus) => void;
};

const SocketStatusContext = createContext<SocketStatusContextValue | null>(null);

export function SocketStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SocketConnectionStatus>('connecting');

  const value = useMemo(() => ({ status, setStatus }), [status]);

  return <SocketStatusContext.Provider value={value}>{children}</SocketStatusContext.Provider>;
}

export function useSocketStatus() {
  const ctx = useContext(SocketStatusContext);
  if (!ctx) throw new Error('useSocketStatus debe usarse dentro de SocketStatusProvider');
  return ctx;
}

export function useSocketStatusSetter() {
  const { setStatus } = useSocketStatus();
  return useCallback((connected: boolean) => {
    setStatus(connected ? 'connected' : 'disconnected');
  }, [setStatus]);
}
