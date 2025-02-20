import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load components
const NewEntry = lazy(() => import("./components/NewEntry"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EntryDetails = lazy(() => import("./pages/EntryDetails"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryGraph = lazy(() => import("./pages/CategoryGraph"));
const UnifiedGraph = lazy(() => import("./pages/UnifiedGraph"));
const ExperimentalGraph = lazy(() => import("./pages/ExperimentalGraph"));
const SphericalGraph = lazy(() => import("./pages/SphericalGraph"));
const Vault = lazy(() => import("./pages/Vault"));
const Chat = lazy(() => import("./pages/Chat"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for suspense fallback
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
  const location = useLocation();

  const showBars = location.pathname !== '/test';

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
              <Vault />
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
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
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
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/:category"
          element={
            <ProtectedRoute>
              <CategoryGraph />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mind-map"
          element={
            <ProtectedRoute>
              <UnifiedGraph />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spherical-graph"
          element={
            <ProtectedRoute>
              <SphericalGraph />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experimental-graph"
          element={
            <ProtectedRoute>
              <ExperimentalGraph />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBars && <Navigation />}
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
