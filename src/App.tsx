/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useAppStore } from './store/AppContext';
import { MainLayout } from './components/MainLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginView } from './views/admin/AdminLoginView';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppRouter() {
  const { state } = useAppStore();

  if (state.appMode === 'admin') {
    return state.adminLoggedIn ? <AdminLayout /> : <AdminLoginView />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ErrorBoundary>
  );
}
