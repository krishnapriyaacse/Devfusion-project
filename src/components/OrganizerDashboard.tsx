import React, { useState, useEffect } from "react";
import {
  Sparkles, Plus, Calendar, MapPin, Tag, List, Users,
  BarChart, DollarSign, Award, Send, Sliders, Trash2, CheckCircle, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Event } from "../types";

interface OrganizerDashboardProps {
  user: User;
  onEventCreated: () => void;
  eventsList: Event[];
}

export default function OrganizerDashboard({ user, onEventCreated, eventsList }: OrganizerDashboardProps) {
  // Stats
  const [stats, setStats] = useState({
    revenue: 0,
    registrations: 0,
    checkins: 0,
    eventsCount: 0,
    payoutSimulate: 0
  });

  // Create form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("2026-06-30");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("Tech & AI");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState(100);
  const [bannerUrl, setBannerUrl] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  // AI helper states
  const [aiBulletPoints, setAiBulletPoints] = useState("");
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [schedulePrompt, setSchedulePrompt] = useState("");
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  // Check-In scanner simulation
  const [scannerInput, setScannerInput] = useState("");
  const [scannerMsg, setScannerMsg] = useState("");
  const [scannerError, setScannerError] = useState("");

  const orgEvents = eventsList.filter(e => e.organizerId === user.id);

  const fetchStats = async () => {
    try {
      const resp = await fetch(`/api/organizer/stats?organizerId=${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [eventsList]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !venue || !description) return;

    try {
      // Setup simple tickets
      const ticketTypes = [
        { id: `t_${Date.now()}_1`, name: "General Admission", price: 0, type: "free", description: "Standard free access pass." },
        { id: `t_${Date.now()}_2`, name: "VIP Backstage", price: 150, type: "vip", description: "VIP access, drinks, front row seats and speakers dinner." }
      ];

      const discountCodesValue = [
        { code: "SPHEREOFF", discountPercent: 15 }
      ];

      const resp = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
          venue,
          category,
          description,
          bannerImage: bannerUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
          capacity: Number(capacity),
          ticketTypes,
          discountCodesValue,
          organizerId: user.id
        })
      });

      if (resp.ok) {
        setCreateMsg("Event created successfully! Dual general and VIP ticket formats locked in.");
        setName("");
        setVenue("");
        setDescription("");
        setBannerUrl("");
        onEventCreated();
        setTimeout(() => setCreateMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate engaging description with Gemini AI
  const handleGenerateAiDesc = async () => {
    if (!aiBulletPoints.trim()) return;
    setGeneratingDesc(true);
    try {
      const resp = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullets: aiBulletPoints,
          title: name || "EventSphere special summit"
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setDescription(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDesc(false);
    }
  };

  // Generate smart personalized schedule suggestions
  const handleSuggestAiSchedule = async () => {
    if (!name || !description) {
      alert("Please provide the Event Title and description first.");
      return;
    }
    setGeneratingSchedule(true);
    try {
      const resp = await fetch("/api/ai/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          category,
          description
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setDescription(prev => `${prev}\n\n[SMART PROPOSED EVENT SCHEDULE]\n${data.schedule}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  // Manual code entry QR simulation scan
  const handleScannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;

    setScannerMsg("");
    setScannerError("");

    // Look for identifier evt_id:...|booking_id:... or just booking id code (e.g., b_101)
    let bookingId = scannerInput.trim();
    if (scannerInput.includes("booking_id:")) {
      const match = scannerInput.match(/booking_id:([a-zA-Z0-9_-]+)/);
      if (match) {
        bookingId = match[1];
      }
    }

    try {
      const resp = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: "POST"
      });
      const data = await resp.json();

      if (resp.ok) {
        setScannerMsg(`Verified and checked-in Emma! 200 gamified points added.`);
        setScannerInput("");
        onEventCreated(); // refresh live list
      } else {
        setScannerError(data.error || "Check-in identifier not recognized.");
      }
    } catch (err) {
      setScannerError("relay error, check server.");
    }
  };

  // Request payouts simulation
  const handleRequestPayout = () => {
    alert(`Payout sequence triggered! $${stats.payoutSimulate.toFixed(2)} has been securely queued to bank. (Fees: 5% EventSphere commission)`);
  };

  // Remove event handler
  const handleDeleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to remove this event? All active seats will be released.")) {
      try {
        const resp = await fetch(`/api/events/${id}`, {
          method: "DELETE"
        });
        if (resp.ok) {
          onEventCreated();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-lg font-display font-black text-slate-900 flex items-center gap-2 justify-center md:justify-start">
            Organizer Command Hub <Award className="w-5 h-5 text-indigo-600" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Welcome back, {user.name}. Track statistics, scan gate tickets, and orchestrate with Gemini AI description tools.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={fetchStats}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-205 border-l-4 border-l-emerald-500 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Total Revenue</span>
            <div className="text-lg font-black text-slate-900 leading-snug">${stats.revenue}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-205 border-l-4 border-l-indigo-500 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Registrations</span>
            <div className="text-lg font-black text-slate-900 leading-snug">{stats.registrations}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-205 border-l-4 border-l-blue-500 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Checked In</span>
            <div className="text-lg font-black text-slate-900 leading-snug">{stats.checkins}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-205 border-l-4 border-l-purple-500 p-4 rounded-xl flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Simulated Payout</span>
            <div className="text-base font-black text-emerald-600 leading-snug">${stats.payoutSimulate.toFixed(1)}</div>
          </div>
          <button
            id="btn-org-payout"
            onClick={handleRequestPayout}
            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase transition-all cursor-pointer shrink-0 shadow-xs"
          >
            Disburse
          </button>
        </div>
      </div>

      {/* Double Column logic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Manage & create event */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Event Form */}
          <div className="bg-white border border-slate-205 p-6 rounded-2xl space-y-5 shadow-xs">
            <h3 className="text-sm font-extrabold font-display text-slate-900 flex items-center gap-2">
              Launch New Event Pass <Plus className="w-4 h-4 text-indigo-600" />
            </h3>

            {createMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                {createMsg}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Title name</label>
                  <input
                    id="inp-evt-title"
                    type="text"
                    required
                    placeholder="E.g. Web3 Hackfest Chennai"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Date</label>
                  <input
                    id="inp-evt-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Venue details</label>
                  <input
                    id="inp-evt-venue"
                    type="text"
                    required
                    placeholder="Physical hotel venue or Online URL link"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Category</label>
                  <select
                    id="sel-evt-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                  >
                    <option>Tech & AI</option>
                    <option>Music & Arts</option>
                    <option>Green Tech</option>
                    <option>Health & Wellness</option>
                    <option>Business & Startups</option>
                  </select>
                </div>
              </div>

              {/* AI generator integrations inside creator panel */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span className="text-[9px] font-bold text-slate-705 uppercase tracking-wider font-mono">
                    Gemini Description Helper
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                  Input rough bullet points. Gemini AI reads these, polishes the wording, compiles session lists, and outputs invitation cards immediately.
                </p>

                <div className="flex gap-2">
                  <input
                    id="inp-ai-bullets"
                    type="text"
                    placeholder="Chennai summit, AI modules, experts, snacks, grants..."
                    value={aiBulletPoints}
                    onChange={(e) => setAiBulletPoints(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <button
                    id="btn-ai-generate-desc"
                    type="button"
                    onClick={handleGenerateAiDesc}
                    disabled={generatingDesc}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg tracking-wider transition-all uppercase cursor-pointer shrink-0"
                  >
                    {generatingDesc ? "Converting..." : "Write AI Copy"}
                  </button>
                </div>

                {name && description && (
                  <button
                    id="btn-ai-schedule"
                    type="button"
                    onClick={handleSuggestAiSchedule}
                    disabled={generatingSchedule}
                    className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-indigo-105 text-[10px] text-indigo-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    {generatingSchedule ? "Scheduling..." : "Inject Suggestive Agenda Timeline"}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Detailed Information (Description & Agenda)</label>
                <textarea
                  id="inp-evt-desc"
                  required
                  rows={4}
                  placeholder="Provide precise speakers details, rules, and expectations. (Use AI Helper prompts to write instantly)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Hall Seats Capacity</label>
                  <input
                    id="inp-evt-capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Banner Image URL (Unsplash / Picsum)</label>
                  <input
                    id="inp-evt-banner"
                    type="url"
                    placeholder="https://picsum.photos/seed/..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <button
                id="btn-evt-publish"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-650 text-white font-black rounded-xl text-xs tracking-wider uppercase shadow-sm shadow-indigo-150 hover:from-indigo-550 hover:to-purple-600 transition-all cursor-pointer"
              >
                Publish Event & Open Ticket Registrations
              </button>
            </form>
          </div>
        </div>

        {/* Right column: check-ins & existing listings */}
        <div className="space-y-6">
          {/* Simulated scanning module */}
          <div className="bg-white border border-slate-205 p-6 rounded-2xl space-y-4 shadow-xs">
            <h3 className="text-sm font-extrabold font-display text-slate-900 flex items-center gap-1.5">
              Live Gateway Check-in simulation
            </h3>

            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Enter the unique Booking Code identifier (e.g. <span className="font-mono text-indigo-750 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">b_101</span>) as of their QR ticket. This simulates immediate scanner verification and updates attendee counts dynamically.
            </p>

            {scannerMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] rounded-lg font-medium">
                ✓ {scannerMsg}
              </div>
            )}
            {scannerError && (
              <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-800 text-[11px] rounded-lg font-medium">
                ⚠️ {scannerError}
              </div>
            )}

            <form onSubmit={handleScannerSubmit} className="space-y-2">
              <input
                id="inp-gate-scanner"
                type="text"
                required
                placeholder="Paste code or booking_id:b_101"
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
              />
              <button
                id="btn-gate-scan-submit"
                type="submit"
                className="w-full py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-205 text-[11px] font-bold rounded-xl cursor-pointer transition-colors"
              >
                Scan Ticket Code
              </button>
            </form>
          </div>

          {/* Active events lists */}
          <div className="bg-white border border-slate-205 p-6 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-sm font-extrabold font-display text-slate-900 flex items-center gap-1.5">
              Your Hosted Events ({orgEvents.length})
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
              {orgEvents.map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-50 border border-slate-201 border-slate-100 rounded-xl flex items-center justify-between gap-2">
                  <div className="space-y-0.5 flex-1 pr-2">
                    <span className="text-xs font-bold text-slate-850 block truncate">{evt.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono block uppercase tracking-wider">{evt.date} • {evt.registeredCount} sold</span>
                  </div>
                  <button
                    id={`btn-org-evt-del-${evt.id}`}
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {orgEvents.length === 0 && (
                <p className="text-xs text-slate-450 italic font-medium">No events generated by you yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
