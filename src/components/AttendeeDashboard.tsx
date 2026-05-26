import React, { useState, useEffect } from "react";
import {
  Sparkles, Calendar, MapPin, Heart, HelpCircle, Download,
  Bookmark, Award, Flame, Star, Mic, ShieldAlert, BadgeInfo, Compass, Link2, DownloadCloud, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Event, Booking } from "../types";

interface AttendeeDashboardProps {
  user: User;
  eventsList: Event[];
  onOpenEvent: (id: string) => void;
  onRefresh: () => void;
  onUpdateUser: (newUser: User) => void;
}

export default function AttendeeDashboard({
  user,
  eventsList,
  onOpenEvent,
  onRefresh,
  onUpdateUser
}: AttendeeDashboardProps) {
  // Booking status
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'tickets' | 'wishlist' | 'ai' | 'networking' | 'certificates'>('tickets');
  const [recommendations, setRecommendations] = useState<{ eventId: string; reason: string }[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");

  // Certificate showcase modal
  const [selectedCert, setSelectedCert] = useState<{ booking: Booking; event: Event } | null>(null);

  // Fetch attendee bookings
  const fetchBookings = async () => {
    try {
      const resp = await fetch(`/api/bookings?userId=${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Get AI recommended highlights
  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const resp = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: user.interests || ["Tech & AI"],
          attendedCategories: bookings.map(b => b.eventName)
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  useEffect(() => {
    if (activeTab === "ai") {
      fetchRecommendations();
    }
  }, [activeTab]);

  // Request ticket refund
  const requestRefund = async (bookingId: string) => {
    if (confirm("Are you sure you want to request a refund for this ticket? All associated seats will be released.")) {
      try {
        const resp = await fetch(`/api/bookings/${bookingId}/refund`, {
          method: "POST"
        });
        if (resp.ok) {
          fetchBookings();
          onRefresh();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Simulation of HTML5 Speech Recognition for Indian city and free entry query
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Simulate speech recognition
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setVoiceQuery("Show free tech events in Chennai this weekend");
        alert("Microphone recognition simulation complete: Search for 'Show free tech events in Chennai' triggered.");
      }, 2000);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const resultText = e.results[0][0].transcript;
      setVoiceQuery(resultText);
    };
    rec.start();
  };

  // Filtered lists
  const wishlistItems = eventsList.filter(e => user.wishlist?.includes(e.id));

  // Auto Certificate Generation logic
  // Returns list of confirmed bookings where checkedIn === true
  const attendedBookings = bookings.filter(b => b.checkedIn);

  const displayCertificate = (b: Booking) => {
    const ev = eventsList.find(e => e.id === b.eventId);
    if (ev) {
      setSelectedCert({ booking: b, event: ev });
    }
  };

  return (
    <div className="space-y-6">
      {/* Gamification Status Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-705 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm shadow-indigo-100">
        {/* Decorative background pulse */}
        <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="space-y-2 text-center md:text-left relative z-10 shrink-1">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-white bg-white/20 px-2.5 py-1 rounded-full border border-white/10">
              Gamification Status
            </span>
          </div>
          <h2 className="text-lg font-display font-extrabold text-white">
            Greetings, {user.name} 👋
          </h2>
          <p className="text-xs text-indigo-50 font-normal max-w-lg leading-relaxed">
            You have earned total <strong className="text-yellow-300 font-bold">{user.points || 0} Points</strong> from registering, leaving feedback reviews, and attending seminar workshops.
          </p>

          {/* Badges alignment */}
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start pt-1">
            {(user.badges || []).map((b, idx) => (
              <span
                key={idx}
                className="bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-help duration-155 transition-colors"
                title="Gamified event milestone unlocked"
              >
                <Star className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right side Points Circle */}
        <div className="relative shrink-0 z-10">
          <div className="w-28 h-28 rounded-full border border-white/20 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center shadow-lg">
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse fill-yellow-300" />
            <span className="text-2xl font-display font-black text-white leading-tight mt-0.5">{user.points || 0}</span>
            <span className="text-[9px] uppercase tracking-wider text-white/90 font-bold font-mono">Total Points</span>
          </div>
        </div>
      </div>

      {/* Voice-Based Event Navigation bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-xs">
        <button
          id="btn-voice-search"
          onClick={startSpeechRecognition}
          className={`p-3 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 ${
            isListening
              ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse"
              : "bg-slate-50 border-slate-201 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
          }`}
          title="Search events with voice recognition query"
        >
          <Mic className="w-5 h-5 text-indigo-600" />
        </button>

        <div className="flex-1 space-y-0.5">
          <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold">
            Innovation Voice Search Assistant
          </label>
          <input
            id="inp-voice-search"
            type="text"
            readOnly
            placeholder='Click microphone to search: "Show free tech events in Chennai this weekend."'
            value={voiceQuery}
            className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none pointer-events-none font-semibold"
          />
        </div>
      </div>

      {/* Primary Split View tab navigates */}
      <div className="space-y-6">
        {/* Navigation buttons */}
        <div className="flex border border-slate-200 p-1 bg-slate-100/70 rounded-xl gap-1 select-none overflow-x-auto no-scrollbar">
          {(['tickets', 'wishlist', 'ai', 'networking', 'certificates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white shadow-xs text-indigo-600 border border-slate-200/85"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "ai" ? "✨ AI Recommendations" : tab === "tickets" ? "🎫 My Tickets" : tab}
            </button>
          ))}
        </div>

        {/* Tab view containers */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs text-slate-800">
          {/* Tickets View */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold font-display text-slate-900">Your Booked Ticket Orders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => {
                  const isRefundable = b.status === "confirmed";
                  return (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex flex-col justify-between gap-4 shadow-xs"
                    >
                      <div className="absolute right-3 top-3 border border-slate-200 bg-white text-slate-600 text-[9px] font-mono py-0.5 px-2 rounded-md uppercase font-bold">
                        {b.status === "refund_requested" ? "Refund Pending" : b.status === "refunded" ? "Refunded" : "Active"}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-650 block font-bold">Booking Ref: {b.id}</span>
                          <h4 className="text-xs font-black text-slate-850 leading-snug font-display line-clamp-1">{b.eventName}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><Calendar className="w-3 h-3 text-slate-400" /> {b.eventDate} • {b.eventVenue}</p>
                      </div>

                      {/* Simulation QR Ticket display */}
                      {b.status === "confirmed" && (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3.5 shadow-2xs">
                          <div className="shrink-0 flex items-center justify-center p-1.5 bg-slate-850 rounded-lg">
                            {/* Visual QR element */}
                            <div className="w-14 h-14 bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center select-none shrink-0 overflow-hidden rounded">
                              <span className="text-[7px] font-mono text-white text-center font-bold">QR PASS</span>
                              <div className="grid grid-cols-4 gap-0.5 w-10 h-10 bg-slate-950 mt-1">
                                <div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" /><div className="bg-white" />
                                <div className="bg-slate-950" /><div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" />
                                <div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" /><div className="bg-slate-950" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-xs leading-tight flex-1">
                            <span className="text-[8px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">
                              booking_id:{b.id}
                            </span>
                            <span className="text-[10px] text-slate-600 block font-medium mt-1">
                              {b.tickets.map(t => `${t.quantity}x ${t.ticketTypeName}`).join(", ")}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {b.checkedIn ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 px-2.5 py-1 rounded-lg uppercase tracking-wider">Attended</span>
                            ) : (
                              <button
                                id={`btn-refund-req-${b.id}`}
                                onClick={() => requestRefund(b.id)}
                                className="text-[10px] text-slate-500 hover:text-rose-600 font-bold underline cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {bookings.length === 0 && (
                  <p className="text-xs text-slate-500 italic font-medium py-3">No tickets purchased yet. Locate events first!</p>
                )}
              </div>
            </div>
          )}

          {/* Wishlist View */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold font-display text-slate-900">Your Saved Wishlist Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onOpenEvent(evt.id)}
                    className="p-4 bg-slate-50 border border-slate-205 border-slate-200 rounded-xl hover:border-slate-350 cursor-pointer duration-150 flex flex-col justify-between gap-4 shadow-xs hover:shadow-sm"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-indigo-600">{evt.category}</span>
                      <h4 className="text-xs font-bold text-slate-800 font-display line-clamp-1">{evt.name}</h4>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                      <p>Date: {evt.date}</p>
                      <p>Venue: {evt.venue}</p>
                    </div>
                  </div>
                ))}
                {wishlistItems.length === 0 && (
                  <p className="text-xs text-slate-500 italic font-medium">Your wishlist is currently empty.</p>
                )}
              </div>
            </div>
          )}

          {/* AI recommendations Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold font-display text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Smart Matchmaking & Recommendations
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Our algorithm processes your indicated interest profiles (i.e. <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{user.interests?.join(", ")}</span>) against upcoming event databases to propose tailored fits.
                </p>
              </div>

              {recommendationsLoading ? (
                <div className="py-8 flex items-center justify-center whitespace-nowrap">
                  <span className="w-5 h-5 border-2 border-indigo-605 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mr-2" />
                  <span className="text-xs text-slate-500 font-mono font-bold">Querying intelligence clusters...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((recommend) => {
                    const matchEvent = eventsList.find(e => e.id === recommend.eventId);
                    if (!matchEvent) return null;

                    return (
                      <div
                        key={recommend.eventId}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center hover:border-indigo-300 duration-150 cursor-pointer shadow-xs"
                        onClick={() => onOpenEvent(recommend.eventId)}
                      >
                        <div className="md:col-span-1 border-r border-slate-200 pr-4 shrink-0">
                          <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-600 block font-bold">Highly Recommended</span>
                          <span className="text-xs font-bold text-slate-800 font-display line-clamp-2">{matchEvent.name}</span>
                        </div>
                        <div className="md:col-span-3 text-xs text-slate-600 leading-relaxed font-normal">
                          {recommend.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Smart Networking Card display */}
          {activeTab === 'networking' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold font-display text-slate-900">Your Public Networking Card</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Attendees at large expos can verify and exchange contact connections securely. Enable LinkedIn overlays below.
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-white to-white border border-indigo-100 rounded-2xl max-w-sm mx-auto space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-display font-medium text-lg text-white font-bold shadow-md shadow-indigo-150">
                    {user.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display leading-tight">{user.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block">ID: {user.id}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                  <div className="text-[10px] font-mono text-slate-600 space-y-1 font-bold font-bold">
                    <p className="flex justify-between"><span>LinkedIn:</span> <span className="text-indigo-600 text-right truncate max-w-[200px]">{user.linkedin || "Not Declared"}</span></p>
                    <p className="flex justify-between"><span>GitHub:</span> <span className="text-indigo-600 text-right truncate max-w-[200px]">{user.github || "Not Declared"}</span></p>
                    <p className="flex justify-between"><span>Portfolio:</span> <span className="text-indigo-600 text-right truncate max-w-[200px]">{user.portfolio || "Not Declared"}</span></p>
                  </div>
                </div>

                {/* Simulated Networking scan QR card */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center space-y-2 text-center select-none">
                  <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded flex flex-col items-center justify-center shrink-0 overflow-hidden">
                    <span className="text-[7px] font-mono text-white text-center font-bold">CONTACT PASS</span>
                    <div className="grid grid-cols-4 gap-0.5 w-14 h-14 bg-slate-950 mt-1">
                      <div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" /><div className="bg-white" />
                      <div className="bg-slate-950" /><div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" />
                      <div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" /><div className="bg-slate-950" />
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 font-bold">Scan to save LinkedIn information</span>
                </div>
              </div>
            </div>
          )}

          {/* Certificates Auto Generation View */}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold font-display text-slate-900">Participation Certificates</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Successfully checked-in events unlock beautiful participation certificates with active QR code validation keys.
                </p>
              </div>

              {attendedBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attendedBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-350 cursor-pointer shadow-xs"
                      onClick={() => displayCertificate(bk)}
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-600 flex items-center gap-1 font-bold">
                          <Award className="w-3.5 h-3.5 text-indigo-600" /> Participation Certificate Verified
                        </span>
                        <h4 className="text-xs font-bold text-slate-805 text-slate-800 font-display leading-snug line-clamp-1">{bk.eventName}</h4>
                      </div>
                      <button
                        className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] rounded-lg tracking-wide transition-all select-none cursor-pointer"
                      >
                        Display
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic font-medium">No certificates unlocked yet. Ensure you are checked-in by the organizer at the gateway gates.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal Showcase */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedCert(null)} />

            {/* Certificate Page Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-2xl bg-white border-8 border-indigo-100 rounded-3xl shadow-2xl p-8 z-10 flex flex-col justify-between space-y-6 text-slate-800"
            >
              {/* Header crest */}
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-indigo-50 rounded-full border border-indigo-100 shadow-md">
                  <Award className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-md uppercase tracking-widest font-display text-indigo-650 font-black text-indigo-700">Certificate of Attendance</h2>
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Verified by EventSphere Security Protocol</p>
              </div>

              {/* Recipient Details */}
              <div className="text-center space-y-4">
                <span className="text-xs text-slate-505 text-slate-500 font-semibold italic block">This is proudly presented to</span>
                <h3 className="text-2xl font-display font-black text-slate-900 tracking-wide">{user.name}</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                  who has successfully attended and actively engaged in the special workshops, networking platforms, and panels during the global ecosystem highlight event:
                </p>
                <div className="py-2.5 px-5 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-2xs">
                  <span className="text-xs font-bold text-indigo-700 font-display">{selectedCert.event.name}</span>
                  <p className="text-[10px] uppercase font-mono text-slate-500 font-bold mt-1">{selectedCert.event.date} • {selectedCert.event.venue}</p>
                </div>
              </div>

              {/* Signatures & Security Verification details */}
              <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-0.5 font-mono text-[9px] text-slate-500 font-bold">
                  <p>CERTIFICATE KEY: EV_CERT_{selectedCert.booking.id}</p>
                  <p>HOLDER REF: {user.id}</p>
                  <p>VALIDITY STATUS: SECURED & VERIFIED ✓</p>
                </div>

                {/* active certificate validation QR */}
                <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-201 border-slate-100 rounded-lg">
                  <div className="w-12 h-12 bg-slate-905 border-2 border-slate-900 rounded flex flex-col items-center justify-center select-none shrink-0 overflow-hidden">
                    <span className="text-[6px] font-mono text-white text-center font-bold">CERT VALID</span>
                    <div className="grid grid-cols-4 gap-0.5 w-8 h-8 bg-slate-950 mt-0.5 animate-pulse">
                      <div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" /><div className="bg-white" />
                      <div className="bg-slate-950" /><div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" />
                      <div className="bg-white" /><div className="bg-slate-950" /><div className="bg-white" /><div className="bg-slate-950" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-mono tracking-wider font-bold text-indigo-600 block pb-1">QR Verification Key</span>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert("Certificate files compiled & saved successfully to device."); }}
                      className="text-[9px] text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 font-bold"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-indigo-600" /> Save Certificate
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCert(null)}
                className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
