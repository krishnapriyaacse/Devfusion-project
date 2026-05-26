/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TicketType {
  id: string;
  name: string; // General Admission, VIP Experience, Early Bird Special
  price: number; // 0 for Free
  capacity: number;
  remainingCapacity: number;
}

export interface DiscountCode {
  code: string;
  discountPercent: number; // e.g. 25 for 25% off
  expiryDate: string; // ISO format
}

export interface Speaker {
  name: string;
  role: string;
  avatar: string;
}

export interface AgendaSession {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  text: string;
  date: string;
  linkedin?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  active: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  category: string; // e.g. Tech, Music, Arts, Food, Business, Sports
  description: string;
  bannerImage: string; // base64 or placeholder URL
  tickets: TicketType[];
  discounts: DiscountCode[];
  faq: { q: string; a: string }[];
  agenda: AgendaSession[];
  speakers: Speaker[];
  reviews: Review[];
  polls: Poll[];
  chat: ChatMessage[];
}

export interface PurchasedTicket {
  ticketTypeName: string;
  quantity: number;
  price: number;
}

export interface Registration {
  id: string; // Ticket confirmation number
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  attendeeName: string;
  attendeeEmail: string;
  linkedinUrl?: string; // opt-in
  ticketsPurchased: PurchasedTicket[];
  totalAmount: number;
  discountApplied?: string;
  qrCode: string; // Payload string
  checkedIn: boolean;
  checkedInAt?: string;
  badgeEarned?: string;
  refundRequested?: boolean;
  refundStatus?: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface UserProfile {
  email: string;
  name: string;
  linkedinUrl?: string;
  savedCategories: string[]; // For personalized advice/recommendation
  wishlistedEvents: string[]; // Event IDs
  attendedEventIds: string[]; // Event IDs
  badges: {
    name: string;
    description: string;
    icon: string;
    awardedAt: string;
  }[];
}

export interface PayoutStats {
  totalRevenue: number;
  payoutsCompleted: number;
  currentBalance: number;
  payoutsList: {
    id: string;
    amount: number;
    status: 'Pending' | 'Completed';
    date: string;
    bankAccount: string;
  }[];
}
