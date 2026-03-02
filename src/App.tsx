import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard, CustomerHome, ChefDashboardPage, DeliveryDashboardPage, AdminDashboardPage } from "./pages/Dashboard";
import ChefDiscovery from "./pages/ChefDiscovery";
import ChefDetail from "./pages/ChefDetail";
import Subscribe from "./pages/Subscribe";
import MealRecommendations from "./pages/MealRecommendations";
import WeeklyMenu from "./pages/WeeklyMenu";
import CustomerOnboarding from "./pages/CustomerOnboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customer/home" element={<CustomerHome />} />
            <Route path="/customer/onboarding" element={<CustomerOnboarding />} />
            <Route path="/chef/dashboard" element={<ChefDashboardPage />} />
            <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/chefs" element={<ChefDiscovery />} />
            <Route path="/chef/:chefId" element={<ChefDetail />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/meal-recommendations" element={<MealRecommendations />} />
            <Route path="/weekly-menu" element={<WeeklyMenu />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
