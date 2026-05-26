export interface User {
  id: string;
  email: string;
  name: string;
  role: 'organizer' | 'attendee';
  linkedin?: string;
  github?: string;
  portfolio?: string;
  interests?: string[];
  points?: number;
  badges?: string[];
  wishlist?: string[];
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  type: 'free' | 'paid' | 'vip' | 'early_bird';
  description: string;
}

export interface DiscountCode {
  code: string;
  discountPercent: number;
}

export interface AgendaItem {
  time: string;
  title: string;
  speaker: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  sentiment?: string; // positive, neutral, negative
  date: string;
}

export interface Poll {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
}

export interface QAItem {
  id: string;
  userId: string;
  userName: string;
  question: string;
  votes: number;
  answered: boolean;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  category: string;
  description: string;
  bannerImage: string;
  capacity: number;
  registeredCount: number;
  ticketTypes: TicketType[];
  discountCodesValue?: DiscountCode[];
  agenda: AgendaItem[];
  faq: FAQ[];
  speakers: Speaker[];
  liveAttendeeCount: number;
  checkIns: string[]; // list of userIds
  reviews: Review[];
  polls: Poll[];
  qa: QAItem[];
  smartSchedule?: string;
  organizerId: string;
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  tickets: {
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  bookingDate: string;
  status: 'confirmed' | 'refund_requested' | 'refunded';
  qrCode: string; // contains eventId:bookingId
  checkedIn: boolean;
}
