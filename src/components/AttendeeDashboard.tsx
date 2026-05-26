/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Linkedin, Heart, HelpCircle, Archive, ClipboardCheck, 
  MapPin, Sparkles, Trophy, QrCode, CreditCard, RefreshCw, Compass 
} from 'lucide-react';
import { Event, Registration, UserProfile } from '../types';

interface AttendeeDashboardProps {
  userProfile: UserProfile;
  registrations: Registration[];
  events: Event[];
  authToken?: string | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onRefreshRegistrations: () => void;
}

export default function AttendeeDashboard({ 
  userProfile, registrations, events, authToken, onUpdateProfile, onRefreshRegistrations 
}: AttendeeDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'personalized' | 'badges'>('tickets');
  
  // Profile settings state
  const [name, setName] = useState(userProfile.name);
  const [linkedin, setLinkedin] = useState(userProfile.linkedinUrl || '');
  const [selectedCats, setSelectedCats] = useState<string[]>(userProfile.savedCategories || []);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // AI recommendations list
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [isGettingAIRecommendations, setIsGettingAIRecommendations] = useState(false);

  // Available categories list
  const categoriesList = [
    { id: 'Tech', name: 'Tech Summits / AI Lab' },
    { id: 'Music', name: 'Music Festivals / Synthwave' },
    { id: 'Arts', name: 'Arts Galleries / Exhibits' },
    { id: 'Food', name: 'Street Food Gastronomy' },
    { id: 'Sports', name: 'Athletics & Wellness' }
  ];

  // Load AI suggestions personalized on open or categories change
  useEffect(() => {
    fetchPersonalizedRecommendations();
  }, [selectedCats, events]);

  const fetchPersonalizedRecommendations = async () => {
    if (events.length === 0) return;
    setIsGettingAIRecommendations(true);
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: { ...userProfile, savedCategories: selectedCats },
          availableEvents: events
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAiRecs(data.recommendations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGettingAIRecommendations(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    try {
      const headersOptions: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headersOptions['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: headersOptions,
        body: JSON.stringify({
          name,
          linkedinUrl: linkedin || undefined,
          savedCategories: selectedCats
        })
      });
      const data = await response.json();
      if (response.ok) {
        onUpdateProfile(data);
        setProfileSuccessMsg('Accolades & configuration vectors updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Submit Refund Request action (Attendee check)
  const handleRequestRefund = async (regId: string) => {
    try {
      const response = await fetch(`/api/registrations/${regId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' })
      });
      if (response.ok) {
        onRefreshRegistrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Downloadable Ticket file generator (.TXT formatted print)
  const handleDownloadTicketString = (reg: Registration) => {
    const lines = [
      '==================================================',
      '         EVENTSPHERE SECURE TICKETING GATEWAY    ',
      '==================================================',
      `VOUCHER ID:       ${reg.id}`,
      `EVENT:            ${reg.eventName}`,
      `DATE / TIME:      ${reg.eventDate} at ${reg.eventTime}`,
      `VENUE:            ${reg.eventVenue}`,
      `ATTENDEE NAME:    ${reg.attendeeName}`,
      `ATTENDEE EMAIL:   ${reg.attendeeEmail}`,
      '--------------------------------------------------',
      'TICKETS PURCHASED SUMMARY:',
      reg.ticketsPurchased.map(t => ` - ${t.quantity}x ${t.ticketTypeName} ($${t.price} each)`).join('\n'),
      '--------------------------------------------------',
      `GRAND TOTAL PRICE PAID: $${reg.totalAmount}`,
      `QR GATE CODE VALUE:     ${reg.qrCode}`,
      '--------------------------------------------------',
      'INSTRUCTIONS: Please present this printable docket',
      'ticket code at the door for immediate automated',
      'credential scanning verification checkin gateway.',
      '==================================================',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VoucherTicket-${reg.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter registrations matching this user
  const userRegs = registrations.filter(r => r.attendeeEmail.toLowerCase() === userProfile.email.toLowerCase());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto" id="attendee-panel-view">
      
      {/* 1. Left side Profile & Categories Configuration */}
      <div className="lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Your Identity Space</span>
            <h3 className="font-heading text-lg font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <User className="h-4 w-4 text-blue-500" />
              Profile Vectors
            </h3>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-500 text-[10px] uppercase">Registered Email</label>
              <div className="mt-1 flex items-center gap-1.5 bg-slate-50 border rounded-xl px-3 py-2 text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{userProfile.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] uppercase">Attendee Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] uppercase font-heading flex items-center gap-1">
                <Linkedin className="h-3.5 w-3.5 text-sky-500" />
                LinkedIn Url
              </label>
              <input 
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            
            {/* Preferred Categories list */}
            <div>
              <label className="block text-slate-500 text-[10px] uppercase mb-1.5 font-heading">
                Favorite Categories (AI Discovery)
              </label>
              <div className="space-y-1.5">
                {categoriesList.map(cat => {
                  const isChecked = selectedCats.includes(cat.id);
                  return (
                    <label key={cat.id} className="flex items-center gap-2 text-slate-600 font-normal cursor-pointer hover:text-slate-900">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px]">{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-2.5 font-heading text-xs font-bold text-white hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Update Vectors
          </button>

          {profileSuccessMsg && (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 font-semibold p-2.5 text-center text-[10px]">
              {profileSuccessMsg}
            </p>
          )}
        </form>

        {/* Support instructions footer */}
        <div className="border-t border-slate-100 pt-4 mt-6 text-[10px] text-slate-400">
          <p className="flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-slate-300" />
            Voucher systems are processed in virtual sandbox currencies. Refund approval depends on event organizer balance limits.
          </p>
        </div>
      </div>

      {/* 2. Main content section: Tickets, Personalized lists, Accolades badges */}
      <div className="lg:col-span-3 flex flex-col">
        {/* Tab navigations */}
        <div className="flex border-b border-slate-100 mb-6 font-heading text-xs font-semibold uppercase tracking-wider text-slate-500">
          {[
            { id: 'tickets', name: 'My Tickets Confirmation', count: userRegs.length },
            { id: 'personalized', name: 'AI Recommendations', count: aiRecs.length },
            { id: 'badges', name: 'Gamified Achievements', count: userProfile.badges?.length || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-5 py-3.5 transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 font-bold' 
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                    activeTab === tab.id ? 'bg-blue-105 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* TAB A: REGISTERED CONFIRMATION TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4 animate-fadeIn flex-1">
            {userRegs.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed text-slate-400 text-xs italic">
                <Archive className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p>No active event ticket registrations found in database.</p>
                <p className="mt-1 text-[10.5px]">Select any exciting event card from landing to secure seats instantly!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRegs.map(reg => {
                  const isRefundPending = reg.refundRequested && reg.refundStatus === 'Pending';
                  const isRefundApproved = reg.refundStatus === 'Approved';
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reg.qrCode)}`;

                  return (
                    <div 
                      key={reg.id} 
                      className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-xs flex flex-col justify-between" ${
                        isRefundApproved 
                          ? 'border-slate-100 opacity-60 bg-slate-50/50' 
                          : 'border-slate-105'
                      }`}
                    >
                      <div className="flex gap-4 items-start pb-4 border-b border-dashed border-slate-150 justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-slate-400">ID: {reg.id}</span>
                          <h4 className="font-heading text-base font-bold text-slate-900 leading-snug mt-1">{reg.eventName}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {reg.eventVenue}
                          </p>
                          <p className="font-mono text-[10px] text-blue-600 font-bold mt-1 uppercase">
                            {reg.eventDate} at {reg.eventTime}
                          </p>
                        </div>
                        
                        {/* High-fidelity QR Code simulation via public API */}
                        {!isRefundApproved && (
                          <div className="shrink-0 rounded-lg border border-slate-100 p-1 bg-slate-50/50 flex flex-col items-center">
                            <img 
                              src={qrUrl} 
                              alt="Scan check-in validation QR code"
                              referrerPolicy="no-referrer"
                              className="h-16 w-16" 
                            />
                            <span className="font-mono text-[8px] text-slate-400 mt-0.5">Gate Ticket</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                        <div className="text-xs text-slate-600 font-medium">
                          <p className="font-heading font-semibold text-[10px] uppercase text-slate-400 mb-1">Purchased Tier Details:</p>
                          {reg.ticketsPurchased.map((item, idx) => (
                            <div key={idx} className="flex justify-between font-mono">
                              <span>{item.quantity}x {item.ticketTypeName}</span>
                              <span>${item.quantity * item.price}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 font-bold text-slate-900">
                            <span>Amount Paid</span>
                            <span className="font-mono text-blue-600">${reg.totalAmount}</span>
                          </div>
                        </div>

                        {/* Status Check badge / refund block */}
                        <div className="border-t border-slate-50 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div>
                            {reg.checkedIn ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                                <ClipboardCheck className="h-3 w-3" />
                                Checked In Passed
                              </span>
                            ) : isRefundPending ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 text-orange-850 text-[10px] font-bold px-2 py-0.5">
                                Refund: Pending Review
                              </span>
                            ) : isRefundApproved ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 text-slate-550 text-[10px] font-bold px-2 py-0.5">
                                Order Refunded Void
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                                Ready for Scan
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => handleDownloadTicketString(reg)}
                              className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-heading text-[11px] font-bold text-slate-700 hover:bg-slate-205 transition-colors cursor-pointer"
                              title="Download voucher ticket configuration list"
                            >
                              Download Ticket
                            </button>

                            {/* Refund Request button */}
                            {!reg.checkedIn && !reg.refundRequested && !isRefundApproved && (
                              <button
                                type="button"
                                onClick={() => handleRequestRefund(reg.id)}
                                className="rounded-lg border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 font-heading text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                Request Refund
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB B: PERSONALIZED RECOMMENDATION (AI Feature 1) */}
        {activeTab === 'personalized' && (
          <div className="space-y-4 animate-fadeIn flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Compass className="h-5 w-5 text-blue-600 animate-spin" />
                  Gemini Personalized Discovery Recommendations
                </h3>
                <p className="text-xs text-slate-600 mt-1">AI matches events from registry matching favorite categories saved under your profile.</p>
              </div>
              
              <button
                type="button"
                onClick={fetchPersonalizedRecommendations}
                disabled={isGettingAIRecommendations}
                className="rounded-lg border bg-white p-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${isGettingAIRecommendations ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isGettingAIRecommendations ? (
              <div className="text-center py-12 text-xs font-medium text-slate-500 flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Personalizing event rosters matching your profile...</span>
              </div>
            ) : aiRecs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No personalized suggestions computed. Try updating preferred categories on left profile!</p>
            ) : (
              <div className="space-y-4">
                {aiRecs.map((rec, index) => {
                  const ev = events.find(e => e.id === rec.eventId);
                  if (!ev) return null;
                  return (
                    <div key={rec.eventId || index} className="rounded-2xl border border-blue-100 bg-blue-50/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-800 uppercase">
                            {ev.category}
                          </span>
                          <span className="font-mono text-xs text-blue-600 font-bold">{rec.score}% Match Score</span>
                        </div>
                        <h4 className="font-heading text-base font-bold text-slate-900 leading-snug mt-1.5">{ev.name}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 bg-white border border-blue-50 rounded-lg p-2.5 italic">
                          <Sparkles className="h-3.5 w-3.5 inline text-blue-500 mr-1 shrink-0 mt-0.5" />
                          {rec.reason}
                        </p>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        <p className="font-mono text-[10px] text-slate-500 font-semibold mb-2 block">{ev.city} • {ev.venue}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB C: GAMIFIED ACHIEVEMENTS (Innovative Feature 6) */}
        {activeTab === 'badges' && (
          <div className="space-y-6 animate-fadeIn flex-1">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Trophy className="h-5 w-5 text-blue-600 animate-bounce" />
                Gamified Accolades Arena
              </h3>
              <p className="text-xs text-slate-500 mt-1">Earn beautiful badges for checking into live conferences, acquiring premium VIP access seats, and participating early.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Event Pioneer', description: 'Acquired during initial login setup.', icon: '🏆', criteria: 'Always Awarded' },
                { name: 'VIP Connoisseur', description: 'Awarded for acquiring premium high-value passes.', icon: '👑', criteria: 'checkout totals > $200' },
                { name: 'Showstopper', description: 'Awarded upon gates check-in approved clearance.', icon: '⚡', criteria: 'First Gate Checkin Success' }
              ].map((badge, idx) => {
                const hasBadge = userProfile.badges?.some(b => b.name === badge.name);
                return (
                  <div 
                    key={idx} 
                    className={`rounded-2xl border p-5 flex flex-col justify-between h-44 ${
                      hasBadge 
                        ? 'border-blue-200 bg-blue-50/20' 
                        : 'border-slate-100 bg-slate-50/50 opacity-40'
                    }`}
                  >
                    <div>
                      <div className="text-3xl">{badge.icon}</div>
                      <h4 className="font-heading text-base font-bold text-slate-900 leading-snug mt-2">{badge.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{badge.description}</p>
                    </div>

                    <span className={`text-[10px] font-bold font-mono tracking-wide ${
                      hasBadge ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {hasBadge ? '✓ UNLOCKED' : `🔒 Goal: ${badge.criteria}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
