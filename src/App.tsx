import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { BrandProvider, useBrand } from "@/contexts/BrandContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { UnifiedBookingDialog } from "@/components/booking/UnifiedBookingDialog";
import Index from "./pages/Index";

// Lazy-loaded public pages
const Properties = React.lazy(() => import("./pages/Properties"));
const BookingConfirm = React.lazy(() => import("./pages/BookingConfirm"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancelled = React.lazy(() => import("./pages/PaymentCancelled"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Destinations = React.lazy(() => import("./pages/Destinations"));
const Experiences = React.lazy(() => import("./pages/Experiences"));
const Blog = React.lazy(() => import("./pages/Blog"));
const BlogPost = React.lazy(() => import("./pages/BlogPost"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const FAQ = React.lazy(() => import("./pages/FAQ"));

// Lazy-loaded admin pages
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProperties = React.lazy(() => import("./pages/admin/AdminProperties"));
const AdminPropertyForm = React.lazy(() => import("./pages/admin/AdminPropertyForm"));
const AdminQuickOnboard = React.lazy(() => import("./pages/admin/AdminQuickOnboard"));
const AdminBookings = React.lazy(() => import("./pages/admin/AdminBookings"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
const AdminAmenities = React.lazy(() => import("./pages/admin/AdminAmenities"));
const AdminIconLibrary = React.lazy(() => import("./pages/admin/AdminIconLibrary"));
const AdminDestinations = React.lazy(() => import("./pages/admin/AdminDestinations"));
const AdminExperiences = React.lazy(() => import("./pages/admin/AdminExperiences"));
const AdminExperienceEnquiries = React.lazy(() => import("./pages/admin/AdminExperienceEnquiries"));
const AdminBlogPosts = React.lazy(() => import("./pages/admin/AdminBlogPosts"));
const AdminBlogCategories = React.lazy(() => import("./pages/admin/AdminBlogCategories"));
const AdminBlogAuthors = React.lazy(() => import("./pages/admin/AdminBlogAuthors"));
const AdminNewsletterSubscribers = React.lazy(() => import("./pages/admin/AdminNewsletterSubscribers"));
const AdminAddonsManagement = React.lazy(() => import("./pages/admin/AdminAddonsManagement"));
const AdminPromotions = React.lazy(() => import("./pages/admin/AdminPromotionsCenter"));
const AdminAnalytics = React.lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminPMSHealth = React.lazy(() => import("./pages/admin/AdminPMSHealth"));
const AdminFees = React.lazy(() => import("./pages/admin/AdminFees"));
const AdminRatePlans = React.lazy(() => import("./pages/admin/AdminRatePlans"));
const AdminSeasonalRatesImport = React.lazy(() => import("./pages/admin/AdminSeasonalRatesImport"));
const AdminPricingCenter = React.lazy(() => import("./pages/admin/AdminPricingCenter"));
const AdminAIContent = React.lazy(() => import("./pages/admin/AdminAIContent"));
const AdminContentCalendar = React.lazy(() => import("./pages/admin/AdminContentCalendar"));
const AdminContentHub = React.lazy(() => import("./pages/admin/AdminContentHub"));
const AdminPromotionalCampaigns = React.lazy(() => import("./pages/admin/AdminPromotionalCampaigns"));
const AdminExitIntent = React.lazy(() => import("./pages/admin/AdminExitIntent"));
const AdminUserRoles = React.lazy(() => import("./pages/admin/AdminUserRoles"));
const AdminPageContent = React.lazy(() => import("./pages/admin/AdminPageContent"));
const AdminNavigation = React.lazy(() => import("./pages/admin/AdminNavigation"));
const AdminSocialAccounts = React.lazy(() => import("./pages/admin/AdminSocialAccounts"));
const AdminSocialPosts = React.lazy(() => import("./pages/admin/AdminSocialPosts"));
const AdminSocialComposer = React.lazy(() => import("./pages/admin/AdminSocialComposer"));
const AdminTestimonials = React.lazy(() => import("./pages/admin/AdminTestimonials"));

const queryClient = new QueryClient();

// Connects BrandContext's baseCurrency to CurrencyProvider
function CurrencyProviderWithBrand({ children }: { children: React.ReactNode }) {
  const { baseCurrency } = useBrand();
  return <CurrencyProvider baseCurrency={baseCurrency}>{children}</CurrencyProvider>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <BrandProvider>
          <CurrencyProviderWithBrand>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <BookingProvider>
                  <UnifiedBookingDialog />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/properties" element={<Properties />} />
                      <Route path="/booking/confirm" element={<BookingConfirm />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/payment-success" element={<PaymentSuccess />} />
                      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/destinations" element={<Destinations />} />
                      <Route path="/experiences" element={<Experiences />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/properties" element={<AdminProperties />} />
                      <Route path="/admin/properties/new" element={<AdminPropertyForm />} />
                      <Route path="/admin/properties/quick-onboard" element={<AdminQuickOnboard />} />
                      <Route path="/admin/properties/:id/edit" element={<AdminPropertyForm />} />
                      <Route path="/admin/bookings" element={<AdminBookings />} />
                      <Route path="/admin/amenities" element={<AdminAmenities />} />
                      <Route path="/admin/amenities/icons" element={<AdminIconLibrary />} />
                      <Route path="/admin/destinations" element={<AdminDestinations />} />
                      <Route path="/admin/experiences" element={<AdminExperiences />} />
                      <Route path="/admin/experience-enquiries" element={<AdminExperienceEnquiries />} />
                      <Route path="/admin/blog" element={<AdminBlogPosts />} />
                      <Route path="/admin/blog/authors" element={<AdminBlogAuthors />} />
                      <Route path="/admin/blog/categories" element={<AdminBlogCategories />} />
                      <Route path="/admin/newsletter" element={<AdminNewsletterSubscribers />} />
                      <Route path="/admin/addons" element={<AdminAddonsManagement />} />
                      <Route path="/admin/promotions" element={<AdminPromotions />} />
                      <Route path="/admin/analytics" element={<AdminAnalytics />} />
                      <Route path="/admin/pms" element={<AdminPMSHealth />} />
                      <Route path="/admin/fees" element={<AdminFees />} />
                      <Route path="/admin/rate-plans" element={<AdminRatePlans />} />
                      <Route path="/admin/seasonal-rates-import" element={<AdminSeasonalRatesImport />} />
                      <Route path="/admin/pricing" element={<AdminPricingCenter />} />
                      <Route path="/admin/ai-content" element={<AdminAIContent />} />
                      <Route path="/admin/content-calendar" element={<AdminContentCalendar />} />
                      <Route path="/admin/content-hub" element={<AdminContentHub />} />
                      <Route path="/admin/campaigns" element={<AdminPromotionalCampaigns />} />
                      <Route path="/admin/exit-intent" element={<AdminExitIntent />} />
                      <Route path="/admin/user-roles" element={<AdminUserRoles />} />
                      <Route path="/admin/content" element={<AdminPageContent />} />
                      <Route path="/admin/navigation" element={<AdminNavigation />} />
                      <Route path="/admin/social-accounts" element={<AdminSocialAccounts />} />
                      <Route path="/admin/social-posts" element={<AdminSocialPosts />} />
                      <Route path="/admin/social-composer" element={<AdminSocialComposer />} />
                      <Route path="/admin/testimonials" element={<AdminTestimonials />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BookingProvider>
              </BrowserRouter>
            </TooltipProvider>
          </CurrencyProviderWithBrand>
        </BrandProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
