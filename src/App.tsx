/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, ClipboardList, Shield, Search, Mic, MapPin, 
  Sparkle, Calendar, Users, Briefcase, Award, ShieldCheck, Heart
} from 'lucide-react';
import { Event, Registration, UserProfile, PayoutStats } from './types';
import EventCard from './components/EventCard';
import EventDetailModal from './components/EventDetailModal';
import CheckoutModal from './components/CheckoutModal';
import AttendeeDashboard from './components/AttendeeDashboard';
import OrganiserDashboard from './components/OrganiserDashboard';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'browse' | 'attendee' | 'organiser'>('browse');
  
  // Core Sync States
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [payouts, setPayouts] = useState<PayoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ongoingCheckoutEvent, setOngoingCheckoutEvent] = useState<Event | null>(null);
  
  // Authentication states
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('eventsphere_token'));
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    linkedinUrl: '',
    savedCategories: ['Tech'] as string[]
  });

  // Browsing Query filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterPrice, setFilterPrice] = useState<'All' | 'Free' | 'Paid'>('All');

  // Trigger loading state synchronization
  useEffect(() => {
    syncServerState(authToken);
  }, []);

  const syncServerState = async (token: string | null = authToken) => {
    try {
      const headersOptions = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [eventsRes, regsRes, profileRes, payoutsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/registrations'),
        fetch('/api/profiles', { headers: headersOptions }),
        fetch('/api/payouts')
      ]);

      const [eventsData, regsData, profileData, payoutsData] = await Promise.all([
        eventsRes.json(),
        regsRes.json(),
        profileRes.ok ? profileRes.json() : null,
        payoutsRes.json()
      ]);

      setEvents(eventsData);
      setRegistrations(regsData);
      setUserProfile(profileRes.ok ? profileData : null);
      setPayouts(payoutsData);
    } catch (err) {
      console.error('Error synchronizing EventSphere server state', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eventsphere_token');
    setAuthToken(null);
    setUserProfile(null);
    setAuthForm({
      name: '',
      email: '',
      password: '',
      linkedinUrl: '',
      savedCategories: ['Tech']
    });
    syncServerState(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthenticating(true);

    try {
      const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const bodyPayload = authMode === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : { 
            email: authForm.email, 
            name: authForm.name, 
            password: authForm.password, 
            linkedinUrl: authForm.linkedinUrl,
            savedCategories: authForm.savedCategories 
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Identity verification gateway error');
      }

      localStorage.setItem('eventsphere_token', data.token);
      setAuthToken(data.token);
      setAuthSuccess(authMode === 'login' ? 'Successfully authenticated!' : 'Account registered successfully!');
      
      setTimeout(() => {
        setUserProfile(data.user);
        syncServerState(data.token);
        setIsAuthenticating(false);
      }, 505);

    } catch (err: any) {
      setAuthError(err.message || 'Verification gateway unreachable. Please retry.');
      setIsAuthenticating(false);
    }
  };

  // Turnout voice search activation (Web Speech API)
  const handleActivateVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice web search speech recognitions not supported in this browser environment. Try Chrome.');
      return;
    }

    setIsVoiceSearching(true);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const voiceResultText = event.results[0][0].transcript;
      setSearchQuery(voiceResultText);
      setIsVoiceSearching(false);
    };

    recognition.onerror = () => {
      setIsVoiceSearching(false);
    };

    recognition.onend = () => {
      setIsVoiceSearching(false);
    };

    recognition.start();
  };

  // Toggle wishlist state (in browser and user profiles)
  const handleToggleWishlist = async (eventId: string) => {
    if (!userProfile) return;
    const isWishlisted = userProfile.wishlistedEvents.includes(eventId);
    const updatedWishlist = isWishlisted 
      ? userProfile.wishlistedEvents.filter(id => id !== eventId)
      : [...userProfile.wishlistedEvents, eventId];

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistedEvents: updatedWishlist })
      });
      const data = await response.json();
      if (response.ok) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering Logic
  const filteredEvents = events.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        e.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;

    // Cities extraction filtering
    const matchCity = filterCity === 'All' || e.city.toLowerCase() === filterCity.toLowerCase();

    // Free vs Paid filtering
    const isFreeEvent = e.tickets.some(t => t.price === 0);
    const matchPrice = filterPrice === 'All' 
      ? true 
      : filterPrice === 'Free' 
        ? isFreeEvent 
        : !isFreeEvent;

    return matchSearch && matchCategory && matchCity && matchPrice;
  });

  // Extract all distinct cities list
  const distinctCities = ['All', ...new Set(events.map(e => e.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white" id="eventsphere-root">
      
      {/* 1. Header Toolbar Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md" id="main-navigation-header">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
          
          {/* Logo Name */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('browse')}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-heading font-extrabold text-xl shadow-lg shadow-blue-600/20">
              E
            </span>
            <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
              Event<span className="text-blue-600">Sphere</span>
            </span>
            <span className="hidden sm:inline-flex rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-700 uppercase tracking-widest">
              Full-Stack AI
            </span>
          </div>

          {/* Nav Tab Swappers */}
          <nav className="flex items-center gap-1">
            {[
              { id: 'browse', name: 'Discover Events', icon: Compass },
              { id: 'attendee', name: 'Attendee Portal', icon: ClipboardList },
              { id: 'organiser', name: 'Organiser Desk', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id as any);
                    setSelectedEvent(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold font-heading transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                      : 'text-slate-650 hover:bg-slate-50'
                  }`}
                  id={`nav-tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User badge identifier card */}
          {userProfile ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border p-1 rounded-full text-xs font-semibold text-slate-800">
                <span className="h-6 w-6 rounded-full bg-blue-105 text-blue-700 flex items-center justify-center font-bold">
                  {userProfile.name?.charAt(0) || 'U'}
                </span>
                <span className="hidden sm:inline-block pr-2 truncate max-w-[100px]">{userProfile.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-205 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('attendee');
                setAuthMode('login');
              }}
              className="rounded-xl bg-slate-900 hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Body dynamic layout */}
      <main className="flex-1 px-4 sm:px-6 py-8" id="eventsphere-main-container">
        
        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center flex-col gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <span className="text-xs font-semibold text-slate-500 font-heading">Synchronizing database vectors...</span>
          </div>
        ) : (
          <>
            {/* VIEW A: SEARCH & BROWSE DISCOVERY EVENTS */}
            {currentTab === 'browse' && (
              <div className="space-y-8 animate-fadeIn" id="browse-events-pane">
                
                {/* Hero Search Section heading */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                    <Sparkle className="h-3.5 w-3.5 fill-blue-500 text-blue-500 animate-pulse" />
                    AI-Powered Discovery Engine
                  </span>
                  <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl leading-tight">
                    Premium Curation & Seamless Sandbox Ticketing
                  </h1>
                  <p className="text-sm text-slate-550 leading-relaxed">
                    EventSphere simplifies how modern technical communities schedule conferences, purchase multi-ticket bookings, audit secure access entries, and network live.
                  </p>
                </div>

                {/* Filter and Search Bar Row */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-w-4xl mx-auto flex flex-col md:flex-row gap-3">
                  {/* Search query field */}
                  <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search summit names, agendas, speakers details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                    />
                    
                    {/* Voice activated speech recognition */}
                    <button
                      type="button"
                      onClick={handleActivateVoiceSearch}
                      className={`absolute right-3 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-blue-700 transition-colors ${
                        isVoiceSearching ? 'text-blue-600 animate-ping' : ''
                      }`}
                      title="Voice Speech activated lookup search"
                      aria-label="Voice Activation Search"
                      id="voice-search-trigger"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>

                  {/* City dropdown */}
                  <div className="w-full md:w-36">
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer h-[38px]"
                    >
                      {distinctCities.map((city, idx) => (
                        <option key={idx} value={city}>
                          {city === 'All' ? 'Every City' : city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price dropdown */}
                  <div className="w-full md:w-36">
                    <select
                      value={filterPrice}
                      onChange={(e) => setFilterPrice(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer h-[38px]"
                    >
                      <option value="All">All Budgets</option>
                      <option value="Free">Free entry RSVP</option>
                      <option value="Paid">Paid pass options</option>
                    </select>
                  </div>
                </div>

                {/* Categories filtering horizontal trail */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl mx-auto text-xs font-medium">
                  {['All', 'Tech', 'Music', 'Arts', 'Food', 'Sports'].map(cat => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-full px-4 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cat === 'All' ? 'Every Track' : cat}
                      </button>
                    );
                  })}
                </div>

                {/* Event Cards Grid */}
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm max-w-md mx-auto">
                    <Compass className="h-10 w-10 mx-auto text-slate-350 mb-2 animate-pulse" />
                    No matched event listings recorded under current filters. Try relaxing keywords!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {filteredEvents.map(event => (
                      <EventCard 
                        key={event.id}
                        event={event}
                        isWishlisted={userProfile?.wishlistedEvents?.includes(event.id) || false}
                        onToggleWishlist={() => handleToggleWishlist(event.id)}
                        onSelect={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* VIEW B: USER PORTAL ATTENDEE ACCOUNT HUB */}
            {currentTab === 'attendee' && (
              userProfile ? (
                <div className="space-y-6">
                  <AttendeeDashboard 
                    userProfile={userProfile}
                    registrations={registrations}
                    events={events}
                    authToken={authToken}
                    onUpdateProfile={(updated) => {
                      setUserProfile(updated);
                      syncServerState();
                    }}
                    onRefreshRegistrations={syncServerState}
                  />
                </div>
              ) : (
                <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-xl space-y-6 animate-fadeIn" id="auth-gateway-container">
                  <div className="text-center space-y-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-heading font-black text-xl shadow-xs">
                      E
                    </span>
                    <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                      {authMode === 'login' ? 'Sign In to EventSphere' : 'Create Your Account'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {authMode === 'login' 
                        ? 'Access your personal ticketing ledgers, custom badges, and AI personalized discovery recommendations.' 
                        : 'Register with EventSphere to secure tickets, curate agenda suggestions, and earn gamified trophies.'
                      }
                    </p>
                  </div>

                  {/* Auth mode toggle */}
                  <div className="grid grid-cols-2 p-1.5 bg-slate-50 rounded-2xl border text-xs font-bold leading-none select-none">
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className={`py-2 text-center rounded-xl cursor-pointer transition-all ${
                        authMode === 'login' 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Sign In
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className={`py-2 text-center rounded-xl cursor-pointer transition-all ${
                        authMode === 'signup' 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authError && (
                      <div className="rounded-xl border border-rose-100 bg-rose-50 text-rose-850 font-semibold p-3 text-center text-[11px]">
                        {authError}
                      </div>
                    )}
                    {authSuccess && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-850 font-semibold p-3 text-center text-[11px]">
                        {authSuccess}
                      </div>
                    )}

                    {authMode === 'signup' && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Full Name</label>
                          <input 
                            type="text"
                            required
                            value={authForm.name}
                            onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. John Doe"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">LinkedIn Profile (Optional)</label>
                          <input 
                            type="url"
                            value={authForm.linkedinUrl}
                            onChange={(e) => setAuthForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-400">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={authForm.email}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@yourdomain.com"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                        <span>Password</span>
                        {authMode === 'login' && (
                          <span className="text-slate-450 lowercase hover:text-blue-600 cursor-help" title="Demo database hint: try password123">
                            demo: password123
                          </span>
                        )}
                      </div>
                      <input 
                        type="password"
                        required
                        value={authForm.password}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 font-heading text-xs font-bold text-white py-3 transition-colors cursor-pointer mt-2 disabled:bg-blue-400"
                    >
                      {isAuthenticating 
                        ? 'Verifying Ident credentials...' 
                        : authMode === 'login' ? 'Sign In Now' : 'Create Account Portfolio'
                      }
                    </button>
                  </form>
                </div>
              )
            )}

            {/* VIEW C: ORGANISER OPERATIONS AREA */}
            {currentTab === 'organiser' && payouts && (
              <div className="space-y-6">
                <OrganiserDashboard 
                  events={events}
                  registrations={registrations}
                  payouts={payouts}
                  onEventCreated={syncServerState}
                  onRefreshRegistrations={syncServerState}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* 3. Immersive Modals list */}
      
      {/* Detail Modal Sheet view */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent}
          userName={userProfile?.name || 'Jane Smith'}
          userEmail={userProfile?.email || 'jaishreer2206@gmail.com'}
          userLinkedin={userProfile?.linkedinUrl}
          onClose={() => setSelectedEvent(null)}
          onOpenCheckout={() => {
            setOngoingCheckoutEvent(selectedEvent);
            setSelectedEvent(null);
          }}
          onRefreshEvent={(updated) => {
            setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            setSelectedEvent(updated);
          }}
        />
      )}

      {/* SECURE CHECKOUT PAYMENTS MODAL */}
      {ongoingCheckoutEvent && (
        <CheckoutModal 
          event={ongoingCheckoutEvent}
          userName={userProfile?.name || 'Jane Smith'}
          userEmail={userProfile?.email || 'jaishreer2206@gmail.com'}
          authToken={authToken}
          onClose={() => setOngoingCheckoutEvent(null)}
          onSuccess={(reg) => {
            // Secure booking complete successfully close modal and launch attendee portal to view tickets confirmation
            setOngoingCheckoutEvent(null);
            setCurrentTab('attendee');
            syncServerState();
          }}
        />
      )}

      {/* Footer Branding notes */}
      <footer className="shrink-0 bg-slate-900 text-slate-500 py-6 border-t border-slate-800 text-xs text-center" id="footer-branding-label">
        <p>© 2026 EventSphere Platform Inc. All permissions, ticketing ledgers, and payout releases are handled entirely in virtual sandbox limits.</p>
        <p className="mt-1 font-mono text-[10px]">Configured at Cloud Resource: 3000 Ingress Routing</p>
      </footer>

    </div>
  );
}
