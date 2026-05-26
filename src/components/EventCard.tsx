import React from "react";
import { Calendar, MapPin, Tag, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Event } from "../types";

interface EventCardProps {
  key?: string;
  event: Event;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  // Find minimum price
  const prices = event.ticketTypes?.map((t) => t.price) || [0];
  const minPrice = Math.min(...prices);
  const isFree = minPrice === 0;

  return (
    <motion.div
      id={`event-card-${event.id}`}
      whileHover={{ y: -6, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col h-full hover:border-slate-300 transition-all duration-300 group cursor-pointer"
    >
      {/* Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-105">
        <img
          src={event.bannerImage || `https://picsum.photos/seed/${event.id}/600/300`}
          alt={event.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-80" />
        
        {/* Badges on Banner */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/80 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
            <Tag className="w-2.5 h-2.5 text-indigo-600" />
            {event.category}
          </span>
          {isFree && (
            <span className="bg-emerald-50/95 backdrop-blur-md text-emerald-700 border border-emerald-200 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
              FREE PASS
            </span>
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3 bg-gradient-to-r from-indigo-605 to-violet-605 bg-indigo-600 text-white font-display font-bold text-[10.5px] px-3 py-1.5 rounded-xl border border-white/20 shadow-sm uppercase tracking-wider">
          {isFree ? "Free Entry" : `Starts at $${minPrice}`}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-display font-bold text-base leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {event.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Meta items */}
        <div className="space-y-2 border-t border-slate-100 pt-3.5 text-[11px] text-slate-650 font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Footer info (Seats available) */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>{event.capacity - event.registeredCount} spots remaining</span>
          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-205">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
