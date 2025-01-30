import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { NewEntry } from "./components/NewEntry";
import { Auth } from "./pages/Auth";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import NotFound from "./pages/NotFound";
import Entries from "./pages/Entries";
import EntryDetails from "./pages/EntryDetails";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { session } = useAuth();

  return (
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-primary/10">
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