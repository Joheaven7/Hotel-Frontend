import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const UpcomingStaysWidget = ({ stays }) => {
  if (!stays || stays.length === 0) {
    return (
      <div className="bg-surface rounded-card shadow-soft p-8 text-center h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <Calendar size={32} />
        </div>
        <h3 className="text-xl font-heading font-bold text-text-primary mb-2">No Upcoming Stays</h3>
        <p className="text-text-secondary mb-6">Ready for your next luxury experience?</p>
        <button className="bg-primary text-white px-6 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft">
          Book Now
        </button>
      </div>
    );
  }

  const nextStay = stays[0];

  return (
    <div className="bg-surface rounded-card shadow-soft overflow-hidden h-full flex flex-col relative group">
      {/* Abstract Background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="p-6 border-b border-border flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
        <h3 className="text-lg font-heading font-bold text-text-primary">Next Reservation</h3>
        <StatusBadge type={nextStay.status} />
      </div>

      <div className="p-6 flex-1 flex flex-col z-10">
        <h4 className="text-2xl font-bold text-text-primary mb-1">{nextStay.hotel}</h4>
        <p className="text-primary font-medium mb-6">{nextStay.room}</p>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <Calendar className="text-text-secondary mt-0.5" size={20} />
            <div>
              <p className="text-sm text-text-secondary font-medium">Check-in</p>
              <p className="text-text-primary font-semibold">{nextStay.checkIn} <span className="text-text-secondary font-normal text-sm">after 3:00 PM</span></p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Calendar className="text-text-secondary mt-0.5" size={20} />
            <div>
              <p className="text-sm text-text-secondary font-medium">Check-out</p>
              <p className="text-text-primary font-semibold">{nextStay.checkOut} <span className="text-text-secondary font-normal text-sm">before 11:00 AM</span></p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="text-text-secondary mt-0.5" size={20} />
            <div>
              <p className="text-sm text-text-secondary font-medium">Location</p>
              <p className="text-text-primary font-semibold">Get Directions</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border flex gap-3">
          <button className="flex-1 bg-primary text-white py-2.5 rounded-btn font-medium hover:bg-primary/90 transition-colors">
            Manage Booking
          </button>
          <button className="flex-1 bg-background border border-border text-text-primary py-2.5 rounded-btn font-medium hover:bg-border/50 transition-colors">
            Contact Hotel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingStaysWidget;
