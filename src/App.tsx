import React, { useState, useEffect } from "react";
import {
  Sparkles, Globe, LogIn, LogOut, LayoutDashboard, Search,
  Calendar, MapPin, Compass, ShieldAlert, Award, Star, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { User, Event } from "./types";
import AuthModal from "./components/AuthModal";
import EventCard from "./components/EventCard";
import EventDetails from "./components/EventDetails";
import OrganizerDashboard from "./components/OrganizerDashboard";
import AttendeeDashboard from "./components/AttendeeDashboard";
import ChatbotPanel from "./components/ChatbotPanel";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Visual View Routings
  const [view, setView] = useState<'discover' | 'details' | 'dashboard'>('discover');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Auth Modals
  const [authOpen, setAuthOpen] = useState(false);

  // Load events list from fullstack express API
  const fetchEvents = async () => {
    try {
      const resp = await fetch("/api/events");
      if (resp.ok) {
        const data = await resp.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to load events from server:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync user state from Local Storage
  useEffect(() => {
    const saved = localStorage.getItem("eventsphere_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    fetchEvents();
  }, []);

  // Update profile states
  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem("eventsphere_user", JSON.stringify(loggedUser));
    setAuthOpen(false);
    fetchEvents(); // force sync
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("eventsphere_user");
    setView("discover");
    setSelectedEventId(null);
  };

  // Toggle user's wishlist details
  const handleToggleWishlist = async (eventId: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    const currentWish = user.wishlist || [];
    let updatedWish: string[] = [];

    if (currentWish.includes(eventId)) {
      updatedWish = currentWish.filter(id => id !== eventId);
    } else {
      updatedWish = [...currentWish, eventId];
    }

    const updatedUser: User = { ...user, wishlist: updatedWish };
    setUser(updatedUser);
    localStorage.setItem("eventsphere_user", JSON.stringify(updatedUser));

    // Update on backend
    try {
      await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          wishlist: updatedWish
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Filter categories
  const categoriesList = ["All", "Tech & AI", "Music & Arts", "Green Tech", "Health & Wellness", "Business & Startups"];

  const filteredEvents = events.filter((evt) => {
    const matchesCategory = categoryFilter === "All" || evt.category === categoryFilter;
    const matchesSearch =
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-850 flex flex-col font-sans select-none pb-20">
      {/* Decorative Atmosphere header lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/5 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse-slow" />

      {/* Primary Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
        <div
          onClick={() => { setView("discover"); setSelectedEventId(null); }}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 duration-150"
        >
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-display shadow-md shadow-indigo-150">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-slate-900 text-base tracking-tight block">EventSphere</span>
            <span className="text-[9px] text-slate-500 font-mono block tracking-wider uppercase font-bold">Future Gateway</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView("discover"); setSelectedEventId(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer duration-150 ${
              view === "discover"
                ? "bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            Explore Pass
          </button>

          {user && (
            <button
              onClick={() => { setView("dashboard"); setSelectedEventId(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer duration-150 flex items-center gap-1.5 ${
                view === "dashboard"
                  ? "bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {user.role === "organizer" ? "Command Hub" : "My Profile Page"}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2.5 border-l border-slate-200">
              <div className="hidden md:block text-right">
                <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-205 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer hover:text-rose-600"
                title="Sign out of EventSphere"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-login"
              onClick={() => setAuthOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs tracking-wide shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Primary body frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <span className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-mono tracking-widest">Querying event matrices...</span>
            </div>
          ) : view === "discover" ? (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {activeEvent ? (
                /* Dynamic Detailed Event view overlay details */
                <EventDetails
                  event={activeEvent}
                  user={user}
                  onBack={() => { setSelectedEventId(null); }}
                  onBookingSuccess={fetchEvents}
                  isWishlisted={user?.wishlist?.includes(activeEvent.id) || false}
                  onToggleWishlist={() => handleToggleWishlist(activeEvent.id)}
                  onLoginTrigger={() => setAuthOpen(true)}
                />
              ) : (
                <>
                  {/* Hero Board Banner */}
                  <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-700 text-white p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm shadow-indigo-100">
                    <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                    <div className="space-y-4 text-center md:text-left relative z-10 max-w-xl">
                      <span className="bg-white/20 border border-white/20 px-3 py-1 text-[10px] text-white uppercase tracking-widest font-bold tracking-widest rounded-full font-mono">
                        Experience Universe
                      </span>
                      <h1 className="text-2xl md:text-4xl font-display font-extrabold text-white leading-tight tracking-tight">
                        Disburse event coordinates, secure beautiful tickets.
                      </h1>
                      <p className="text-xs md:text-sm text-indigo-100 font-normal leading-relaxed">
                        Discover outstanding local and global gatherings, verify and exchange LinkedIn contacts organically, and solve questions on the fly using Gemini AI models.
                      </p>
                    </div>
                    {/* Floating illustration card decoration */}
                    <div className="w-40 h-40 shrink-0 relative flex items-center justify-center p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl select-none rotate-3 hover:rotate-0 duration-300 shadow-xl">
                      <div className="w-full h-full bg-indigo-950/30 rounded-xl flex flex-col justify-between p-3.5 text-xs">
                        <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                        <div>
                          <div className="font-extrabold text-white leading-tight">SUMMIT PASS</div>
                          <span className="text-[9px] text-white/75 font-mono">Verified Security</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation controls, search matches and category filters */}
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
                      {/* Search Bar */}
                      <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          id="inp-search"
                          type="text"
                          placeholder="Search EventSphere tickets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Filters */}
                      <div className="flex gap-1.5 overflow-x-auto select-none no-scrollbar w-full md:w-auto">
                        {categoriesList.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                              categoryFilter === cat
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Events Grid layout */}
                    {filteredEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((evt) => (
                          <EventCard
                            key={evt.id}
                            event={evt}
                            onClick={() => { setSelectedEventId(evt.id); }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                        <Info className="w-8 h-8 text-slate-400 mx-auto" />
                        <h3 className="text-xs font-bold text-slate-700">No events matched query search.</h3>
                        <p className="text-[10px] text-slate-500">Try different filters or change keyword metrics.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ) : view === "dashboard" && user ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              {user.role === "organizer" ? (
                <OrganizerDashboard
                  user={user}
                  onEventCreated={fetchEvents}
                  eventsList={events}
                />
              ) : (
                <AttendeeDashboard
                  user={user}
                  eventsList={events}
                  onOpenEvent={(id) => { setSelectedEventId(id); setView("discover"); }}
                  onRefresh={fetchEvents}
                  onUpdateUser={(updated) => { setUser(updated); localStorage.setItem("eventsphere_user", JSON.stringify(updated)); }}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer System credits */}
      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-[10px] text-slate-400 font-mono tracking-widest uppercase">
        © 2026 EventSphere Platform Ecosystem • Dual Dashboards Unlocked
      </footer>

      {/* Floating conversational SphereBot chatbot support widget */}
      <ChatbotPanel />

      {/* Registration and Login modal support */}
      <AnimatePresence>
        {authOpen && (
          <AuthModal
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
