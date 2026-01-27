import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BrandProvider } from "@/contexts/BrandContext";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import BookingConfirm from "./pages/BookingConfirm";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Destinations from "./pages/Destinations";
import DestinationDetail from "./pages/DestinationDetail";
import Experiences from "./pages/Experiences";
import ExperienceDetail from "./pages/ExperienceDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminPropertyForm from "./pages/admin/AdminPropertyForm";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAmenities from "./pages/admin/AdminAmenities";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminExperiences from "./pages/admin/AdminExperiences";
import AdminExperienceEnquiries from "./pages/admin/AdminExperienceEnquiries";
import AdminBlogPosts from "./pages/admin/AdminBlogPosts";
import AdminBlogCategories from "./pages/admin/AdminBlogCategories";
import AdminBlogAuthors from "./pages/admin/AdminBlogAuthors";
import AdminNewsletterSubscribers from "./pages/admin/AdminNewsletterSubscribers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:slug" element={<PropertyDetail />} />
              <Route path="/booking/confirm" element={<BookingConfirm />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/destinations/:slug" element={<DestinationDetail />} />
              <Route path="/experiences" element={<Experiences />} />
              <Route path="/experiences/:slug" element={<ExperienceDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/properties" element={<AdminProperties />} />
              <Route path="/admin/properties/new" element={<AdminPropertyForm />} />
              <Route path="/admin/properties/:id/edit" element={<AdminPropertyForm />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/availability" element={<AdminAvailability />} />
              <Route path="/admin/amenities" element={<AdminAmenities />} />
              <Route path="/admin/destinations" element={<AdminDestinations />} />
              <Route path="/admin/experiences" element={<AdminExperiences />} />
              <Route path="/admin/experience-enquiries" element={<AdminExperienceEnquiries />} />
              <Route path="/admin/blog" element={<AdminBlogPosts />} />
              <Route path="/admin/blog/authors" element={<AdminBlogAuthors />} />
              <Route path="/admin/blog/categories" element={<AdminBlogCategories />} />
              <Route path="/admin/newsletter" element={<AdminNewsletterSubscribers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BrandProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
