

# Multi-Property Hospitality Platform

A production-ready platform for managing 20+ luxury vacation properties with a warm, organic aesthetic. Built with React + Vite + TypeScript, powered by Lovable Cloud (Supabase).

---

## 1. Database Architecture

### Core Collections

**Properties Table**
- Name, slug (unique), description
- Hero image URL + gallery (array of URLs)
- Location (city, region, country)
- Amenities (array: wifi, pool, spa, kitchen, etc.)
- Base price per night
- Maximum guests
- Property status (active, draft, archived)
- Created/updated timestamps

**Bookings Table**
- Property relationship
- Guest information (name, email, phone)
- Check-in / check-out dates
- Number of nights (calculated)
- Number of guests
- Total price (basePrice × nights)
- Booking status (pending, confirmed, cancelled)
- Created timestamp

**Availability Table**
- Property relationship
- Date
- Available (boolean)
- Used for blocking dates and managing availability

**User Roles**
- Admin users for property management
- Role-based access control

---

## 2. Public-Facing Website

### Homepage
- Full-screen hero section with warm, earthy tones and natural textures
- Prominent search bar with:
  - Location dropdown/autocomplete
  - Guest count selector
  - Check-in / check-out date pickers
- Featured properties grid below the fold
- Soft shadows, organic shapes, subtle animations

### Property Listing Page
- Filtered results based on search criteria
- Card grid showing property image, name, location, price, max guests
- Filter sidebar (amenities, price range)
- Smooth Framer Motion transitions

### Property Detail Page
- Hero image with full-width gallery carousel
- Property description and highlights
- Amenities list with icons
- Interactive booking widget (sticky sidebar):
  - Custom date picker showing availability
  - Guest count selector
  - Price calculation (nights × base price)
  - "Request Booking" button
- Location section with property address

### Booking Flow
- Date selection with visual availability calendar
- Guest details form
- Price summary
- Confirmation page after submission

---

## 3. Admin Dashboard (/admin)

### Dashboard Overview
- Total properties count
- Upcoming bookings summary
- Recent booking activity
- Quick stats cards

### Properties Management
- List all properties with search/filter
- Add new property form with all fields
- Edit existing properties
- Upload hero image and gallery images (Supabase Storage)
- Toggle property status (active/draft/archived)

### Bookings Management
- List all bookings with filters (status, property, date range)
- View booking details
- Update booking status (confirm, cancel)
- Search by guest name/email

### Availability Management
- Calendar view per property
- Block/unblock specific dates
- Bulk date management

### Admin Authentication
- Secure login for admin users
- Role-based access control
- Protected routes

---

## 4. Design System (Warm & Organic)

### Color Palette
- Primary: Warm terracotta/clay tones
- Secondary: Soft sage green
- Background: Warm off-white/cream
- Text: Deep warm brown
- Accents: Muted gold

### Typography
- Elegant serif for headings
- Clean sans-serif for body text

### Visual Elements
- Soft, rounded corners
- Natural shadow depth
- Subtle texture overlays
- Organic shapes in decorative elements

### Animations (Framer Motion)
- Smooth page transitions
- Gallery image crossfades
- Hover effects on property cards
- Loading states with elegant spinners

---

## 5. Technical Foundation

### File Storage
- Supabase Storage buckets for property images
- Separate buckets for hero images and gallery images
- Proper RLS policies for upload permissions

### API Structure
- React Query for data fetching/caching
- Optimistic updates for admin operations
- Real-time availability updates

### Routing
- `/` - Homepage with search
- `/properties` - Listing page
- `/properties/:slug` - Property detail
- `/booking/confirm` - Booking confirmation
- `/admin` - Admin dashboard
- `/admin/properties` - Property management
- `/admin/bookings` - Booking management
- `/admin/availability` - Calendar management

### Security
- Admin authentication required for /admin routes
- RLS policies on all tables
- Input validation on all forms
- Secure file upload handling

---

## 6. Scalability Considerations

- Efficient database queries with proper indexing
- Image optimization for fast loading
- Lazy loading for property galleries
- Pagination for large property lists
- Component-based architecture for easy feature additions
- Prepared for future payment gateway integration

