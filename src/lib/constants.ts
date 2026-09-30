export const APP_NAME = "KaamWala";
export const APP_TAGLINE = "Har Kaam Ka Bharosemand Saathi";

export const CITIES = [
  "Indore",
  "Bhopal",
  "Ujjain",
  "Delhi",
  "Mumbai",
  "Pune",
  "Jaipur",
  "Ahmedabad",
] as const;

export const AREAS: Record<string, string[]> = {
  Indore: ["Vijay Nagar", "Palasia", "Rau", "Bhawarkuan", "Rajwada", "Nipania", "Talawali Chanda", "Sukhdevpur"],
  Bhopal: ["MP Nagar", "Arera Colony", "Kolar", "New Market", "Bittan Market", "Shahpura", "Govindpura"],
  Ujjain: ["Freemans Park", "Nanakheda", "Shivpuri", "Varuna", "Kshipra", "Dewas Gate"],
  Delhi: ["Lajpat Nagar", "Rohini", "Dwarka", "Saket", "Karol Bagh", "Pitampura", "Janakpuri"],
  Mumbai: ["Andheri", "Bandra", "Powai", "Dadar", "Thane", "Kurla", "Malad"],
  Pune: ["Kothrud", "Hinjewadi", "Aundh", "Viman Nagar", "Baner", "Koregaon Park"],
  Jaipur: ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar", "Raja Park", "Jhotwara"],
  Ahmedabad: ["Satellite", "Prahlad Nagar", "Maninagar", "Navrangpura", "Thaltej", "Bopal"],
};

export const STATES: Record<string, string> = {
  Indore: "Madhya Pradesh",
  Bhopal: "Madhya Pradesh",
  Ujjain: "Madhya Pradesh",
  Delhi: "Delhi",
  Mumbai: "Maharashtra",
  Pune: "Maharashtra",
  Jaipur: "Rajasthan",
  Ahmedabad: "Gujarat",
};

export const PLATFORM_COMMISSION_DEFAULT = 10;

export const BOOKING_STATUS_FLOW = [
  "REQUESTED",
  "ACCEPTED",
  "CONFIRMED",
  "ON_THE_WAY",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  CONFIRMED: "Confirmed",
  ON_THE_WAY: "On the way",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  RESOLVED: "Resolved",
};

export const DEMO_ACCOUNTS = [
  {
    role: "CUSTOMER" as const,
    email: "customer@kaamwala.com",
    password: "customer123",
    label: "Customer",
    name: "Aarav Sharma",
    description: "Browse services, book workers, track jobs",
  },
  {
    role: "WORKER" as const,
    email: "worker@kaamwala.com",
    password: "worker123",
    label: "Worker",
    name: "Rajesh Kumar",
    description: "Accept requests, manage jobs and earnings",
  },
  {
    role: "ADMIN" as const,
    email: "admin@kaamwala.com",
    password: "admin123",
    label: "Admin",
    name: "KaamWala Admin",
    description: "Manage the entire marketplace",
  },
];

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Rating" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Distance" },
] as const;

export const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
] as const;

export const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI", description: "GPay, PhonePe, Paytm" },
  { value: "CARD", label: "Card", description: "Visa, Mastercard, RuPay" },
  { value: "WALLET", label: "KaamWala wallet", description: "Balance available" },
  { value: "CASH", label: "Cash", description: "Pay after the work is done" },
] as const;
