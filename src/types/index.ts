export type Role = "CUSTOMER" | "WORKER" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  avatarSeed: string;
  city: string;
  pincode: string;
  address: string;
  area: string;
  joinedAt: string;
  lastActiveAt: string;
  isOnline?: boolean;
}

export interface Customer extends User {
  role: "CUSTOMER";
  /** Short introduction shown to professionals before they accept a job. */
  bio?: string;
  totalBookings: number;
  totalSpent: number;
  savedAddresses: Address[];
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  area: string;
  city: string;
  pincode: string;
  landmark?: string;
}

export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WorkerDocument {
  id: string;
  type: "AADHAAR" | "PAN" | "VOTER_ID" | "ADDRESS_PROOF" | "PHOTO";
  number: string;
  uploadedAt: string;
  status: DocumentStatus;
  rejectionReason?: string;
}

export type Pricing = {
  visitCharge: number;
  startingPrice: number;
  hourlyPrice: number;
  minJobAmount: number;
};

export interface WeeklyAvailability {
  day: number; // 0 = Sunday
  enabled: boolean;
  start: string; // "09:00"
  end: string; // "19:00"
}

export interface Worker extends User {
  role: "WORKER";
  headline: string;
  about: string;
  categoryId: string;
  subcategoryIds: string[];
  serviceIds: string[];
  skills: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  cancelledJobs: number;
  verification: VerificationStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  pricing: Pricing;
  areas: string[];
  availability: WeeklyAvailability[];
  emergencyAvailable: boolean;
  languages: string[];
  documents: WorkerDocument[];
  blockedDates: string[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  order: number;
  subcategories: Subcategory[];
  createdAt: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  serviceCount: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  startingPrice: number;
  icon: string;
  isActive: boolean;
  workerCount: number;
  rating: number;
  /** One-line summary used in cards, search results and meta descriptions. */
  shortDescription: string;
  reviewCount: number;
  /** Bullets describing what the fixed price covers. */
  includes: string[];
  createdAt: string;
}

export type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "ON_THE_WAY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export type PaymentMethod = "UPI" | "CARD" | "CASH" | "WALLET";

export interface Booking {
  id: string;
  customerId: string;
  workerId: string | null;
  serviceId: string;
  categoryId: string;
  title: string;
  description: string;
  notes?: string;
  images: string[];
  address: {
    line1: string;
    area: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  isFlexible: boolean;
  status: BookingStatus;
  price: number;
  visitCharge: number;
  platformFee: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  timeline: { status: BookingStatus; at: string; note?: string }[];
  createdAt: string;
  cancelReason?: string;
  completionNote?: string;
  rating?: number;
  hasUnreadFromWorker?: boolean;
  workerEta?: number;
}

export interface Transaction {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  amount: number;
  platformFee: number;
  workerEarning: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  reference: string;
  invoiceNo: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  isHidden: boolean;
  reply?: string;
  helpfulCount: number;
}

export type NotificationCategory = "BOOKING" | "PAYMENT" | "WORKER" | "SYSTEM";

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  href?: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  workerId: string;
  bookingId?: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
  attachment?: { name: string; type: string };
}

export type ComplaintStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
export type ComplaintReason =
  | "QUALITY_ISSUE"
  | "NO_SHOW"
  | "OVERCHARGE"
  | "UNPROFESSIONAL"
  | "DAMAGE"
  | "OTHER";

export interface Complaint {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  reason: ComplaintReason;
  subject: string;
  customerStatement: string;
  workerStatement: string;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt?: string;
  adminNotes: { id: string; note: string; createdAt: string }[];
  attachments: string[];
  resolution?: string;
}

export interface PlatformSettings {
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  commissionPercent: number;
  gstPercent: number;
  minBookingAmount: number;
  autoVerifyWorkers: boolean;
  maintenanceMode: boolean;
  bookingWindowDays: number;
  notifications: {
    emailBookingUpdates: boolean;
    emailPromotions: boolean;
    smsBookingUpdates: boolean;
    pushEnabled: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeoutMinutes: number;
  };
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  service: string;
  avatarSeed: string;
}
