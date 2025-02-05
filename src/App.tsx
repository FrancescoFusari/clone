import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";

const NewEntry = lazy(() => import("./components/NewEntry"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Entries = lazy(() => import("./pages/Entries"));
const EntryDetails = lazy(() => import("./pages/EntryDetails"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="p-8">
    <Skeleton className="h-8 w-3/4 mb-4" />
    <Skeleton className="h-32 w-full mb-4" />
    <Skeleton className="h-32 w-full" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { session } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/auth"
          element={session ? <Navigate to="/" /> : <Auth />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Entries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entries/:id"
          element={
            <ProtectedRoute>
              <EntryDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new"
          element={
            <ProtectedRoute>
              <NewEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background touch-pan-y">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
            <Navigation />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
