import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini Client initialized successfully on server side.");
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found, running AI features in fallback simulation mode.");
}

// Low-profile persistent database file
const DB_FILE = path.join(process.cwd(), "db.json");

// Define state interfaces
import { User, Event, Booking, Review, Poll, QAItem, TicketType } from "./src/types";

interface DBState {
  users: User[];
  events: Event[];
  bookings: Booking[];
}

// Initial default mock data
const INITIAL_STATE: DBState = {
  users: [
    {
      id: "org_1",
      email: "organizer@eventsphere.com",
      name: "Alex Johnson",
      role: "organizer",
      points: 250,
      badges: ["Master Host", "Trailblazer"]
    },
    {
      id: "user_1",
      email: "attendee@eventsphere.com",
      name: "Emma Watson",
      role: "attendee",
      linkedin: "https://linkedin.com/in/emma-watson-dev",
      github: "https://github.com/emma-watson",
      portfolio: "https://emmawatson.dev",
      interests: ["Tech & AI", "Music & Arts", "Green Tech"],
      points: 450,
      badges: ["Early Bird", "Explorer"]
    }
  ],
  events: [
    {
      id: "evt_1",
      name: "Global AI Founders Summit 2026",
      date: "2026-06-15",
      venue: "ITC Grand Chola, Chennai",
      category: "Tech & AI",
      description: "The ultimate gathering of AI researchers, developers, and product pioneers. Engage in hands-on workshops, keynotes, and a high-yield networking session designed to connect startups with leading global VCs.",
      bannerImage: "https://picsum.photos/seed/aisummit/800/400",
      capacity: 100,
      registeredCount: 42,
      ticketTypes: [
        { id: "t_1_1", name: "Early Bird", price: 49, type: "early_bird", description: "Discounted passes for early supporters." },
        { id: "t_1_2", name: "Regular Ticket", price: 99, type: "paid", description: "Standard conference access." },
        { id: "t_1_3", name: "VIP Pass", price: 249, type: "vip", description: "Access to private investor lounges and speaker dinners." }
      ],
      discountCodesValue: [
        { code: "AISUPER", discountPercent: 20 },
        { code: "FREEAI", discountPercent: 100 }
      ],
      agenda: [
        { time: "09:00 AM", title: "Registrations & Welcome Coffee", speaker: "Host Team", description: "Collect your custom badges and network over morning drinks." },
        { time: "10:00 AM", title: "Generative AI: The Next Decade", speaker: "Dr. Aris Vance", description: "Keynote exploring multimodal foundations, smart scaling, and physical agents." },
        { time: "11:30 AM", title: "Panel: Raising Capital in the AI Autumn", speaker: "Sonia Patel, VC", description: "Top tier investors explore funding realities and runway metrics." },
        { time: "02:00 PM", title: "Interactive Workshop: Multi-Agent Systems", speaker: "Lukas Graham", description: "Create coordinated multi-agent pipelines with local model hosting." }
      ],
      faq: [
        { question: "Is lunch provided?", answer: "Yes, standard and premium vegan lunch options are included with standard and VIP tickets." },
        { question: "Can I join virtually?", answer: "This is a strictly on-premise event, but full session recordings will be emailed to VIPs." }
      ],
      speakers: [
        { id: "spk_1", name: "Dr. Aris Vance", role: "AI Research Lead at NeuralLabs", bio: "Leading neural foundations, author of 40+ publications on cognitive architectures." },
        { id: "spk_2", name: "Sonia Patel", role: "Partner at Sequoia Ventures", bio: "Specializing in early-stage Deep Tech investments with 15 successful checkouts." }
      ],
      liveAttendeeCount: 0,
      checkIns: [],
      reviews: [
        { id: "rev_1", userId: "user_1", userName: "Emma Watson", rating: 5, comment: "Absolutely marvelous conference. The panels were pragmatic and helpful, and the networking opportunities felt very organic!", sentiment: "Positive", date: "2026-05-16T10:00:00Z" }
      ],
      polls: [
        { id: "poll_1", question: "Which AI field holds the greatest commercial potential in 2026?", options: [
          { id: "o_1", text: "Autonomous Agents", votes: 24 },
          { id: "o_2", text: "Multimodal Generation", votes: 15 },
          { id: "o_3", text: "AI-aided Material Science", votes: 12 }
        ]}
      ],
      qa: [
        { id: "qa_1", userId: "user_1", userName: "Emma Watson", question: "Will the workshop code repository be open-sourced after the session?", votes: 8, answered: true }
      ],
      smartSchedule: "Suggested personalized layout:\n- Morning track focuses on venture strategy\n- Afternoon track centers on technical engineering labs.",
      organizerId: "org_1"
    },
    {
      id: "evt_2",
      name: "Symphony Under the Stars",
      date: "2026-07-20",
      venue: "Central Park Amphitheater, New York",
      category: "Music & Arts",
      description: "A classical evening of Mozart, Bach, and Vivaldi outdoors under the high summer sky. Bring your own picnic basket or enjoy our catering options from Michelin-starred local food trucks.",
      bannerImage: "https://picsum.photos/seed/symphony/800/400",
      capacity: 500,
      registeredCount: 150,
      ticketTypes: [
        { id: "t_2_1", name: "Regular Admission", price: 30, type: "paid", description: "Lawn seating, bring your blankets." },
        { id: "t_2_2", name: "VIP Dining Experience", price: 120, type: "vip", description: "Front rows seat with custom premium cheese and wine platter." }
      ],
      discountCodesValue: [
        { code: "MUSIC10", discountPercent: 10 }
      ],
      agenda: [
        { time: "06:30 PM", title: "Gates Open & Dining", speaker: "Gourmet Trucks", description: "Select your food and claim a nice spot on the grand lawn." },
        { time: "07:30 PM", title: "Act I: Vivaldi’s Four Seasons", speaker: "Manhattan Philharmonic", description: "A gorgeous arrangement by conductor Alan Sterling." },
        { time: "08:45 PM", title: "Act II: Mozart’s Symphony No. 40", speaker: "Manhattan Philharmonic", description: "The soaring centerpiece of our outdoor recital." }
      ],
      faq: [
        { question: "What if it rains?", answer: "In case of rain, the concert shifts immediately to the adjacent indoor Grand Glass Atrium." }
      ],
      speakers: [
        { id: "spk_3", name: "Alan Sterling", role: "Conductor", bio: "Renowned conductor celebrating 25 seasons with Manhattan Philharmonic." }
      ],
      liveAttendeeCount: 0,
      checkIns: [],
      reviews: [],
      polls: [],
      qa: [],
      organizerId: "org_1"
    },
    {
      id: "evt_3",
      name: "Sustainable Tech Hackathon 2026",
      date: "2026-08-10",
      venue: "IIT Madras Research Park, Chennai",
      category: "Green Tech",
      description: "Collaborate, code, and design low-carbon software solutions. Solve real-world climate problems and compete for $15,000 in non-dilutive grant prizes.",
      bannerImage: "https://picsum.photos/seed/green/800/400",
      capacity: 120,
      registeredCount: 8,
      ticketTypes: [
        { id: "t_3_1", name: "Free Hackathon Ticket", price: 0, type: "free", description: "Standard pass including all meals, team matching, and access to mentorship." }
      ],
      agenda: [
        { time: "09:00 AM", title: "Idea Pitching & Team Formations", speaker: "Mentor Panel", description: "Pitch your ideas and find talented team members." }
      ],
      faq: [
        { question: "Do I need a pre-formed team?", answer: "No, most attendees form teams during the opening breakfast matching session." }
      ],
      speakers: [
        { id: "spk_4", name: "Prof. S. Prasad", role: "Ecolabs India Founder", bio: "Pioneering researcher in high-efficiency grid software and local circular solutions." }
      ],
      liveAttendeeCount: 0,
      checkIns: [],
      reviews: [],
      polls: [],
      qa: [],
      organizerId: "org_1"
    }
  ],
  bookings: [
    {
      id: "b_101",
      userId: "user_1",
      eventId: "evt_1",
      eventName: "Global AI Founders Summit 2026",
      eventDate: "2026-06-15",
      eventVenue: "ITC Grand Chola, Chennai",
      tickets: [
        { ticketTypeId: "t_1_2", ticketTypeName: "Regular Ticket", quantity: 2, price: 99 }
      ],
      totalAmount: 198,
      bookingDate: "2026-05-20T12:00:00Z",
      status: "confirmed",
      qrCode: "evt_1:b_101",
      checkedIn: false
    }
  ]
};

// Database utility
function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading database file, using defaults:", error);
  }
  return INITIAL_STATE;
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database file:", error);
  }
}

// In-Memory cache of State
let dbState = loadDB();

// Sync in case DB gets updated or initially created
if (!fs.existsSync(DB_FILE)) {
  saveDB(dbState);
}

// --- AUTH ENDPOINTS ---
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, interests, linkedin, github, portfolio } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required register parameters." });
  }

  const existing = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "A user with this email already exists." });
  }

  const newUser: User = {
    id: `u_${Date.now()}`,
    email,
    name,
    role,
    linkedin: linkedin || "",
    github: github || "",
    portfolio: portfolio || "",
    interests: interests || ["Tech & AI"],
    points: 100, // starting points
    badges: ["Novice Explorer"]
  };

  dbState.users.push(newUser);
  saveDB(dbState);
  res.status(201).json({ message: "Registration successful!", user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Standard development sandbox credentials checking
  const user = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No user found with this email." });
  }

  // dev sandbox permits any password
  res.json({ message: "Welcome back!", user });
});

// Update profile details, networking cards, etc.
app.post("/api/auth/update-profile", (req, res) => {
  const { id, linkedin, github, portfolio, interests } = req.body;
  const userIndex = dbState.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found." });
  }

  dbState.users[userIndex].linkedin = linkedin;
  dbState.users[userIndex].github = github;
  dbState.users[userIndex].portfolio = portfolio;
  dbState.users[userIndex].interests = interests;

  saveDB(dbState);
  res.json({ message: "Profile card updated successfully!", user: dbState.users[userIndex] });
});

// Leaders leaderboard
app.get("/api/users/leaderboard", (req, res) => {
  const leaders = dbState.users
    .map(u => ({ id: u.id, name: u.name, points: u.points || 0, badges: u.badges || [] }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  res.json(leaders);
});

// --- EVENT MANAGEMENT ENDPOINTS ---
app.get("/api/events", (req, res) => {
  res.json(dbState.events);
});

app.get("/api/events/:id", (req, res) => {
  const event = dbState.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  res.json(event);
});

// Create event (Organizer only)
app.post("/api/events", (req, res) => {
  const {
    name, date, venue, category, description, bannerImage, capacity,
    ticketTypes, discountCodesValue, agenda, faq, speakers, organizerId
  } = req.body;

  if (!name || !date || !venue || !category || !description || !organizerId) {
    return res.status(400).json({ error: "Missing required event fields." });
  }

  const newEvent: Event = {
    id: `evt_${Date.now()}`,
    name,
    date,
    venue,
    category,
    description,
    bannerImage: bannerImage || `https://picsum.photos/seed/event-${Date.now()}/800/400`,
    capacity: Number(capacity) || 100,
    registeredCount: 0,
    ticketTypes: ticketTypes || [
      { id: `t_${Date.now()}_1`, name: "General Admission", price: 0, type: "free", description: "Standard free pass." }
    ],
    discountCodesValue: discountCodesValue || [],
    agenda: agenda || [],
    faq: faq || [],
    speakers: speakers || [],
    liveAttendeeCount: 0,
    checkIns: [],
    reviews: [],
    polls: [],
    qa: [],
    organizerId
  };

  // Give points to organizer on hosting event
  const userIndex = dbState.users.findIndex(u => u.id === organizerId);
  if (userIndex !== -1) {
    const points = dbState.users[userIndex].points || 0;
    dbState.users[userIndex].points = points + 200;
    const currentBadges = dbState.users[userIndex].badges || [];
    if (!currentBadges.includes("Super Host")) {
      dbState.users[userIndex].badges = [...currentBadges, "Super Host"];
    }
  }

  dbState.events.unshift(newEvent);
  saveDB(dbState);
  res.status(201).json({ message: "Event created successfully!", event: newEvent });
});

// Delete event logic
app.delete("/api/events/:id", (req, res) => {
  const index = dbState.events.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }
  
  dbState.events.splice(index, 1);
  saveDB(dbState);
  res.json({ message: "Event removed successfully." });
});

// Live session operations: POST POLL
app.post("/api/events/:eventId/polls", (req, res) => {
  const { question, options } = req.body;
  const event = dbState.events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const newPoll: Poll = {
    id: `poll_${Date.now()}`,
    question,
    options: options.map((opt: string, idx: number) => ({ id: `o_${idx}_${Date.now()}`, text: opt, votes: 0 }))
  };

  event.polls = event.polls || [];
  event.polls.push(newPoll);
  saveDB(dbState);
  res.status(201).json(newPoll);
});

// Live session operations: VOTE POLL
app.post("/api/events/:eventId/polls/:pollId/vote", (req, res) => {
  const { optionId } = req.body;
  const event = dbState.events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(444).json({ error: "Event not found" });

  const poll = event.polls?.find(p => p.id === req.params.pollId);
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  const option = poll.options.find(o => o.id === optionId);
  if (option) {
    option.votes += 1;
    saveDB(dbState);
    return res.json({ success: true, poll });
  }

  res.status(400).json({ error: "Option not found" });
});

// Live Q&A operations: ASK QUESTION
app.post("/api/events/:eventId/qa", (req, res) => {
  const { userId, userName, question } = req.body;
  const event = dbState.events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const newQA: QAItem = {
    id: `qa_${Date.now()}`,
    userId,
    userName,
    question,
    votes: 1,
    answered: false
  };

  event.qa = event.qa || [];
  event.qa.push(newQA);
  saveDB(dbState);
  res.status(201).json(newQA);
});

// Live Q&A: UPVOTE QUESTION
app.post("/api/events/:eventId/qa/:qaId/vote", (req, res) => {
  const event = dbState.events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const qaItem = event.qa?.find(q => q.id === req.params.qaId);
  if (qaItem) {
    qaItem.votes += 1;
    saveDB(dbState);
    return res.json({ success: true, qaItem });
  }

  res.status(400).json({ error: "Q&A item not found" });
});

// Live Q&A: MARK ANSWERED (Organizer)
app.post("/api/events/:eventId/qa/:qaId/answer", (req, res) => {
  const event = dbState.events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const qaItem = event.qa?.find(q => q.id === req.params.qaId);
  if (qaItem) {
    qaItem.answered = true;
    saveDB(dbState);
    return res.json({ success: true, qaItem });
  }

  res.status(400).json({ error: "Q&A item not found" });
});

// --- TICKETS AND BOOKING ENDPOINTS ---
app.post("/api/bookings", (req, res) => {
  const { userId, eventId, tickets, discountCode, totalAmount } = req.body;

  const event = dbState.events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  let totalTickets = 0;
  tickets.forEach((t: any) => {
    totalTickets += t.quantity;
  });

  if (event.registeredCount + totalTickets > event.capacity) {
    return res.status(400).json({ error: "This booking exceeds the maximum remaining event seats." });
  }

  const bookingId = `b_${Date.now()}`;
  const newBooking: Booking = {
    id: bookingId,
    userId,
    eventId,
    eventName: event.name,
    eventDate: event.date,
    eventVenue: event.venue,
    tickets,
    totalAmount: Number(totalAmount) || 0,
    bookingDate: new Date().toISOString(),
    status: "confirmed",
    qrCode: `evt_id:${eventId}|booking_id:${bookingId}`,
    checkedIn: false
  };

  // Adjust statistics & registers
  event.registeredCount += totalTickets;

  // Award gamified points for booking
  const userIdx = dbState.users.findIndex(u => u.id === userId);
  if (userIdx !== -1) {
    const currentPoints = dbState.users[userIdx].points || 0;
    dbState.users[userIdx].points = currentPoints + 150;
    
    const badges = dbState.users[userIdx].badges || [];
    if (!badges.includes("Loyal Fan") && dbState.bookings.filter(b => b.userId === userId).length >= 2) {
      dbState.users[userIdx].badges = [...badges, "Loyal Fan"];
    }
  }

  dbState.bookings.push(newBooking);
  saveDB(dbState);
  res.status(201).json({ message: "Booking confirmed!", booking: newBooking });
});

app.get("/api/bookings", (req, res) => {
  const userId = req.query.userId as string;
  if (userId) {
    const userBookings = dbState.bookings.filter(b => b.userId === userId);
    return res.json(userBookings);
  }
  res.json(dbState.bookings);
});

app.post("/api/bookings/:id/refund", (req, res) => {
  const booking = dbState.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  booking.status = "refund_requested";
  saveDB(dbState);
  res.json({ message: "Refund requested successfully. Subject to organizer approval.", booking });
});

app.post("/api/bookings/:id/approve-refund", (req, res) => {
  const booking = dbState.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  booking.status = "refunded";

  // Re-adjust seating
  const event = dbState.events.find(e => e.id === booking.eventId);
  if (event) {
    const totalTickets = booking.tickets.reduce((sum, t) => sum + t.quantity, 0);
    event.registeredCount = Math.max(0, event.registeredCount - totalTickets);
  }

  saveDB(dbState);
  res.json({ message: "Refund request approved & seats released.", booking });
});

// Manual / QR simulation checkin
app.post("/api/bookings/:id/checkin", (req, res) => {
  const booking = dbState.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  if (booking.checkedIn) {
    return res.status(400).json({ error: "Ticket has already been verified and checked-in!" });
  }

  booking.checkedIn = true;
  
  const event = dbState.events.find(e => e.id === booking.eventId);
  if (event) {
    event.liveAttendeeCount = (event.liveAttendeeCount || 0) + booking.tickets.reduce((sum, t) => sum + t.quantity, 0);
    event.checkIns = event.checkIns || [];
    if (!event.checkIns.includes(booking.userId)) {
      event.checkIns.push(booking.userId);
    }
  }

  // Award gamified points for checkin
  const userIdx = dbState.users.findIndex(u => u.id === booking.userId);
  if (userIdx !== -1) {
    const currentPoints = dbState.users[userIdx].points || 0;
    dbState.users[userIdx].points = currentPoints + 200; // Attendee rewards
    const badges = dbState.users[userIdx].badges || [];
    if (!badges.includes("Seminar Star")) {
      dbState.users[userIdx].badges = [...badges, "Seminar Star"];
    }
  }

  saveDB(dbState);
  res.json({ message: "Check-in successful! Points awarded.", booking });
});

// --- FEEDBACKS AND REVIEWS WITH SENTIMENT ANALYSIS ---
app.post("/api/events/:eventId/reviews", async (req, res) => {
  const { userId, userName, rating, comment } = req.body;
  if (!userId || !userName || !rating || !comment) {
    return res.status(400).json({ error: "Missing required content for review." });
  }

  const event = dbState.events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  let sentiment = "Neutral";
  
  if (ai) {
    // Run real Gemini Sentiment Analysis on the feedback
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the sentiment of this event review. Classify it strictly as one of: "Positive", "Neutral", "Negative". Promptly explain in 5-10 words. Review: "${comment}"`,
        config: {
          temperature: 0.1,
        }
      });
      const aiText = response.text || "";
      if (aiText.toLowerCase().includes("positive")) {
        sentiment = "Positive";
      } else if (aiText.toLowerCase().includes("negative")) {
        sentiment = "Negative";
      }
    } catch (err) {
      console.error("Gemini sentiment analysis failed, falling back.", err);
    }
  } else {
    // Simple mock classification to ensure offline behaves nicely
    const posIndicators = ["good", "great", "excellent", "awesome", "perfect", "marvelous", "love", "best"];
    const negIndicators = ["bad", "poor", "worst", "unhappy", "waste", "disappointed", "slow", "loud"];
    const textLower = comment.toLowerCase();
    if (posIndicators.some(w => textLower.includes(w))) sentiment = "Positive";
    else if (negIndicators.some(w => textLower.includes(w))) sentiment = "Negative";
  }

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    userId,
    userName,
    rating: Number(rating),
    comment,
    sentiment,
    date: new Date().toISOString()
  };

  // Give attendee points for leaving feedback
  const userIdx = dbState.users.findIndex(u => u.id === userId);
  if (userIdx !== -1) {
    const currentPoints = dbState.users[userIdx].points || 0;
    dbState.users[userIdx].points = currentPoints + 50;
  }

  event.reviews = event.reviews || [];
  event.reviews.push(newReview);
  saveDB(dbState);
  res.status(201).json({ message: "Review posted!", review: newReview });
});

// --- ORGANIZER STATISTICS & PAYOUTS ---
app.get("/api/organizer/stats", (req, res) => {
  const orgId = req.query.organizerId as string;
  if (!orgId) return res.status(400).json({ error: "Organizer id is required." });

  const orgEvents = dbState.events.filter(e => e.organizerId === orgId);
  
  let totalRevenue = 0;
  let totalRegistrations = 0;
  let totalCheckins = 0;
  
  orgEvents.forEach(evt => {
    totalRegistrations += evt.registeredCount || 0;
    totalCheckins += evt.checkIns?.length || 0;
    
    // Find all bookings for this event to calculate revenue safely
    const eventBookings = dbState.bookings.filter(b => b.eventId === evt.id && b.status !== 'refunded');
    eventBookings.forEach(book => {
      totalRevenue += book.totalAmount || 0;
    });
  });

  res.json({
    revenue: totalRevenue,
    registrations: totalRegistrations,
    checkins: totalCheckins,
    eventsCount: orgEvents.length,
    payoutSimulate: totalRevenue * 0.95 // 5% fee
  });
});

// --- AI INTELLIGENT ROUTINGS ---

// Generate descriptions from bullet points
app.post("/api/ai/generate-description", async (req, res) => {
  const { bullets, title } = req.body;
  if (!bullets) return res.status(400).json({ error: "Bullets list is required." });

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Given the event title "${title || "EventSphere special event"}" and these quick bullet points:\n${bullets}\n\nGenerate an outstanding, highly engaging, and professionally polished event invitation marketing description. Use standard, engaging paragraphs and avoid technical system metadata. Keep it under 150 words.`,
      });
      return res.json({ description: response.text });
    } catch (err: any) {
      console.error("Gemini description generation failed:", err);
      return res.status(500).json({ error: err.message || "Desc failure" });
    }
  }

  // Simulation Fallback
  const fallback = `Welcome to our stellar event "${title || "EventSphere special event"}". Handcrafted to explore cutting-edge solutions, this event coordinates hands-on labs and deep networking opportunities. Highlight points: ${bullets}. Don't miss this opportunity to connect with pioneers in the ecosystem and accelerate your scaling goals.`;
  res.json({ description: fallback });
});

// Suggest multi-session smart schedule agenda
app.post("/api/ai/generate-schedule", async (req, res) => {
  const { title, category, description } = req.body;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a professional 3-session timeline schedule with precise hours, engaging session titles and speaker profiles matching an event named "${title}" of category "${category}". Description Context: "${description}". Format beautifully.`,
      });
      return res.json({ schedule: response.text });
    } catch (err) {
      console.error("Gemini schedule matching failed:", err);
    }
  }

  const fallback = `Suggested Schedule:\n- 10:00 AM - 11:30 AM: Kickoff Keynote & Ecosystem Trends\n- 11:45 AM - 01:15 PM: Expert Panel & Live Sandbox Interactive Session\n- 02:30 PM - 04:00 PM: Founders Roundtables & VIP Payout Ceremony`;
  res.json({ schedule: fallback });
});

// Recommend events based on attendee interests and past history
app.post("/api/ai/recommend", async (req, res) => {
  const { interests, attendedCategories } = req.body;
  const events = dbState.events;

  if (ai) {
    try {
      const prompt = `Recommend from the following structured events list the best matches for an attendee who has listed interests: ${JSON.stringify(interests)} and has historical category interest: ${JSON.stringify(attendedCategories)}.
      Available Events JSON list: ${JSON.stringify(events.map(e => ({ id: e.id, name: e.name, category: e.category, description: e.description })))}.
      Give your recommendation list in simple JSON array format, explaining why each is recommended. Format matches: [{"eventId": "evt_1", "reason": "Recommended because..."}]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                eventId: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["eventId", "reason"]
            }
          }
        }
      });
      
      return res.send(response.text);
    } catch (e) {
      console.error("Gemini recommendation system error:", e);
    }
  }

  // Dumb matching fallback
  const list = interests || ["Tech & AI"];
  const matches = events.map(e => {
    const matched = list.some((interest: string) => e.category.toLowerCase().includes(interest.toLowerCase()) || e.name.toLowerCase().includes(interest.toLowerCase()));
    return {
      eventId: e.id,
      reason: matched ? `Recommended because you have high interests in ${e.category}.` : "Recommended as a featured global highlight event."
    };
  });
  res.json(matches);
});

// AI Chatbot agent support
app.post("/api/ai/chatbot", async (req, res) => {
  const { message, history, context } = req.body;

  let prompt = `You are "SphereBot", the resident helpful smart guide for EventSphere. You support both creators and attendees with navigation, troubleshooting, ticketing issues, refunds, and event details.

  System context regarding existing platform events: ${JSON.stringify(dbState.events.map(e => ({ name: e.name, date: e.date, venue: e.venue, category: e.category, tickets: e.ticketTypes })))}.
  Also, explain standard details to users: Refund requests go to organizers, tickets are QR-based and verified instantly at the gates, attending gains people points (150 for buying, 200 for checking-in, 50 for leaving reviews).

  User inquiry: "${message}"`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      return res.json({ reply: response.text });
    } catch (err) {
      console.error("Gemini Chat bot error:", err);
    }
  }

  // Simulation response fallback
  let reply = "Hello! I am SphereBot, your AI Assistant. Currently performing local lookups. You can ask me anything about the event, ticketing policies, or points. Refund requests are submitted directly under your tickets panel in real-time, and you score 200 extra points for checking-in!";
  if (message.toLowerCase().includes("refund")) {
    reply = "Attendees can open the 'My Tickets' dashboard tab next to any booked event ticket and click 'Request Refund'. The seat is put in pending and can be approved instantly by the organizer on their stats panel.";
  } else if (message.toLowerCase().includes("certificate")) {
    reply = "After you have been checked-in by the organizer at the venue (which you can do using our Manual QR checkin simulation panel), a beautiful verification certificate of participation with active QR security is unlocked automatically in your attendee dashboard.";
  } else if (message.toLowerCase().includes(" चेन्नई") || message.toLowerCase().includes("chennai")) {
    reply = "We currently have: 'Global AI Founders Summit 2026' taking place at ITC Grand Chola, Chennai on June 15, and 'Sustainable Tech Hackathon 2026' taking place at IIT Madras Research Park. Both offer exciting points!";
  }
  res.json({ reply });
});

// --- PRODUCTION BUILD MIDDLEWARES ---
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development full-stack server listening at http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Live production web container starting on port ${PORT}`);
  });
}
