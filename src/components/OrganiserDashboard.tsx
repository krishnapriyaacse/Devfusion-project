/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, MapPin, Users, DollarSign, UserCheck, 
  Sparkles, Download, Check, X, ShieldAlert, ArrowRightLeft, 
  HelpCircle, QrCode, ClipboardList, Wallet, Sparkle 
} from 'lucide-react';
import { Event, Registration, PayoutStats } from '../types';

interface OrganiserDashboardProps {
  events: Event[];
  registrations: Registration[];
  payouts: PayoutStats;
  onEventCreated: () => void;
  onRefreshRegistrations: () => void;
}

export default function OrganiserDashboard({ 
  events, registrations, payouts, onEventCreated, onRefreshRegistrations 
}: OrganiserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'checkin' | 'refunds' | 'payouts'>('overview');
  
  // Create Event state parameters
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('2026-06-25');
  const [eventTime, setEventTime] = useState('10:00');
  const [eventVenue, setEventVenue] = useState('');
  const [eventCity, setEventCity] = useState('');
  const [eventCategory, setEventCategory] = useState('Tech');
  const [eventDescription, setEventDescription] = useState('');
  const [eventBanner, setEventBanner] = useState('linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)');
  
  // Custom Bullet lines for AI description (AI Feature)
  const [bulletInputs, setBulletInputs] = useState('');
  const [isDraftingDescription, setIsDraftingDescription] = useState(false);

  // Tickets schema builder
  const [ticketName, setTicketName] = useState('General Admission');
  const [ticketPrice, setTicketPrice] = useState(0);
  const [ticketCapacity, setTicketCapacity] = useState(100);
  const [addedTickets, setAddedTickets] = useState<{ name: string; price: number; capacity: number }[]>([
    { name: 'General Admission', price: 0, capacity: 100 }
  ]);

  // Discount code setter
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(20);
  const [promoExpiry, setPromoExpiry] = useState('2026-06-24');
  const [addedPromos, setAddedPromos] = useState<{ code: string; discountPercent: number; expiryDate: string }[]>([
    { code: 'AIFUTURE', discountPercent: 20, expiryDate: '2026-06-24' }
  ]);

  // Gate Checkin Simulator values
  const [checkinManualCode, setCheckinManualCode] = useState('');
  const [gateMessage, setGateMessage] = useState('');
  const [gateStatus, setGateStatus] = useState<'success' | 'error' | ''>('');

  // Payout Simulation values
  const [payoutAmount, setPayoutAmount] = useState(100);
  const [bankRouting, setBankRouting] = useState('Chase Bank-XXXX9920');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Stats computation
  const totalRegistrations = registrations.length;
  const totalRevenue = payouts.totalRevenue;
  const currentBalance = payouts.currentBalance;
  
  const checkedInCount = registrations.filter(r => r.checkedIn).length;
  const attendanceRate = totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0;

  // AI Event Copywriter Description builder (AI Feature)
  const handleAIDraftDescription = async () => {
    if (!bulletInputs.trim()) return;
    setIsDraftingDescription(true);
    try {
      const bulletArr = bulletInputs.split('\n').filter(line => !!line.trim());
      const response = await fetch('/api/ai/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletPoints: bulletArr, category: eventCategory, eventName })
      });
      const data = await response.json();
      if (response.ok) {
        setEventDescription(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDraftingDescription(false);
    }
  };

  const handleAddTicket = () => {
    if (!ticketName.trim()) return;
    setAddedTickets(prev => [...prev, { name: ticketName, price: ticketPrice, capacity: ticketCapacity }]);
    setTicketName('');
    setTicketPrice(0);
    setTicketCapacity(100);
  };

  const handleAddPromo = () => {
    if (!promoCode.trim()) return;
    setAddedPromos(prev => [...prev, { code: promoCode.trim().toUpperCase(), discountPercent: promoDiscount, expiryDate: promoExpiry }]);
    setPromoCode('');
  };

  // Submit Event Form
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventVenue || !eventDescription) return;

    const finalTickets = addedTickets.map((t, idx) => ({
      id: `tkt-${Date.now()}-${idx}`,
      name: t.name,
      price: t.price,
      capacity: t.capacity,
      remainingCapacity: t.capacity
    }));

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          time: eventTime,
          venue: eventVenue,
          city: eventCity || 'Online',
          category: eventCategory,
          description: eventDescription,
          bannerImage: eventBanner,
          tickets: finalTickets,
          discounts: addedPromos,
          faq: [
            { q: 'Where can I access my QR code?', a: 'Your check-in QR code is accessible instantly from your user dashboard after sandbox verification.' }
          ]
        })
      });

      if (response.ok) {
        // Clear all
        setEventName('');
        setEventVenue('');
        setEventCity('');
        setEventDescription('');
        setBulletInputs('');
        setAddedTickets([{ name: 'General Admission', price: 0, capacity: 100 }]);
        setAddedPromos([]);
        onEventCreated();
        setActiveTab('overview');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Turnout scan simulate ticket codes checkin
  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateStatus('');
    setGateMessage('');

    if (!checkinManualCode.trim()) return;

    try {
      const response = await fetch(`/api/registrations/${checkinManualCode.trim()}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        setGateStatus('success');
        setGateMessage(`Checked In Approved! Welcome ${data.registration.attendeeName} to ${data.registration.eventName}.`);
        setCheckinManualCode('');
        onRefreshRegistrations();
      } else {
        setGateStatus('error');
        setGateMessage(data.error || 'Check-in failed. Invalid QR confirmation ticket identifier.');
      }
    } catch (err) {
      setGateStatus('error');
      setGateMessage('Server gate check-in issues. Retry.');
    }
  };

  // Instant checkout checkin hook (by clicking checkin in table)
  const handleInstantCheckin = async (regId: string) => {
    setGateStatus('');
    setGateMessage('');
    try {
      const response = await fetch(`/api/registrations/${regId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        onRefreshRegistrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Exporter (Organiser side downloadable logs)
  const handleExportCSV = () => {
    if (registrations.length === 0) return;
    const headers = "Confirmation ID,Event Name,Attendee Name,Email,Total Paid,Checkout Date,Checked In\n";
    const rows = registrations.map(r => {
      const purchases = r.ticketsPurchased.map(item => `${item.quantity}x ${item.ticketTypeName}`).join('; ');
      return `"${r.id}","${r.eventName}","${r.attendeeName}","${r.attendeeEmail}",$${r.totalAmount},"${r.createdAt.split('T')[0]}","${r.checkedIn ? 'Yes' : 'No'}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'EventSphere-Attendee-AuditList.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Sandbox Payout Trigger
  const handleAddPayoutSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSuccessMsg('');

    if (payoutAmount <= 0 || payoutAmount > currentBalance) return;

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payoutAmount, bankAccount: bankRouting })
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutSuccessMsg(`Successfully cleared $${payoutAmount} payout. Funds dispatched to ${bankRouting}.`);
        onRefreshRegistrations(); // refresh balance
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Refund approval queue actions
  const handleRefundAction = async (regId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/registrations/${regId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        onRefreshRegistrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs max-w-7xl mx-auto" id="organiser-console-view">
      
      {/* Header Profile Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">EventSphere Organiser Suite</h2>
          <p className="text-xs text-slate-500">Track registrations, process sandbox revenue payouts, approve refund requests, and scan entry-gates.</p>
        </div>
        
        {/* CSV Exporter trigger */}
        <button
          onClick={handleExportCSV}
          disabled={totalRegistrations === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/95 px-4 py-2.5 font-heading text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export Attendees CSV</span>
        </button>
      </div>

      {/* Internal Tab selectors */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs font-medium">
        {[
          { id: 'overview', name: 'Dashboard Overview', badge: null },
          { id: 'create', name: 'Create Event with AI', badge: 'AI Core' },
          { id: 'checkin', name: 'Check-in Gate Entry', badge: `${checkedInCount}/${totalRegistrations} In` },
          { id: 'refunds', name: 'Refund Tickets Queue', badge: registrations.filter(r => r.refundRequested && r.refundStatus === 'Pending').length },
          { id: 'payouts', name: 'Payout simulation', badge: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold font-heading transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{tab.name}</span>
              {tab.badge !== null && (
                (typeof tab.badge === 'number' && tab.badge > 0) ||
                (typeof tab.badge === 'string' && tab.badge !== '')
              ) && (
                <span className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                  activeTab === tab.id ? 'bg-white text-blue-700' : 'bg-rose-100 text-rose-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW STATISTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Bento boxes analytics grids */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Ticket Revenue</span>
              <p className="font-heading text-3xl font-extrabold text-slate-900 mt-1 font-mono">${totalRevenue}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-500" />
                Gross Sales Transactions
              </span>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Pending Sandbox Balance</span>
              <p className="font-heading text-3xl font-extrabold text-blue-600 mt-1 font-mono">${currentBalance}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Eligible for payouts release</span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Registrations</span>
              <p className="font-heading text-3xl font-extrabold text-slate-900 mt-1 font-mono">{totalRegistrations}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique seats booked</span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase">checked-in Turnout</span>
              <p className="font-heading text-3xl font-extrabold text-slate-900 mt-1 font-mono">{gateStatus === 'success' ? checkedInCount + 1 : checkedInCount}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-600 font-bold">
                <span>Rate: {attendanceRate}%</span>
                <span className="font-mono">{checkedInCount} / {totalRegistrations}</span>
              </div>
            </div>
          </div>

          {/* Registrations list table */}
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-blue-500" />
              Attendee Logs & Sales Records
            </h3>

            {registrations.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-205 text-slate-400">
                <p className="text-sm italic">No attendee checkouts recorded in database yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-heading uppercase tracking-wider text-[10px]">
                      <th className="p-4">Attendee info</th>
                      <th className="p-4">Event title</th>
                      <th className="p-4">Paid (Gross)</th>
                      <th className="p-4">Checked in</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {registrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/40">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{reg.attendeeName}</p>
                          <p className="text-[11px] text-slate-400">{reg.attendeeEmail}</p>
                          {reg.linkedinUrl && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-sky-50 text-sky-700 text-[9px] font-semibold px-1 py-0.2 mt-1">
                              Networking Opt-in
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          {reg.eventName}
                          <p className="text-[10px] text-slate-400">{reg.ticketsPurchased.map(i=>`${i.quantity}x ${i.ticketTypeName}`).join(', ')}</p>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">${reg.totalAmount}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            reg.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {reg.checkedIn ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-4">
                          {!reg.checkedIn && (
                            <button
                              onClick={() => handleInstantCheckin(reg.id)}
                              className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: CREATE EVENT WITH AI DESCRIPTION (Core Features check) */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitEvent} className="space-y-6 animate-fadeIn max-w-2xl">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900">Configure Event Profile</h3>
              <p className="text-xs text-slate-550">List capacities, set discount parameters, and build copies.</p>
            </div>
            <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkle className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
              Turnkey AI Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-600 font-heading">Event Title</label>
              <input 
                type="text" 
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Distributed Consensus Workshop"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden text-xs"
              />
            </div>
             <div>
              <label className="block text-xs font-semibold text-slate-600">Category Track</label>
              <select 
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:border-blue-500 text-xs"
              >
                <option value="Tech">Tech Summit / Code Lab</option>
                <option value="Music">Music Live Event / Synthesizer</option>
                <option value="Arts">Arts / Gallery</option>
                <option value="Food">Food / Gastronomy Expo</option>
                <option value="Sports">Sports / Wellness Activities</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Event Date</label>
              <input 
                type="date" 
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Start Time</label>
              <input 
                type="time" 
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Venue City</label>
              <input 
                type="text" 
                required
                value={eventCity}
                onChange={(e) => setEventCity(e.target.value)}
                placeholder="e.g. Chicago, IL"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-blue-500"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-xs font-semibold text-slate-600">Specific Location / Venue Address</label>
            <input 
              type="text" 
              required
              value={eventVenue}
              onChange={(e) => setEventVenue(e.target.value)}
              placeholder="e.g. Skyline Event Center, Platform 3A"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-blue-500"
            />
          </div>

          {/* AI Description Builder box */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-xs font-bold text-blue-700 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                AI Content Copywriter Draft
              </span>
              <span className="text-[10px] text-blue-500">Enter bullets below</span>
            </div>

            <textarea 
              rows={3}
              value={bulletInputs}
              onChange={(e) => setBulletInputs(e.target.value)}
              placeholder="Enter bullet details per line, e.g.:&#10;- deep scalability concepts&#10;- interactive terminal workouts&#10;- catering coupon prizes"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
            
            <button
              type="button"
              onClick={handleAIDraftDescription}
              disabled={isDraftingDescription || !bulletInputs.trim()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 font-heading text-xs font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-40"
              id="draft-event-desc-ai"
            >
              {isDraftingDescription ? 'Polishing description copy...' : 'Draft Polished Description'}
            </button>
          </div>

          <div className="text-xs">
            <label className="block text-xs font-semibold text-slate-500">Event Public Description</label>
            <textarea 
              required
              rows={4}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Detailed schedule notes, criteria, guidelines..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Ticket Schema Builder */}
          <div className="rounded-2xl border border-slate-100 p-4 text-xs">
            <span className="block font-heading text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Ticket Types & Limit Capacities</span>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100 mb-3">
              <div>
                <label className="text-[10px] text-slate-500">Tier Name</label>
                <input 
                  type="text" 
                  value={ticketName} 
                  onChange={(e) => setTicketName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Price ($)</label>
                <input 
                  type="number" 
                  value={ticketPrice} 
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono" 
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500">Max Capacity</label>
                  <input 
                    type="number" 
                    value={ticketCapacity} 
                    onChange={(e) => setTicketCapacity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono" 
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTicket}
                  className="rounded bg-blue-600 h-7 px-3 text-xs font-bold text-white cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Generated ticket lists */}
            <div className="space-y-2">
              {addedTickets.map((tc, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1 text-xs text-slate-600 font-medium">
                  <span>{tc.name}</span>
                  <span className="font-mono">${tc.price} (Limit {tc.capacity} standard capacity)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discount code setters */}
          <div className="rounded-2xl border border-slate-100 p-4 text-xs">
            <span className="block font-heading text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Set Event Coupons</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100 mb-3">
              <div>
                <label className="text-[10px] text-slate-500">Coupon Code</label>
                <input 
                  type="text" 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. TECHSUMMIT"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Discount Percentage (%)</label>
                <input 
                  type="number" 
                  value={promoDiscount} 
                  onChange={(e) => setPromoDiscount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono" 
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500">Expiry Date</label>
                  <input 
                    type="date" 
                    value={promoExpiry} 
                    onChange={(e) => setPromoExpiry(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono" 
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPromo}
                  className="rounded bg-blue-600 h-7 px-3 text-xs font-bold text-white cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {addedPromos.map((pm, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1 text-xs text-slate-600 font-medium">
                  <span className="font-bold text-blue-600">{pm.code}</span>
                  <span className="font-mono">{pm.discountPercent}% off (Expires {pm.expiryDate})</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 font-heading text-sm font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer shadow-lg shadow-blue-500/10"
            id="publish-event-btn"
          >
            Deploy & Publish Event
          </button>
        </form>
      )}

      {/* TAB 3: GATE MANUAL ENTRY CHECKIN SYSTEM */}
      {activeTab === 'checkin' && (
        <form onSubmit={handleManualCheckin} className="space-y-6 animate-fadeIn max-w-xl">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <QrCode className="h-5 w-5 text-blue-600" />
              Event Gates Entry checkin System
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify attendee tickets and mark credentials. Enter the registration ID or unique ticket confirmation voucher identifier (shown on ticket coupon dashboard) below:
            </p>
          </div>

          <div className="rounded-2xl border border-slate-105 p-6 bg-slate-50/40">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Voucher ID or QR String</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                required
                value={checkinManualCode}
                onChange={(e) => setCheckinManualCode(e.target.value)}
                placeholder="e.g. reg-1716712345-4820"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Scan Ticket Entry
              </button>
            </div>

            {gateMessage && (
              <div className={`mt-4 rounded-xl border p-4 text-xs font-semibold flex items-start gap-2 ${
                gateStatus === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {gateStatus === 'success' ? (
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{gateMessage}</span>
              </div>
            )}
          </div>

          <div className="border border-slate-100 rounded-xl p-4 text-xs bg-blue-50/20 text-blue-900 leading-relaxed">
            <span className="font-bold flex items-center gap-1 mb-1 text-xs">
              <HelpCircle className="h-4 w-4 text-blue-600 animate-bounce" />
              Simulating Scanner gate
            </span>
            To run a gate scan walkthrough, go to checkout, register a VIP pass ticket, select your own attendee credentials, and then copy the resulting Voucher Registration ID from your user ticket dashboard panel!
          </div>
        </form>
      )}

      {/* TAB 4: REFUND TICKETS REQUEST HANDLING QUEUE (Core Flow check) */}
      {activeTab === 'refunds' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">Attendee Refund Petitions</h3>
            <p className="text-xs text-slate-500 mt-1">Review pending refund applications. Approving immediately restocks tickets and balances.</p>
          </div>

          {registrations.filter(r => r.refundRequested && r.refundStatus === 'Pending').length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed text-slate-400 text-xs italic">
              No refund requests pending review in current transaction segments.
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.filter(r => r.refundRequested && r.refundStatus === 'Pending').map(reg => (
                <div key={reg.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">ID: {reg.id}</span>
                      <span className="rounded bg-rose-100 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-800 uppercase">
                        PENDING APPROVAL
                      </span>
                    </div>
                    <p className="mt-1 font-heading font-bold text-slate-800">{reg.attendeeName}</p>
                    <p className="text-[11px] text-slate-400">Voucher Value: ${reg.totalAmount} for {reg.eventName}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRefundAction(reg.id, 'approve')}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 font-heading text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve Refund
                    </button>
                    <button
                      onClick={() => handleRefundAction(reg.id, 'reject')}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-heading text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ORGANISER PAYOUT SIMULATOR */}
      {activeTab === 'payouts' && (
        <form onSubmit={handleAddPayoutSimulation} className="space-y-6 animate-fadeIn max-w-xl">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <Wallet className="h-5 w-5 text-blue-600 animate-pulse" />
              Organiser Payout Sim Corridor
            </h3>
            <p className="text-xs text-slate-500 mt-1">Disburse sales revenue balance safely to registered bank accounts.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100/50 bg-blue-50/10 p-4">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Eligible Ledger Balance</span>
              <p className="font-heading text-2xl font-bold mt-1 font-mono">${currentBalance}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Settled payouts Completed</span>
              <p className="font-heading text-2xl font-bold mt-1 font-mono">${payouts.payoutsCompleted}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-105 p-6 bg-slate-50/40 space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Withdrawal Amount ($)</label>
              <input 
                type="number" 
                required
                min={1}
                max={currentBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 font-mono focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600">Destination Routing Routing Acc</label>
              <input 
                type="text" 
                required
                value={bankRouting}
                onChange={(e) => setBankRouting(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={payoutAmount <= 0 || payoutAmount > currentBalance}
              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-3 font-heading text-xs font-bold text-white hover:bg-slate-900 transition-colors disabled:opacity-40 shadow-md cursor-pointer"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Simulate Balance Transfer Dispatch
            </button>

            {payoutSuccessMsg && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 mt-3">
                {payoutSuccessMsg}
              </div>
            )}
          </div>

          {/* Completed transfer track */}
          {payouts.payoutsList && payouts.payoutsList.length > 0 && (
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Transfers Track</span>
              <div className="space-y-2">
                {payouts.payoutsList.map((po, index) => (
                  <div key={po.id || index} className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <div>
                      <p className="font-bold text-slate-850">Disbursed to: {po.bankAccount}</p>
                      <span className="font-mono text-[10px] text-slate-400">{po.date}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 text-sm">${po.amount} Ledger</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </form>
      )}

    </div>
  );
}
