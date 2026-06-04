import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { SocketStatusProvider } from '../contexts/SocketStatusContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketStatusProvider>
          <SidebarProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </SidebarProvider>
        </SocketStatusProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
