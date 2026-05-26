/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, MapPin, Users, HelpCircle, Trophy, MessageSquare, 
  Sparkles, Award, ArrowUpRight, Check, Send, AlertCircle, BarChart3, 
  Compass, BadgeHelp, Linkedin, RefreshCw, Flame 
} from 'lucide-react';
import { Event, Review, Poll, ChatMessage } from '../types';

interface EventDetailModalProps {
  event: Event;
  userEmail: string;
  userName: string;
  userLinkedin?: string;
  onClose: () => void;
  onOpenCheckout: () => void;
  onRefreshEvent: (updated: Event) => void;
}

export default function EventDetailModal({ 
  event, userEmail, userName, userLinkedin, onClose, onOpenCheckout, onRefreshEvent 
}: EventDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'interact' | 'community'>('details');
  const [reviews, setReviews] = useState<Review[]>(event.reviews || []);
  const [polls, setPolls] = useState<Poll[]>(event.polls || []);
  const [chatList, setChatList] = useState<ChatMessage[]>(event.chat || []);
  
  // Review submission state
  const [reviewName, setReviewName] = useState(userName);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewLinkedin, setReviewLinkedin] = useState(userLinkedin || '');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Live Chat input state
  const [chatMessageInput, setChatMessageInput] = useState('');
  
  // Live Poll action state
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [isPollSubmitting, setIsPollSubmitting] = useState(false);

  // Smart Networking Match state (Innovative Feature 2)
  const [userNetworkingBio, setUserNetworkingBio] = useState('Senior developer seeking colleagues and collaborative partners in AI enterprise apps.');
  const [userLinkedinInput, setUserLinkedinInput] = useState(userLinkedin || 'https://linkedin.com/in/');
  const [networkingMatches, setNetworkingMatches] = useState<any[]>([]);
  const [isNetworkingMatching, setIsNetworkingMatching] = useState(false);

  // AI Crowd Prediction state (Innovative Feature 1)
  const [crowdPrediction, setCrowdPrediction] = useState<any>(null);
  const [isCrowdPredicting, setIsCrowdPredicting] = useState(false);

  // AI Event Poster Generator state (Innovative Feature 4)
  const [aiPosterPrompt, setAiPosterPrompt] = useState('abstract quantum architecture pattern, cyberpunk corporate colors');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterBanner, setPosterBanner] = useState<string>(event.bannerImage);

  // Smart Agenda Order suggestion (Organiser Side option)
  const [isOptimizingAgenda, setIsOptimizingAgenda] = useState(false);
  const [agendaList, setAgendaList] = useState(event.agenda || []);

  const hasBannerGradient = posterBanner.startsWith('linear-gradient');

  // Load live polls and chats periodically or on open
  useEffect(() => {
    setReviews(event.reviews || []);
    setPolls(event.polls || []);
    setChatList(event.chat || []);
    setAgendaList(event.agenda || []);
    setPosterBanner(event.bannerImage);
  }, [event]);

  // Handle Event Chat submission and fetch list
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim()) return;

    try {
      const response = await fetch(`/api/events/${event.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: userName, message: chatMessageInput })
      });
      const data = await response.json();
      if (response.ok) {
        setChatList(prev => [...prev, data]);
        setChatMessageInput('');
      }
    } catch (err) {
      console.error('Chat error', err);
    }
  };

  // Handle Voting in active Live Polls (Innovative Feature 3)
  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const response = await fetch(`/api/events/${event.id}/polls/${pollId}/vote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      const data = await response.json();
      if (response.ok) {
        setPolls(prev => prev.map(p => p.id === pollId ? data : p));
      }
    } catch (err) {
      console.error('Vote error', err);
    }
  };

  // Handle adding custom live polls
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const cleanOpts = newPollOptions.filter(o => !!o.trim());
    if (cleanOpts.length < 2) return;

    setIsPollSubmitting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newPollQuestion, options: cleanOpts })
      });
      const data = await response.json();
      if (response.ok) {
        setPolls(prev => [...prev, data]);
        setNewPollQuestion('');
        setNewPollOptions(['', '']);
      }
    } catch (err) {
      console.error('Create poll error', err);
    } finally {
      setIsPollSubmitting(false);
    }
  };

  // Submit Feedback Review (Community 2)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!reviewText.trim()) {
      setReviewError('Please write some feedback text.');
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: reviewName,
          rating: reviewRating,
          text: reviewText,
          linkedin: reviewLinkedin || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Feedback submission failed');
      }

      setReviews(prev => [...prev, data]);
      setReviewText('');
      setReviewSuccess('Thank you! Your verified attendee feedback has been posted.');
    } catch (err: any) {
      setReviewError(err.message);
    }
  };

  // Fetch AI Crowd turnout predictions (Innovative Feature 1)
  const fetchCrowdPrediction = async () => {
    setIsCrowdPredicting(true);
    try {
      const response = await fetch('/api/ai/crowd-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, registrationCount: reviews.length + 12 })
      });
      const data = await response.json();
      if (response.ok) {
        setCrowdPrediction(data.prediction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCrowdPredicting(false);
    }
  };

  // Run AI Smart Networking Matches (Innovative Feature 2)
  const runNetworkingMatches = async () => {
    setIsNetworkingMatching(true);
    try {
      // Fetch similar mock profiles who checked in or registered
      const mockAttendeeRoster = [
        { attendeeName: 'David Chen', linkedinUrl: 'https://linkedin.com/demo-david-chen-ai' },
        { attendeeName: 'Elena Rostova', linkedinUrl: 'https://linkedin.com/demo-elena-roster' },
        { attendeeName: 'Kofi Mensah', linkedinUrl: 'https://linkedin.com/demo-kofi-mensah' },
        { attendeeName: 'Ravi Verma', linkedinUrl: 'https://linkedin.com/demo-ravi-verma' }
      ];

      const response = await fetch('/api/ai/networking-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBio: userNetworkingBio,
          linkedinUrl: userLinkedinInput,
          eventCategory: event.category,
          attendeeProfiles: mockAttendeeRoster
        })
      });
      const data = await response.json();
      if (response.ok) {
        setNetworkingMatches(data.matches);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNetworkingMatching(false);
    }
  };

  // Run AI Event Poster / Banner Generator (Innovative Feature 4)
  const handleGeneratePoster = async () => {
    setIsGeneratingPoster(true);
    try {
      const response = await fetch('/api/ai/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPosterPrompt,
          title: event.name,
          category: event.category
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPosterBanner(data.bannerUrl);
        // Call parent to refresh the banner image locally in parent state as well
        onRefreshEvent({ ...event, bannerImage: data.bannerUrl });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // Run AI Smart Agenda Schedule Reordering Suggestion
  const handleOptimizeAgenda = async () => {
    setIsOptimizingAgenda(true);
    try {
      const response = await fetch('/api/ai/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions: event.agenda,
          speakers: event.speakers
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAgendaList(data.agenda);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsOptimizingAgenda(false);
    }
  };

  // Smart Calendar Sync .ics Downloader (Innovative Feature 9)
  const handleCalendarSync = () => {
    // Format timezone info and calendar content
    const cleanDate = event.date.replace(/-/g, '');
    const cleanTime = event.time.replace(/:/g, '') + '00';
    
    // .ics structure
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventSphere//NONSGML Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@eventsphere.com`,
      `DTSTART:${cleanDate}T${cleanTime}`,
      `DTEND:${cleanDate}T180000`, // mock end time 6pm
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.venue}, ${event.city}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.id}-schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto" id={`detail-modal-${event.id}`}>
      <div className="relative flex h-full max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-zoomIn">
        
        {/* Banner with Ref referrerPolicy */}
        <div 
          className="relative h-48 w-full shrink-0 flex flex-col justify-end p-6"
          style={hasBannerGradient ? { background: posterBanner } : { backgroundImage: `url(${posterBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {/* Overlay gradient shroud for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
            id="close-detail-modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Organizer Header Controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              {event.category}
            </span>
          </div>

          <div className="relative z-10 text-white">
            <h1 className="font-heading text-xl font-bold leading-tight md:text-3xl drop-shadow-sm">{event.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                {event.date} at {event.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                {event.venue}, {event.city}
              </span>
            </div>
          </div>
        </div>

        {/* Tab switcher navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50 shrink-0" id="modal-tab-bar">
          <button
            onClick={() => setActiveTab('details')}
            className={`border-b-2 px-5 py-3.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Agenda & Speakers
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`border-b-2 px-5 py-3.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('interact')}
            className={`border-b-2 px-5 py-3.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'interact' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Smart Interact & AI Tools
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`border-b-2 px-5 py-3.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'community' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Event Chat Room
          </button>
        </div>

        {/* Modal Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="modal-tab-content">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              
              {/* Event Description & Smart Calendar Sync */}
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">About this Session</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
                </div>

                <div className="shrink-0 w-full md:w-56 rounded-2xl bg-blue-50/40 border border-blue-100 p-4">
                  <span className="block text-[10px] font-bold tracking-widest text-blue-800 uppercase mb-2">Schedule Assistant</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">Sync EventSphere agendas instantly with your own mobile scheduling feeds.</p>
                  <button 
                    onClick={handleCalendarSync}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 font-heading text-xs font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Sync Smart Calendar (.ICS)
                  </button>
                </div>
              </div>

              {/* Agenda / Lineup Schedule section */}
              <div className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Session Agenda Order
                  </h3>
                  
                  {/* Optimizer agenda triggers (AI Feature 3) */}
                  <button
                    onClick={handleOptimizeAgenda}
                    disabled={isOptimizingAgenda}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 font-heading text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    {isOptimizingAgenda ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Sorting Flow Dynamics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        AI Smart Schedule Suggest
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  {agendaList.map((session: any) => (
                    <div key={session.id} className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/40 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-600">{session.time}</span>
                          <h4 className="font-heading text-base font-bold text-slate-800 mt-0.5">{session.title}</h4>
                          <p className="text-xs text-slate-500">{session.description}</p>
                          {session.reason && (
                            <p className="mt-1 flex items-start gap-1 font-sans text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md w-fit">
                              <Sparkles className="h-3 w-3 shrink-0 text-teal-600 mt-0.5" />
                              Optimizer note: {session.reason}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1 bg-white border px-2 py-1 rounded-lg text-xs font-bold text-slate-700">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span>Host: {session.speaker}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speakers Roster Row */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-heading text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Keynote Speakers
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {event.speakers.map((speaker, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                      <img 
                        src={speaker.avatar} 
                        alt={speaker.name}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-full object-cover shadow-inner" 
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{speaker.name}</h4>
                        <p className="text-xs text-slate-500">{speaker.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              {event.faq && event.faq.length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-3">
                    {event.faq.map((f, idx) => (
                      <details key={idx} className="group rounded-xl border border-slate-100 bg-white p-4 transition-colors">
                        <summary className="flex cursor-pointer list-none items-center justify-between font-heading text-sm font-semibold text-slate-800 focus:outline-hidden">
                          <span>{f.q}</span>
                          <span className="text-slate-400 transition-transform group-open:rotate-180">▼</span>
                        </summary>
                        <p className="mt-2 text-xs text-slate-500 leading-relaxed">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: REVIEWS & RATING RATING SUBMISSION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">Public Attendees Reviews</h3>
                <p className="text-xs text-slate-500">Verified feedback and attendee ratings for past and upcoming EventSphere sessions.</p>
              </div>

              {/* Verified review lists */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 italic">No reviews posted yet. Be the first check-in attendee to rate this session!</p>
                  </div>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.id} className="rounded-xl border border-slate-100 p-4 bg-white shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-slate-800">{rev.userName}</span>
                          <span className="ml-2 font-mono text-[10px] text-slate-400">{rev.date}</span>
                        </div>
                        {rev.linkedin && (
                          <a 
                            href={rev.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:text-sky-800 font-mono text-xs flex items-center gap-1"
                          >
                            <Linkedin className="h-3 w-3" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                      
                      {/* Rating stars display */}
                      <div className="flex gap-1 mt-1 text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx}>{idx < rev.rating ? '★' : '☆'}</span>
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{rev.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Review submit form */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-heading text-base font-bold text-slate-800 mb-3">Leave Feedback / Review</h4>
                <form onSubmit={handleSubmitReview} className="space-y-4 rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">LinkedIn URL (Optional)</label>
                      <input 
                        type="url" 
                        value={reviewLinkedin}
                        onChange={(e) => setReviewLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">Session Rating:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(stars => (
                        <button
                           type="button"
                          key={stars}
                          onClick={() => setReviewRating(stars)}
                          className={`text-lg transition-colors cursor-pointer ${
                            stars <= reviewRating ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500">Your Opinion / Critique</label>
                    <textarea 
                      required
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      placeholder="Comment on sound, speakers flow, or organizational convenience..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  {reviewError && <p className="text-xs text-rose-600">{reviewError}</p>}
                  {reviewSuccess && <p className="text-xs text-emerald-600 font-semibold">{reviewSuccess}</p>}

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-4 py-2 font-heading text-xs font-bold text-white hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    Submit Verified Review
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: AI INNOVATION TOOLS PANEL (Innovative features 1, 2, 4) */}
          {activeTab === 'interact' && (
            <div className="space-y-6">
              
              {/* Feature 1: AI Poster Generator */}
              <div className="rounded-2xl border border-blue-150 bg-blue-50/10 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-heading text-base font-bold text-slate-950 flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                      AI Event Poster Generator
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Instantly redesign this events banner theme. Enter descriptive styling queues to let Gemini draft a stunning abstract background.
                    </p>
                  </div>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-700 uppercase">
                    Imagen AI API
                  </span>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-2xl">
                  <input 
                    type="text" 
                    value={aiPosterPrompt}
                    onChange={(e) => setAiPosterPrompt(e.target.value)}
                    placeholder="e.g. holographic tech abstract lines, warm retro lights"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePoster}
                    disabled={isGeneratingPoster || !aiPosterPrompt.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-heading text-xs font-bold text-white hover:bg-slate-950 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {isGeneratingPoster ? 'Generating Graphic...' : 'Render Banner'}
                  </button>
                </div>
              </div>

              {/* Feature 2: Crowd Prediction turnout */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50/10 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-heading text-base font-bold text-orange-950 flex items-center gap-1.5">
                      <BarChart3 className="h-4.5 w-4.5 text-orange-500" />
                      AI Crowd Prediction Analysis
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Forecast attendee conversion, expected gates turnout density, and seating heatmaps predictions using category metrics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCrowdPrediction}
                    disabled={isCrowdPredicting}
                    className="rounded-xl bg-orange-600 px-4 py-2 font-heading text-xs font-bold text-white hover:bg-slate-900 transition-colors disabled:opacity-45 cursor-pointer"
                  >
                    {isCrowdPredicting ? 'Computing Models...' : 'Predict Expected Crowd'}
                  </button>
                </div>

                {crowdPrediction && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-orange-100 bg-orange-50/40 p-4 text-slate-800">
                    <div className="border-r border-orange-100/50 pr-4">
                      <span className="block text-[10px] font-bold text-orange-800 uppercase tracking-wider">Attendance Forecast</span>
                      <p className="font-heading text-2xl font-bold mt-0.5">{crowdPrediction.predictedAttendeeCount} expected</p>
                      <span className="font-mono text-xs text-orange-600 font-semibold">{crowdPrediction.crowdSizeDescriptor}</span>
                    </div>
                    <div className="border-r border-orange-100/50 px-4">
                      <span className="block text-[10px] font-bold text-orange-850 uppercase tracking-wider">Sellout Probability</span>
                      <p className="font-heading text-2xl font-bold mt-0.5">{crowdPrediction.expectedTurnoutPercent}%</p>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        crowdPrediction.selloutConfidence === 'High' 
                          ? 'bg-rose-100 text-rose-850' 
                          : 'bg-amber-100 text-amber-850'
                      }`}>
                        {crowdPrediction.selloutConfidence} Conv Density
                      </span>
                    </div>
                    <div className="pl-4 space-y-1 text-xs">
                      <span className="block text-[10px] font-bold text-orange-850 uppercase tracking-wider">Predictive Insights</span>
                      {crowdPrediction.insights.map((ins: string, idx: number) => (
                        <p key={idx} className="text-slate-500">• {ins}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature 3: Smart Networking Matches & LinkedIn Exchange */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/10 p-5">
                <h4 className="font-heading text-base font-bold text-slate-950 flex items-center gap-1.5 mb-1">
                  <Linkedin className="h-4.5 w-4.5 text-sky-500" />
                  AI Smart Networking Matches
                </h4>
                <p className="text-xs text-slate-600">
                  Connect with registered professionals holding matched technical vectors. State your brief focus bio outline below:
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Your Professional Bio / Interest Vector</label>
                    <textarea 
                      value={userNetworkingBio}
                      onChange={(e) => setUserNetworkingBio(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Your Verified LinkedIn Handshake URL</label>
                    <input 
                      type="url"
                      value={userLinkedinInput}
                      onChange={(e) => setUserLinkedinInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={runNetworkingMatches}
                      disabled={isNetworkingMatching || !userNetworkingBio.trim()}
                      className="mt-3 w-full rounded-xl bg-sky-600 py-2 font-heading text-xs font-bold text-white hover:bg-slate-955 transition-colors disabled:opacity-45 cursor-pointer"
                    >
                      {isNetworkingMatching ? 'Scanning Conference vectors...' : 'Match Me with attendees'}
                    </button>
                  </div>
                </div>

                {networkingMatches.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <span className="block text-[10px] font-bold text-sky-850 uppercase tracking-wider">Top Recipient Matches</span>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {networkingMatches.map((nm, idx) => (
                        <div key={idx} className="rounded-xl border border-sky-150 bg-sky-50/40 p-3.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-850">{nm.name}</span>
                              <span className="rounded bg-sky-100 px-1 py-0.5 text-[9px] font-mono font-bold text-sky-850">
                                {nm.matchPercent}% Match
                              </span>
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-sans">{nm.sharedAIGround}</p>
                            <p className="mt-2 text-[10px] italic text-blue-700 font-semibold">{nm.suggestedKickers}</p>
                          </div>
                          
                          <a 
                            href={nm.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-1 rounded-lg bg-sky-600 py-1.5 font-heading text-[10px] font-bold text-white hover:bg-sky-700 transition-colors"
                          >
                            <Linkedin className="h-3 w-3" />
                            Exchange Handshake
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature 4: Live Event Pollings */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50/10 p-5">
                <h4 className="font-heading text-base font-bold text-rose-950 flex items-center gap-1.5 mb-1">
                  <BarChart3 className="h-4.5 w-4.5 text-rose-500" />
                  Live Event Audience Polls
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  Vote on live event questions and view poll dynamics live! (As a simulated user, you can also launch new interactive poll criteria below).
                </p>

                {/* Polls display */}
                <div className="space-y-4 mb-6">
                  {polls.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No active polls are streaming. Launch one below as organizer!</p>
                  ) : (
                    polls.map(poll => {
                      const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                      return (
                        <div key={poll.id} className="rounded-xl border border-rose-100/60 bg-white p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-slate-800">{poll.question}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold ${
                              poll.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {poll.active ? 'Active' : 'Closed'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {poll.options.map(opt => {
                              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={!poll.active}
                                  onClick={() => handleVote(poll.id, opt.id)}
                                  className="group relative w-full overflow-hidden rounded-lg border border-slate-105 p-2.5 text-left text-xs font-semibold cursor-pointer disabled:cursor-default"
                                >
                                  {/* Percentage background indicator */}
                                  <div 
                                    className="absolute inset-y-0 left-0 bg-rose-50 group-hover:bg-rose-100/60 transition-all duration-300" 
                                    style={{ width: `${pct}%`, zIndex: 0 }}
                                  />
                                  <div className="relative z-10 flex items-center justify-between pointer-events-none">
                                    <span className="text-slate-700">{opt.text}</span>
                                    <span className="font-mono text-slate-400 font-medium">
                                      {opt.votes} votes ({pct}%)
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Create poll box */}
                <form onSubmit={handleCreatePoll} className="space-y-3 border-t border-rose-100/50 pt-4">
                  <span className="block text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1">Launch New Interactive Poll</span>
                  <div>
                    <label className="block text-[10px] text-slate-500">Poll Question</label>
                    <input 
                      type="text" 
                      required
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      placeholder="Which technology are you scaling next year?"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">Option 1</label>
                      <input 
                        type="text" 
                        required
                        value={newPollOptions[0]}
                        onChange={(e) => setNewPollOptions([e.target.value, newPollOptions[1]])}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Option 2</label>
                      <input 
                        type="text" 
                        required
                        value={newPollOptions[1]}
                        onChange={(e) => setNewPollOptions([newPollOptions[0], e.target.value])}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isPollSubmitting}
                    className="rounded-xl bg-slate-900 px-4 py-2 font-heading text-xs font-bold text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Launch Interactive Poll
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: LIVE CHAT (Innovative feature 8) */}
          {activeTab === 'community' && (
            <div className="flex flex-col h-[400px]">
              
              {/* Chat messages layout list wrapper */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-4" id="chat-scroller">
                {chatList.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-8 rounded-xl border border-dashed text-slate-400 text-xs italic">
                    Welcome! Chat stream is empty. Say hello below to kickstart networking syncs.
                  </div>
                ) : (
                  chatList.map(msg => {
                    const isSelf = msg.sender.toLowerCase() === userName.toLowerCase();
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[80%] rounded-2xl p-3.5 ${
                          isSelf 
                            ? 'bg-blue-600 text-white rounded-tr-none self-end ml-auto' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none self-start mr-auto'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[10px] font-bold ${isSelf ? 'text-blue-100' : 'text-slate-500'}`}>
                            {msg.sender}
                          </span>
                          <span className={`font-mono text-[9px] ${isSelf ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed break-words">{msg.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input panel bar */}
              <form onSubmit={handleSendChat} className="shrink-0 flex gap-2 border-t border-slate-100 pt-3 bg-white">
                <input 
                  type="text"
                  required
                  value={chatMessageInput}
                  onChange={(e) => setChatMessageInput(e.target.value)}
                  placeholder="Ask hosts, share ideas, or coordinate meetup dinners..."
                  className="flex-1 border bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="flex h-10 w-11 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-slate-900 transition-colors cursor-pointer shadow-md"
                  id="send-chat-submit"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>
          )}

        </div>

        {/* Modal Sticky Footer checkouts */}
        <div className="border-t border-slate-150 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SECURE TICKETS AVAILABLE</span>
            <p className="font-heading text-lg font-bold text-slate-800">
              Multiple Ticket Tiers Available (VIP / Early Bird / Gen)
            </p>
          </div>
          
          <button
            onClick={onOpenCheckout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 px-6 font-heading text-sm font-bold text-white transition-all hover:bg-slate-950 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-blue-600/10"
            id="modal-checkout-trigger"
          >
            <span>Book & Register</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
