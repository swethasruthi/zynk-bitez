import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard, ChefDashboardPage, DeliveryDashboardPage, AdminDashboardPage } from "./pages/Dashboard";
import CustomerHomePage from "./pages/CustomerHomePage";
import ChefDetailPage from "./pages/ChefDetailPage";
import PaymentPage from "./pages/PaymentPage";
import SubscriptionTracking from "./pages/SubscriptionTracking";
import MySubscriptions from "./pages/customer/MySubscriptions";
import CustomerDeliveries from "./pages/customer/CustomerDeliveries";
import CustomerBilling from "./pages/customer/CustomerBilling";
import CustomerProfile from "./pages/customer/CustomerProfile";
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
            {/* Customer flow */}
            <Route path="/customer/home" element={<CustomerHomePage />} />
            <Route path="/customer/onboarding" element={<CustomerOnboarding />} />
            <Route path="/customer/chef/:chefId" element={<ChefDetailPage />} />
            <Route path="/customer/payment/:subscriptionId" element={<PaymentPage />} />
            <Route path="/customer/subscription/:subscriptionId" element={<SubscriptionTracking />} />
            <Route path="/customer/subscriptions" element={<MySubscriptions />} />
            <Route path="/customer/deliveries" element={<CustomerDeliveries />} />
            <Route path="/customer/billing" element={<CustomerBilling />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            {/* Other role dashboards */}
            <Route path="/chef/dashboard" element={<ChefDashboardPage />} />
            <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            {/* Legacy routes (preserved) */}
            <Route path="/chefs" element={<ChefDiscovery />} />
            <Route path="/chef/:chefId" element={<ChefDetail />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/meal-recommendations" element={<MealRecommendations />} />
            <Route path="/weekly-menu" element={<WeeklyMenu />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
