/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Ticket, CreditCard, ChevronRight, Check, ShieldCheck, 
  Sparkles, Linkedin, Flame, Percent 
} from 'lucide-react';
import { Event, PurchasedTicket, Registration } from '../types';

interface CheckoutModalProps {
  event: Event;
  userEmail: string;
  userName: string;
  authToken?: string | null;
  onClose: () => void;
  onSuccess: (reg: Registration) => void;
}

export default function CheckoutModal({ event, userEmail, userName, authToken, onClose, onSuccess }: CheckoutModalProps) {
  // Quantities for each ticket type
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    event.tickets.forEach(t => {
      init[t.name] = t.name === 'General Admission' || t.price === 0 ? 1 : 0;
    });
    return init;
  });

  // Seating Heatmap / Zones Selection
  // Heatmap zones with standard booking densities (heat)
  const heatmapZones = [
    { id: 'zone-vip', name: 'VIP Front Stage Pit', text: 'Front row experience with ultra-clear acoustics and closest speaker views.', availability: 'Remaining seats: 12', heat: 'High Booking Density', color: 'rose', stroke: '#f43f5e', fill: '#ffe4e6' },
    { id: 'zone-mezzanine', name: 'Mezzanine Central Tier', text: 'Comfortable premium seating with balanced acoustic and visual layout.', availability: 'Remaining seats: 54', heat: 'Moderate Booking Density', color: 'blue', stroke: '#2563eb', fill: '#dbeafe' },
    { id: 'zone-balcony', name: 'General Balcony & Standing', text: 'Standard back row standing zone. Excellent dynamic festival vibes.', availability: 'Remaining seats: 112', heat: 'Low Booking Density', color: 'emerald', stroke: '#10b981', fill: '#d1fae5' }
  ];
  const [selectedZone, setSelectedZone] = useState<string>('zone-mezzanine');

  // Attendee Info form
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [linkedin, setLinkedin] = useState('https://linkedin.com/in/');
  const [optInNetworking, setOptInNetworking] = useState(true);

  // Promo / Discount Codes
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Payment Integration State
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculation summaries
  const subtotal = event.tickets.reduce((acc, t) => acc + (quantities[t.name] || 0) * t.price, 0);
  const discountAmount = appliedPromo ? subtotal * (appliedPromo.percent / 100) : 0;
  const serviceFee = subtotal > 0 ? 2.50 : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + serviceFee);

  const totalTicketsSelected: number = (Object.values(quantities) as number[]).reduce((acc: number, q: number) => acc + q, 0);

  // Sync CardHolder with state
  useEffect(() => {
    setCardHolder(name);
  }, [name]);

  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    
    if (!promoCode) return;
    const cleanCode = promoCode.trim().toUpperCase();

    // Check discount matching
    const match = event.discounts.find(d => d.code.toUpperCase() === cleanCode);
    if (!match) {
      setPromoError('Invalid coupon code. Try AIFUTURE or STUDENT50.');
      return;
    }

    // Check code expiry dates
    const expiry = new Date(match.expiryDate);
    const today = new Date('2026-05-26T06:39:44Z'); // Current simulated time provided by prompt
    if (today > expiry) {
      setPromoError(`This discount code has expired on ${expiry.toLocaleDateString()}`);
      return;
    }

    setAppliedPromo({ code: match.code, percent: match.discountPercent });
    setPromoSuccess(`Promo code applied! Enjoy ${match.discountPercent}% off Subtotal.`);
  };

  const handleQuantityChange = (tname: string, diff: number, maxRemain: number) => {
    setQuantities(prev => {
      const current = prev[tname] || 0;
      const next = current + diff;
      if (next < 0) return prev;
      if (next > 10) return prev; // Limit checkout to 10 tickets per type in custom orders
      if (next > maxRemain) return prev; // Cannot exceed remaining capacity
      return { ...prev, [tname]: next };
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (totalTicketsSelected <= 0) {
      setErrorMessage('Please select at least one ticket before proceeding.');
      return;
    }
    if (!name || !email) {
      setErrorMessage('Attendee name and email are required.');
      return;
    }

    setIsSubmitting(true);

    // Build standard multi-ticket details payload
    const ticketsPayload: PurchasedTicket[] = [];
    event.tickets.forEach(t => {
      const q = quantities[t.name] || 0;
      if (q > 0) {
        ticketsPayload.push({
          ticketTypeName: t.name,
          quantity: q,
          price: t.price
        });
      }
    });

    try {
      const headersOptions: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headersOptions['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: headersOptions,
        body: JSON.stringify({
          eventId: event.id,
          attendeeName: name,
          attendeeEmail: email,
          linkedinUrl: optInNetworking ? linkedin : undefined,
          ticketsPurchased: ticketsPayload,
          codeApplied: appliedPromo ? appliedPromo.code : undefined,
          totalPaid: totalAmount
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Checkout process failed.');
      }

      // Simulate network wait for payment sandbox gateways
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(data);
      }, 1500);

    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Payment system issue. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity duration-300" id="checkout-modal-backdrop">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row transition-all duration-300 scale-100">
        
        {/* Left Side Code Details & Selection Column */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="checkout-main-form">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors md:static md:mb-6 animate-pulse"
            title="Cancel Checkout"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mt-8 md:mt-0">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Complete Reservation
            </h2>
            <p className="mt-1 text-sm text-blue-600 font-heading">
              {event.name}
            </p>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="mt-6 space-y-6">
            
            {/* 1. Ticket Type Quantity Selection */}
            <div>
              <h3 className="mb-3 font-heading text-sm font-semibold tracking-wide uppercase text-slate-700 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-blue-500" />
                Select Ticket Tiers
              </h3>
              <div className="space-y-3">
                {event.tickets.map(t => {
                  const q = quantities[t.name] || 0;
                  const isSoldOut = t.capacity > 0 && t.remainingCapacity <= 0;
                  return (
                    <div 
                      key={t.id} 
                      className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                        q > 0 
                          ? 'border-blue-200 bg-blue-50/20' 
                          : isSoldOut 
                            ? 'border-slate-100 bg-slate-50 text-slate-400' 
                            : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-semibold text-slate-800">{t.name}</p>
                          {t.name.includes('Early') && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-800 uppercase animate-pulse">
                              Hot Deal
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-slate-500 font-medium">
                          {t.price === 0 ? 'Free RSVP' : `$${t.price} each`}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {isSoldOut ? 'Sold Out' : `${t.remainingCapacity} seats left`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={q === 0 || isSoldOut}
                          onClick={() => handleQuantityChange(t.name, -1, t.remainingCapacity)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-slate-800">{q}</span>
                        <button
                          type="button"
                          disabled={isSoldOut}
                          onClick={() => handleQuantityChange(t.name, 1, t.remainingCapacity)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive Seating Grid Heatmap (Innovative Feature) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold tracking-wide uppercase text-slate-700 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Select Seating Zone & Heatmap
                </h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-700">
                  AI Seat Density Live
                </span>
              </div>
              
              {/* Interactive SVG Heatmap layout */}
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-center">
                  <svg viewBox="0 0 320 160" className="w-full max-w-[280px]">
                    {/* Stage represent */}
                    <rect x="60" y="5" width="200" height="15" rx="4" fill="#1e293b" />
                    <text x="160" y="16" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">STAGE AREA</text>
                    
                    {/* VIP Heat Area (Zone Front) */}
                    <path 
                      d="M 60 40 Q 160 30 260 40 L 280 65 Q 160 55 40 65 Z" 
                      fill={selectedZone === 'zone-vip' ? '#ffe4e6' : '#fff1f2'} 
                      stroke={selectedZone === 'zone-vip' ? '#f43f5e' : '#fda4af'} 
                      strokeWidth={selectedZone === 'zone-vip' ? '2.5' : '1.5'} 
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedZone('zone-vip')}
                    />
                    <text x="160" y="54" fill="#a01430" fontSize="8" textAnchor="middle" fontWeight="bold">VIP Pit (High Heat 🔥)</text>

                    {/* Mezzanine Central Area */}
                    <path 
                      d="M 38 72 Q 160 62 282 72 L 295 105 Q 160 95 25 105 Z" 
                      fill={selectedZone === 'zone-mezzanine' ? '#e0e7ff' : '#eef2ff'} 
                      stroke={selectedZone === 'zone-mezzanine' ? '#6366f1' : '#a5b4fc'} 
                      strokeWidth={selectedZone === 'zone-mezzanine' ? '2.5' : '1.5'} 
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedZone('zone-mezzanine')}
                    />
                    <text x="160" y="90" fill="#312e81" fontSize="8" textAnchor="middle" fontWeight="bold">Mezzanine (Mod Heat ⚡)</text>

                    {/* Balcony Standing Area */}
                    <path 
                      d="M 22 112 Q 160 102 298 112 L 310 145 Q 160 135 10 145 Z" 
                      fill={selectedZone === 'zone-balcony' ? '#d1fae5' : '#ecfdf5'} 
                      stroke={selectedZone === 'zone-balcony' ? '#10b981' : '#6ee7b7'} 
                      strokeWidth={selectedZone === 'zone-balcony' ? '2.5' : '1.5'} 
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedZone('zone-balcony')}
                    />
                    <text x="160" y="130" fill="#064e3b" fontSize="8" textAnchor="middle" fontWeight="bold">Balcony Standing (Cool ❄️)</text>
                  </svg>
                </div>
                
                {/* Dynamic selected zone information description block */}
                <div className="mt-3 border-t border-slate-200 pt-3">
                  {heatmapZones.map(hz => {
                    if (hz.id !== selectedZone) return null;
                    return (
                      <div key={hz.id} className="transition-opacity duration-300">
                        <div className="flex items-center justify-between">
                          <p className="font-heading text-sm font-semibold text-slate-800">{hz.name}</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            hz.color === 'rose' 
                              ? 'bg-rose-100 text-rose-800' 
                              : hz.color === 'blue'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {hz.heat}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{hz.text}</p>
                        <p className="mt-1 font-mono text-[11px] font-semibold text-slate-400">{hz.availability}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Attendee Professional Details & LinkedIn Networking opt-in */}
            <div>
              <h3 className="mb-3 font-heading text-sm font-semibold tracking-wide uppercase text-slate-700 flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-sky-500" />
                Attendee Roster Profile
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Attendee Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Attendee Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* LinkedIn networking container badge */}
              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInNetworking}
                    onChange={(e) => setOptInNetworking(e.target.checked)}
                    className="mt-1 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-heading text-xs font-bold text-slate-800">
                      Opt-in to Attendee Networking Match
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Share your LinkedIn URL securely with fellow verified attendees. Let EventSphere AI assist in finding relevant networking matches side-by-side!
                    </p>
                  </div>
                </label>

                {optInNetworking && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Your LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs text-sky-900 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error Indicators */}
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-600 border border-rose-100 animate-shake">
                {errorMessage}
              </div>
            )}
          </form>
        </div>

        {/* Right Side Checkout Order Invoicing & Gateway simulation */}
        <div className="w-full bg-slate-900 text-slate-100 p-6 md:p-8 md:w-80 flex flex-col justify-between border-t border-slate-800 md:border-t-0 md:border-l" id="checkout-invoice-pane">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Order Invoice</span>
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>

            {/* Purchased Tickets Summary list */}
            <div className="space-y-3 pb-6 border-b border-slate-800 text-slate-300">
              {totalTicketsSelected === 0 ? (
                <p className="text-xs text-slate-400 italic">No tickets selected yet.</p>
              ) : (
                event.tickets.map(t => {
                  const q = quantities[t.name] || 0;
                  if (q === 0) return null;
                  return (
                    <div key={t.id} className="flex justify-between text-xs font-medium">
                      <span>{q}x {t.name}</span>
                      <span className="font-mono">${q * t.price}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Discount Promo application box */}
            <div className="py-5 border-b border-slate-800">
              <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Discount Coupon Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AIFUTURE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white uppercase focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold hover:bg-blue-550 transition-colors"
                >
                  Apply
                </button>
              </div>

              {promoError && <p className="mt-2 text-[10px] font-medium text-rose-400">{promoError}</p>}
              {promoSuccess && (
                <p className="mt-2 text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {promoSuccess}
                </p>
              )}
            </div>

            {/* Price Line Invoice Accumulation */}
            <div className="py-5 space-y-2 border-b border-slate-800 text-xs font-medium text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    Promo ({appliedPromo.percent}%)
                  </span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {subtotal > 0 && (
                <div className="flex justify-between">
                  <span>Booking Platform Fee</span>
                  <span className="font-mono">${serviceFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-bold text-white">
                <span>Grand Total</span>
                <span className="font-mono text-blue-300">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Sandbox payment system */}
            {totalAmount > 0 && (
              <div className="py-5 space-y-4">
                <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Sandbox Gateways</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentGateway('stripe')}
                    className={`flex-1 rounded-lg border py-2 text-center text-xs font-semibold transition-all ${
                      paymentGateway === 'stripe' 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Stripe Simulated
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentGateway('razorpay')}
                    className={`flex-1 rounded-lg border py-2 text-center text-xs font-semibold transition-all ${
                      paymentGateway === 'razorpay' 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Razorpay Sandbox
                  </button>
                </div>

                <div className="rounded-xl bg-slate-950 p-4 border border-slate-850">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span className="uppercase">{paymentGateway} Integrated</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="space-y-1.5 font-mono text-xs text-slate-300">
                    <div>
                      <p className="text-[9px] text-slate-500">CARD NUMBER</p>
                      <input 
                        type="text" 
                        value={cardNumber} 
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-transparent border-0 p-0 text-xs text-white font-mono focus:ring-0 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex justify-between gap-4 pt-1">
                      <div className="flex-1">
                        <p className="text-[9px] text-slate-500">EXPIRY</p>
                        <p className="text-white">12 / 29</p>
                      </div>
                      <div className="w-12 text-right">
                        <p className="text-[9px] text-slate-500">CVC</p>
                        <p className="text-white font-mono">•••</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <button
              onClick={handleCheckoutSubmit}
              disabled={isSubmitting}
              className="relative flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 font-heading text-sm font-semibold text-white transition-all hover:bg-blue-550 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/10"
              id="btn-confirm-payment"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authorizing Safe Sandbox...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Pay & Book Seats</span>
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Encrypted sandbox gateway checkout simulation. No real money gets processed.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
