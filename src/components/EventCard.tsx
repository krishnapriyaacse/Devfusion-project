/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, MapPin, Ticket, Heart, Sparkles, UserCheck } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  key?: any;
  event: Event;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onSelect: () => void;
}

export default function EventCard({ event, isWishlisted, onToggleWishlist, onSelect }: EventCardProps) {
  const totalCapacity = event.tickets.reduce((acc, t) => acc + t.capacity, 0);
  const remainingCapacity = event.tickets.reduce((acc, t) => acc + t.remainingCapacity, 0);
  const ticketsSold = totalCapacity - remainingCapacity;
  const percentageSold = Math.min(100, Math.round((ticketsSold / Math.max(1, totalCapacity)) * 100));

  // Determine starting price
  const prices = event.tickets.map(t => t.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const isFree = minPrice === 0;

  // Use gradient or fallback image
  const cardStyle = event.bannerImage.startsWith('linear-gradient')
    ? { background: event.bannerImage }
    : { backgroundImage: `url(${event.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md" id={`event-card-${event.id}`}>
      {/* Banner / Poster Section */}
      <div 
        className="relative h-48 w-full transition-all duration-500 group-hover:scale-[1.01]"
        style={cardStyle}
      >
        <div className="absolute inset-0 bg-black/25 transition-opacity group-hover:bg-black/20" />
        
        {/* Category & Price Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-xs backdrop-blur-xs border border-slate-100">
            {event.category}
          </span>
          <span className="rounded-full bg-slate-900/95 px-3 py-1 font-mono text-[10px] font-bold text-white shadow-xs backdrop-blur-xs border border-white/10">
            {isFree ? 'FREE' : `$${minPrice}+`}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 hover:text-rose-500"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label="Wishlist toggle"
          id={`wishlist-${event.id}`}
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} 
          />
        </button>

        {/* Short info row on poster */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="truncate max-w-[150px] drop-shadow-sm">{event.city}</span>
          </div>
          {event.speakers && event.speakers.length > 0 && (
            <div className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 backdrop-blur-xs">
              <UserCheck className="h-3 w-3 text-cyan-300" />
              <span>{event.speakers.length} Speakers</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>•</span>
          <span>{event.time}</span>
        </div>

        <h3 className="mb-2 font-heading text-lg font-bold leading-snug text-slate-900 group-hover:text-blue-600 transition-colors">
          {event.name}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500 flex-1">
          {event.description}
        </p>

        {/* Capacity Progress-bar */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5 text-slate-400" />
              {remainingCapacity > 0 ? `${remainingCapacity} tickets left` : 'Sold Out!'}
            </span>
            <span className="font-mono">{percentageSold}% Booked</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentageSold >= 90 
                  ? 'bg-rose-500' 
                   : percentageSold >= 75 
                    ? 'bg-amber-500' 
                     : 'bg-blue-600'
              }`}
              style={{ width: `${percentageSold}%` }}
            />
          </div>
        </div>

        {/* Primary Click Action */}
        <button
          onClick={onSelect}
          className="w-full rounded-xl bg-blue-50 py-2.5 px-4 font-heading text-xs font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white active:scale-[0.98] outline-hidden focus:ring-2 focus:ring-blue-500/25 cursor-pointer"
          id={`btn-select-${event.id}`}
        >
          View & Secure Seat
        </button>
      </div>
    </div>
  );
}
