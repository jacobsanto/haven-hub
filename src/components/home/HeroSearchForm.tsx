import { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFeaturedDestinations } from '@/hooks/useDestinations';

export function HeroSearchForm() {
  const navigate = useNavigate();
  const { data: destinations } = useFeaturedDestinations();
  const [destination, setDestination] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`);
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Search card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-white font-serif text-lg mb-4">Find Your Dream Destination</h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Where to?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>
      </div>

      {/* Popular destinations pills */}
      {destinations && destinations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-white/60 text-xs uppercase tracking-wider self-center mr-1">Popular:</span>
          {destinations.slice(0, 5).map((dest) => (
            <button
              key={dest.id}
              onClick={() => navigate(`/destinations/${dest.slug}`)}
              className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              {dest.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
