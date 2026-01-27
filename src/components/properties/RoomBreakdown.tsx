import { motion } from 'framer-motion';
import {
  Bed,
  Bath,
  Sofa,
  ChefHat,
  UtensilsCrossed,
  Laptop2,
  BedDouble,
  BedSingle,
} from 'lucide-react';
import { RoomConfig } from '@/types/database';
import { cn } from '@/lib/utils';

interface RoomBreakdownProps {
  rooms: RoomConfig[];
  bedrooms: number;
  bathrooms: number;
  className?: string;
}

const roomTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  bedroom: Bed,
  bathroom: Bath,
  living: Sofa,
  kitchen: ChefHat,
  dining: UtensilsCrossed,
  office: Laptop2,
};

const bedTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  king: BedDouble,
  queen: BedDouble,
  double: BedDouble,
  twin: BedSingle,
  sofa: Sofa,
};

const bedTypeLabels: Record<string, string> = {
  king: 'King Bed',
  queen: 'Queen Bed',
  double: 'Double Bed',
  twin: 'Twin Bed',
  sofa: 'Sofa Bed',
};

export function RoomBreakdown({
  rooms,
  bedrooms,
  bathrooms,
  className,
}: RoomBreakdownProps) {
  // If no detailed rooms, show summary based on counts
  if (!rooms || rooms.length === 0) {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4', className)}>
        <div className="card-organic p-4 text-center">
          <Bed className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium">{bedrooms}</p>
          <p className="text-sm text-muted-foreground">
            {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
          </p>
        </div>
        <div className="card-organic p-4 text-center">
          <Bath className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium">{bathrooms}</p>
          <p className="text-sm text-muted-foreground">
            {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
          </p>
        </div>
      </div>
    );
  }

  // Group rooms by type
  const bedroomRooms = rooms.filter((r) => r.type === 'bedroom');
  const bathroomRooms = rooms.filter((r) => r.type === 'bathroom');
  const otherRooms = rooms.filter(
    (r) => r.type !== 'bedroom' && r.type !== 'bathroom'
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-organic p-4 text-center">
          <Bed className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium">{bedrooms}</p>
          <p className="text-sm text-muted-foreground">
            {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
          </p>
        </div>
        <div className="card-organic p-4 text-center">
          <Bath className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium">{bathrooms}</p>
          <p className="text-sm text-muted-foreground">
            {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
          </p>
        </div>
        {otherRooms.length > 0 && (
          <div className="card-organic p-4 text-center">
            <Sofa className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-medium">{otherRooms.length}</p>
            <p className="text-sm text-muted-foreground">Living Spaces</p>
          </div>
        )}
      </div>

      {/* Detailed Bedroom Breakdown */}
      {bedroomRooms.length > 0 && (
        <div>
          <h4 className="font-medium mb-4">Sleeping Arrangements</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bedroomRooms.map((room, index) => {
              const Icon = roomTypeIcons[room.type] || Bed;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-organic p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{room.name}</p>
                      {room.beds && room.beds.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {room.beds.map((bed, bedIndex) => {
                            const BedIcon = bedTypeIcons[bed.type] || BedDouble;
                            return (
                              <div
                                key={bedIndex}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <BedIcon className="h-4 w-4" />
                                <span>
                                  {bed.count}x {bedTypeLabels[bed.type]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {room.features && room.features.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {room.features.map((feature, fIndex) => (
                            <span
                              key={fIndex}
                              className="text-xs px-2 py-0.5 bg-secondary rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Rooms */}
      {otherRooms.length > 0 && (
        <div>
          <h4 className="font-medium mb-4">Other Spaces</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherRooms.map((room, index) => {
              const Icon = roomTypeIcons[room.type] || Sofa;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-organic p-4 flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{room.name}</p>
                    {room.features && room.features.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {room.features.join(', ')}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
