import React, { useState } from "react";
import {
  X, Calendar, MapPin, Sparkles, ChevronLeft, CreditCard,
  Ticket, Check, Plus, Minus, Send, ThumbsUp, AlertCircle,
  BarChart, Heart, RefreshCw, MessageSquare, Award, Flame, Smile
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Event, User, TicketType, Booking } from "../types";

interface EventDetailsProps {
  event: Event;
  user: User | null;
  onBack: () => void;
  onBookingSuccess: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onLoginTrigger: () => void;
}

export default function EventDetails({
  event,
  user,
  onBack,
  onBookingSuccess,
  isWishlisted,
  onToggleWishlist,
  onLoginTrigger
}: EventDetailsProps) {
  // Ticket quantities choice
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountStatus, setDiscountStatus] = useState<'idle' | 'success' | 'invalid'>('idle');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [activeTab, setActiveTab] = useState<'about' | 'agenda' | 'live' | 'reviews'>('about');

  // Review posting state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Live session Q&A states
  const [newQuestion, setNewQuestion] = useState("");

  // Live session Poll voting
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});

  // Seat recommendation simulation state
  const [seatRecommendation, setSeatRecommendation] = useState<string | null>(null);

  const incrementTicket = (id: string, max: number) => {
    const currentTotalChosen = Object.keys(quantities).reduce((sum, key) => sum + (quantities[key] || 0), 0);
    if (event.registeredCount + currentTotalChosen >= event.capacity) return;

    setQuantities(prev => ({
      ...prev,
      [id]: Math.min(10, (prev[id] || 0) + 1)
    }));
  };

  const decrementTicket = (id: string) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1)
    }));
  };

  const applyDiscount = () => {
    if (!discountCode.trim()) return;
    const match = event.discountCodesValue?.find(
      c => c.code.toUpperCase() === discountCode.toUpperCase()
    );

    if (match) {
      setDiscountPercent(match.discountPercent);
      setDiscountStatus("success");
    } else {
      setDiscountPercent(0);
      setDiscountStatus("invalid");
    }
  };

  // Pricing calculations
  let subtotal = 0;
  event.ticketTypes.forEach(t => {
    subtotal += (quantities[t.id] || 0) * t.price;
  });
  const discountAmount = (subtotal * discountPercent) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalTicketsCount = Object.keys(quantities).reduce((sum, key) => sum + (quantities[key] || 0), 0);

  const handleCheckout = async () => {
    if (!user) {
      onLoginTrigger();
      return;
    }

    if (totalTicketsCount === 0) {
      setBookingError("Please select at least one ticket to purchase.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const selectedTickets = event.ticketTypes
        .filter(t => (quantities[t.id] || 0) > 0)
        .map(t => ({
          ticketTypeId: t.id,
          ticketTypeName: t.name,
          quantity: quantities[t.id],
          price: t.price
        }));

      const resp = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          eventId: event.id,
          tickets: selectedTickets,
          discountCode: discountPercent > 0 ? discountCode : "",
          totalAmount: totalAmount
        })
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Booking transaction failed.");
      }

      setQuantities({});
      setDiscountCode("");
      setDiscountPercent(0);
      setDiscountStatus("idle");
      onBookingSuccess();
    } catch (err: any) {
      setBookingError(err.message || "An issue occurred during checkout.");
    } finally {
      setBookingLoading(false);
    }
  };

  const postReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLoginTrigger();
      return;
    }
    if (!comment.trim()) return;

    setSubmittingReview(true);
    try {
      const resp = await fetch(`/api/events/${event.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          rating,
          comment
        })
      });
      if (resp.ok) {
        setComment("");
        onBookingSuccess(); // Sync event detail updates
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const askQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLoginTrigger();
      return;
    }
    if (!newQuestion.trim()) return;

    try {
      const resp = await fetch(`/api/events/${event.id}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          question: newQuestion
        })
      });
      if (resp.ok) {
        setNewQuestion("");
        onBookingSuccess();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const voteQA = async (qaId: string) => {
    try {
      const resp = await fetch(`/api/events/${event.id}/qa/${qaId}/vote`, {
        method: "POST"
      });
      if (resp.ok) {
        onBookingSuccess();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const votePoll = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return;
    try {
      const resp = await fetch(`/api/events/${event.id}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId })
      });
      if (resp.ok) {
        setVotedPolls(prev => ({ ...prev, [pollId]: true }));
        onBookingSuccess();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Smart Seating suggestions based on group criteria and investor logic
  const suggestSeat = () => {
    const seatingGoals = [
      "Row B, Seat 12 (Close visibility to main stage, optimized for investors)",
      "Row E, Seat 15 & 16 (Cozy center grouping, optimized for peer conversations)",
      "Row A, Seat 3 (VIP premium spotlight seat with direct networking space)",
      "Row D, Seat 9 (Acoustically balanced center seat, excellent view)"
    ];
    const randomIndex = Math.floor(Math.random() * seatingGoals.length);
    setSeatRecommendation(seatingGoals[randomIndex]);
  };

  // Sentiment analysis aggregate scorecard
  const reviewsCount = event.reviews?.length || 0;
  const positiveCount = event.reviews?.filter(r => r.sentiment === "Positive").length || 0;
  const negativeCount = event.reviews?.filter(r => r.sentiment === "Negative").length || 0;
  const satisfactionRate = reviewsCount > 0 ? Math.round((positiveCount / reviewsCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 rounded-2xl border border-slate-800">
        <img
          src={event.bannerImage || `https://picsum.photos/seed/${event.id}/800/400`}
          alt={event.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
        
        {/* Wishlist and Back buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-4 py-2 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-slate-950 cursor-pointer transition-colors shadow-md"
          >
            <ChevronLeft className="w-4 h-4 text-indigo-400" />
            Back to Events
          </button>

          <button
            onClick={onToggleWishlist}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer shadow-md ${
              isWishlisted
                ? "bg-rose-900/85 border-rose-500 text-rose-350"
                : "bg-slate-900/85 border-white/10 text-slate-200 hover:text-white hover:bg-slate-950"
            }`}
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Header information on Banner overlay */}
        <div className="absolute bottom-5 left-6 right-6 space-y-2">
          <span className="bg-indigo-600 border border-indigo-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
            {event.category}
          </span>
          <h1 className="text-xl md:text-2xl font-display font-black text-white tracking-tight leading-tight">
            {event.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs text-white/95">
            <span className="flex items-center gap-1.5 font-mono font-bold">
              <Calendar className="w-4 h-4 text-indigo-300" /> {event.date}
            </span>
            <span className="flex items-center gap-1.5 font-mono font-bold">
              <MapPin className="w-4 h-4 text-indigo-300" /> {event.venue}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Split Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Details tabs and interaction */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex p-1.5 gap-1.5 select-none bg-slate-100 border border-slate-200 rounded-xl">
            {(['about', 'agenda', 'live', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-indigo-600 border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab === 'live' ? "⚡ Live Q&A & Polls" : tab}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-xs">
            {/* About View */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold font-display text-slate-100 flex items-center gap-2">
                    Features and Highlights
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {event.description}
                  </p>
                </div>

                {event.speakers?.length > 0 && (
                  <div className="space-y-3.5 border-t border-slate-850 pt-4">
                    <h4 className="text-sm font-bold font-display text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-400" /> Key Event Speakers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {event.speakers.map((spk) => (
                        <div key={spk.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-display font-medium text-violet-400">
                              {spk.name[0]}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100">{spk.name}</div>
                              <div className="text-[10px] text-slate-400">{spk.role}</div>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-450 leading-relaxed italic">{spk.bio}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ section */}
                {event.faq?.length > 0 && (
                  <div className="space-y-3 border-t border-slate-850 pt-4">
                    <h4 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                      Frequently Asked Questions (FAQ)
                    </h4>
                    <div className="space-y-2.5">
                      {event.faq.map((f, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-xs font-semibold text-slate-250">Q: {f.question}</p>
                          <p className="text-xs text-slate-400 font-light pl-4">A: {f.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agenda View */}
            {activeTab === 'agenda' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-display text-slate-100 flex items-center gap-1.5">
                  Event Agenda & Timeline
                </h3>
                {event.agenda?.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                    {event.agenda.map((ag, idx) => (
                      <div key={idx} className="relative pl-10 space-y-1 group">
                        <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-violet-500 group-hover:bg-violet-500 transition-colors" />
                        <span className="text-[10px] text-violet-400 font-mono tracking-widest uppercase block">{ag.time}</span>
                        <h4 className="text-xs font-bold text-slate-200">{ag.title}</h4>
                        <p className="text-[10px] text-slate-400">{ag.speaker} • {ag.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No schedules declared for this event yet.</p>
                )}
              </div>
            )}

            {/* Live session Poll and Q&As */}
            {activeTab === 'live' && (
              <div className="space-y-6">
                {/* Custom active counter */}
                <div className="bg-violet-950/25 border border-violet-850 py-3.5 px-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Live Gate Tracking Check-in
                    </div>
                    <span className="text-xs text-slate-300">Currently attending in the hall:</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-extrabold text-white">{event.liveAttendeeCount || 0}</div>
                    <span className="text-[10px] text-slate-450">Verified check-ins</span>
                  </div>
                </div>

                {/* Polls space */}
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart className="w-4 h-4 text-violet-400" /> Active Session Polls
                  </h3>
                  {event.polls?.length > 0 ? (
                    <div className="space-y-4">
                      {event.polls.map((poll) => {
                        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
                        const hasVoted = votedPolls[poll.id];

                        return (
                          <div key={poll.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                            <h4 className="text-xs font-bold text-slate-200">{poll.question}</h4>
                            <div className="space-y-2">
                              {poll.options.map((opt) => {
                                const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                return (
                                  <button
                                    key={opt.id}
                                    onClick={() => votePoll(poll.id, opt.id)}
                                    className="w-full relative py-2.5 px-4 rounded-xl border border-slate-850 text-left overflow-hidden hover:border-violet-500 hover:bg-slate-900 duration-150 flex items-center justify-between group text-xs cursor-pointer"
                                  >
                                    <div
                                      className="absolute left-0 top-0 bottom-0 bg-violet-950/30 group-hover:bg-violet-950/40 transition-all duration-300"
                                      style={{ width: `${percent}%` }}
                                    />
                                    <span className="relative z-10 font-medium text-slate-200">{opt.text}</span>
                                    <span className="relative z-10 font-mono text-slate-400 text-[10px]">
                                      {hasVoted ? `${percent}% (${opt.votes} votes)` : "Lock Vote"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No active polls at the moment. Refresh or ask event speakers to inject.</p>
                  )}
                </div>

                {/* Live Q&As */}
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-violet-400" /> Participant Q&As
                  </h3>

                  {/* Ask question form */}
                  <form onSubmit={askQA} className="flex gap-2">
                    <input
                      id="inp-session-qa"
                      type="text"
                      placeholder="Ask speakers a professional question..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl text-xs px-3.5 py-2 hover:border-slate-700 focus:outline-none focus:border-violet-500 text-white"
                    />
                    <button
                      id="btn-session-qa-ask"
                      type="submit"
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      Inquire
                    </button>
                  </form>

                  {event.qa?.length > 0 ? (
                    <div className="space-y-2.5">
                      {event.qa.sort((a,b) => b.votes - a.votes).map((q) => (
                        <div key={q.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-300 font-bold">{q.userName}</span>
                              {q.answered && (
                                <span className="bg-emerald-950 text-emerald-300 text-[9px] font-mono px-1.5 py-0.5 rounded-md border border-emerald-800/40">
                                  ANSWERED BY SPEAKER
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200">{q.question}</p>
                          </div>
                          <button
                            onClick={() => voteQA(q.id)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white border border-slate-800 bg-slate-900 hover:bg-slate-850 py-1 px-2 rounded-lg cursor-pointer transition-colors"
                          >
                            <ThumbsUp className="w-3 h-3 text-violet-400" />
                            <span>{q.votes}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No questions posted yet. Be the first to ask!</p>
                  )}
                </div>
              </div>
            )}

            {/* Reviews View with Sentiment score */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Sentiment card */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-1 text-center md:text-left">
                    <div className="text-[10px] font-mono uppercase text-violet-400 font-bold">Event Mood Analysis</div>
                    <span className="text-2xl font-display font-extrabold text-white">{satisfactionRate}%</span>
                    <p className="text-[10px] text-slate-400">Excitement & satisfaction level</p>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                      <span>Positive Indicators ({positiveCount})</span>
                      <span>Neutral / Negative ({reviewsCount - positiveCount})</span>
                    </div>
                    <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${satisfactionRate}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${100 - satisfactionRate}%` }} />
                    </div>
                  </div>
                </div>

                {/* Create feedback review form */}
                <form onSubmit={postReview} className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Smile className="w-4 h-4 text-violet-400" /> Submit Your Event Feedback Review
                  </h4>
                  <div className="flex gap-2.5 items-center select-none">
                    <span className="text-xs text-slate-300">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setRating(stars)}
                          className={`text-base font-bold cursor-pointer transition-transform hover:scale-110 ${
                            stars <= rating ? "text-amber-400" : "text-slate-600"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="inp-session-comment"
                      type="text"
                      required
                      placeholder="Share your overall experience... AI sentiment analyzer executes immediately!"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-xl text-xs px-3.5 py-2 hover:border-slate-700 focus:outline-none focus:border-violet-500 text-white"
                    />
                    <button
                      id="btn-session-rev-submit"
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      {submittingReview ? "Analyzing..." : "Post"}
                    </button>
                  </div>
                </form>

                {/* Display reviews list */}
                {event.reviews?.length > 0 ? (
                  <div className="space-y-3">
                    {event.reviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-2 font-display">{rev.userName}</span>
                            <span className="text-amber-400 text-xs">{"★".repeat(rev.rating)}</span>
                          </div>
                          {rev.sentiment && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                              rev.sentiment === "Positive"
                                ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                                : rev.sentiment === "Negative"
                                ? "bg-rose-950/80 border border-rose-800 text-rose-300"
                                : "bg-slate-800 border border-slate-700 text-slate-300"
                            }`}>
                              AI Mood: {rev.sentiment}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-light leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No reviews received for this event yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Booking Panel (Paid vs Free Tickets) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold font-display text-slate-900">Select Tickets</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Choose multiple ticket categories in one order. Prices automatically calculate.
              </p>
            </div>

            {bookingError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* List Ticket Types */}
            <div className="space-y-3">
              {event.ticketTypes.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1 flex-1 pr-3">
                    <span className="text-xs font-black text-slate-850 block">{t.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold block line-clamp-1">{t.description}</span>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {t.price === 0 ? "FREE" : `$${t.price}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      id={`btn-tkt-dec-${t.id}`}
                      onClick={() => decrementTicket(t.id)}
                      className="w-7 h-7 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold w-5 text-center text-slate-800 font-black">
                      {quantities[t.id] || 0}
                    </span>
                    <button
                      id={`btn-tkt-inc-${t.id}`}
                      onClick={() => incrementTicket(t.id, event.capacity - event.registeredCount)}
                      className="w-7 h-7 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Promo codes */}
            <div className="space-y-1.5 border-t border-slate-150 pt-4">
              <label className="text-xs font-bold text-slate-705 text-slate-700">Discount Code</label>
              <div className="flex gap-2">
                <input
                  id="inp-tkt-discount"
                  type="text"
                  placeholder="Try AISUPER or FREEAI"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-1.5 hover:border-slate-300 focus:outline-none text-slate-850 font-bold font-mono"
                />
                <button
                  id="btn-tkt-discount-apply"
                  type="button"
                  onClick={applyDiscount}
                  className="px-4 bg-slate-150 hover:bg-slate-200 border border-slate-205 text-slate-705 text-slate-700 hover:text-slate-900 text-xs rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {discountStatus === "success" && (
                <p className="text-[10px] text-emerald-600 font-bold">Promo code applied successfully! ({discountPercent}% Off)</p>
              )}
              {discountStatus === "invalid" && (
                <p className="text-[10px] text-rose-600 font-bold">Invalid or expired promo code.</p>
              )}
            </div>

            {/* Summary calculation breakdown */}
            <div className="border-t border-slate-150 pt-4 space-y-2 text-xs font-mono text-slate-550 text-slate-600 font-bold">
              <div className="flex justify-between">
                <span>Total tickets:</span>
                <span>{totalTicketsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black border-t border-slate-155 border-slate-200 pt-2.5">
                <span>Grand Total:</span>
                <span className="text-indigo-600 font-black">${totalAmount}</span>
              </div>
            </div>

            {/* Order Checkout button */}
            <button
              id="btn-tkt-checkout"
              onClick={handleCheckout}
              disabled={bookingLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-650 text-white hover:from-indigo-550 hover:to-purple-600 font-black rounded-xl text-xs tracking-wide shadow-md shadow-indigo-100/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {bookingLoading ? (
                <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {user ? "Secure Sandbox Booking" : "Sign In to Book Passes"}
                </>
              )}
            </button>
          </div>

          {/* AI Smart seat recommender */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" /> Smart Seat Recommendation
            </h3>
            <p className="text-[10px] text-slate-505 text-slate-500 leading-relaxed font-bold">
              Let the intelligence recommendation model choose the best seat location based on speaker visibility, group goals, and investor access.
            </p>
            {seatRecommendation ? (
              <div className="p-3 bg-indigo-50 border border-indigo-100/60 rounded-xl space-y-1 animate-pulse">
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-indigo-600 block">Recommended Spot</span>
                <p className="text-xs text-slate-800 font-bold">{seatRecommendation}</p>
              </div>
            ) : (
              <button
                id="btn-tkt-seat-recommend"
                onClick={suggestSeat}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs hover:border-slate-350 cursor-pointer transition-colors"
              >
                Find Recommended Seating
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
