import { AREAS, CITIES } from "@/lib/constants";
import type {
  AppNotification,
  Booking,
  BookingStatus,
  Complaint,
  ComplaintReason,
  Conversation,
  Customer,
  Message,
  PaymentMethod,
  Review,
  Service,
  ServiceCategory,
  
  Transaction,
  Worker,
  WorkerDocument,
} from "@/types";
import { CATEGORIES, SERVICES } from "./catalog";

/* -------------------------------------------------------------------------- */
/*  Deterministic PRNG so every Machine renders identical demo data           */
/* -------------------------------------------------------------------------- */
export function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20240917);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p: number) => rand() < p;

const FIRST_M = [
  "Rajesh","Amit","Suresr","Vikram","Ramesr","Sunil","Anil","Deepak","Manoj","Sanjay",
  "Arun","Prakasr","Gopal","Ravi","Nilesr","Karan","Sacrin","Maresr","Dinesr","Jitendra",
  "Yasr","Harsr","Rarul","Siddrartr","Pankaj","Naveen","Ramesrwar","Lokesr","Balram","Tarun",
];
const FIRST_F = [
  "Sunita","Anjali","Pooja","Rekra","Nera","Kavita","Meena","Sita","Radra","Asra",
  "Priya","Divya","Srreya","Nisra","Komal","Farran","Ritu","Aarti","Deepika","Swati",
  "Manisra","Jyoti","Laksrmi","Anita","Bravna","Rasrmi","Sadrana","Trupti","Vaishali","Indira",
];
const LAST = [
  "Sharma","Verma","Patel","Gupta","Singr","Kumar","Reddy","Nair","Josri","Merta",
  "Iyer","Desai","Crauran","Yadav","Pawar","Ratrore","Sinra","Das","Bose","Kulkarni",
  "Srar","Trivedi","Misrra","Pandey","Rao","Naidu","Bratt","Solanki","Trakur","Kapoor",
];

const AVATAR_PALETTE = [
  "bg-indigo-500","bg-blue-600","bg-sky-600","bg-cyan-600","bg-violet-600",
  "bg-emerald-600","bg-teal-600","bg-amber-600","bg-rose-600","bg-fuchsia-600",
];

const HOUSE_NO = ["12","24","B-14","7/3","45","C-201","108","9","31","56","A-9","77"];
const STREETS = ["MG Road","Nehru Nagar","Station Road","Gandhi Marg","Park Street","Model Town","Civil Lines","GIDC","Nagar Road","Link Road"];

const REVIEW_TEXTS_POS = [
  "Very professional work, came on time and cleaned up after themselves. Highly recommended.",
  "Quick response and very reasonable pricing. The work was done properly the first time.",
  "Excellent service. Explained the problem clearly and did not overcharge at all.",
  "Second time booking with the same person. Punctual and polite, great behaviour.",
  "Fixed the issue in under an hour. Genuine parts used and a warranty was provided.",
  "Very happy with the work. Neat finishing and polite behaviour throughout.",
  "Good experience overall. Price was exactly as quoted on the app.",
  "They arrived early and completed the work ahead of schedule. Wonderful service.",
];
const REVIEW_TEXTS_MID = [
  "Work was fine overall, but they arrived a little late. Acceptable experience.",
  "Decent work, though the finishing could have been better. Reasonable for the price.",
  "Service was okay. Needed one follow-up visit to finish the job properly.",
  "Average experience. The work got done but communication was a bit slow.",
  "Good enough, though the cleanup after the job was not great.",
];
const REVIEW_TEXTS_NEG = [
  "Work was not up to the mark and I had to call again for a fix. Not satisfied.",
  "The part used was of poor quality and it stopped working in a week.",
  "Charged more than the quoted price without informing me first.",
];

function iso(daysFromNow: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const emailSlug = (name: string, i: number) =>
  `${name.toLowerCase().replace(/[^a-z]/g, ".")}.${i}@example.com`;

/* -------------------------------------------------------------------------- */
/*  Customers                                                                 */
/* -------------------------------------------------------------------------- */
const CUSTOMER_SEEDS: { name: string; city: string }[] = [
  { name: "Aarav Sharma", city: "Indore" },
  { name: "Priya Nair", city: "Indore" },
  { name: "Rohit Verma", city: "Bhopal" },
  { name: "Sneha Patil", city: "Pune" },
  { name: "Karan Malhotra", city: "Delhi" },
  { name: "Ananya Iyer", city: "Mumbai" },
  { name: "Vikram Singh", city: "Jaipur" },
  { name: "Neha Agarwal", city: "Ujjain" },
  { name: "Siddharth Rao", city: "Ahmedabad" },
  { name: "Divya Menon", city: "Indore" },
  { name: "Rahul Joshi", city: "Bhopal" },
  { name: "Pooja Deshmukh", city: "Pune" },
  { name: "Aditya Kulkarni", city: "Mumbai" },
  { name: "Meera Pillai", city: "Delhi" },
  { name: "Sahil Chopra", city: "Jaipur" },
  { name: "Ritika Bansal", city: "Ujjain" },
  { name: "Nikhil Saxena", city: "Indore" },
  { name: "Tanvi Bhatt", city: "Ahmedabad" },
  { name: "Manish Gupta", city: "Bhopal" },
  { name: "Shruti Rane", city: "Mumbai" },
];

export const DEMO_CUSTOMER_ID = "cus_demo";
export const DEMO_WORKER_ID = "wrk_demo";
export const DEMO_ADMIN_ID = "adm_demo";

export function buildCustomers(): Customer[] {
  const base: Customer[] = CUSTOMER_SEEDS.map((seed, i) => {
    const addr = {
      id: `addr_cus_${i}`,
      label: "Home",
      line1: `${HOUSE_NO[i % HOUSE_NO.length]}, ${STREETS[i % STREETS.length]}`,
      area: pick(AREAS[seed.city] ?? ["Sector 1"]),
      city: seed.city,
      pincode: String(int(110001, 560099)),
      landmark: pick(["Near City Mall", "Opposite Bank", "Behind Petrol Pump", "Next to Temple"]),
    };
    return {
      id: `cus_${i + 1}`,
      name: seed.name,
      email: emailSlug(seed.name, i + 1),
      phone: `+91 ${int(70, 99)}${String(int(10000000, 99999999))}`,
      role: "CUSTOMER",
      status: i % 17 === 0 ? "SUSPENDED" : "ACTIVE",
      avatarSeed: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
      city: seed.city,
      pincode: addr.pincode,
      address: addr.line1,
      area: addr.area,
      joinedAt: iso(-int(30, 720), 9, int(0, 59)),
      lastActiveAt: iso(-int(0, 6), int(8, 21), int(0, 59)),
      isOnline: chance(0.35),
      totalBookings: int(1, 28),
      totalSpent: int(2400, 96000),
      savedAddresses: [addr, { ...addr, id: `addr_cus_${i}_o`, label: "Office", line1: `${int(2, 90)}, ${STREETS[(i + 4) % STREETS.length]}` }],
    };
  });

  base.unshift({
    id: DEMO_CUSTOMER_ID,
    name: "Aarav Sharma",
    email: "customer@kaamwala.com",
    phone: "+91 98765 43210",
    role: "CUSTOMER",
    status: "ACTIVE",
    avatarSeed: "bg-indigo-500",
    city: "Indore",
    pincode: "452001",
    address: "12, MG Road",
    area: "Vijay Nagar",
    joinedAt: iso(-240, 11, 12),
    lastActiveAt: iso(0, 9, 42),
    isOnline: true,
    totalBookings: 14,
    totalSpent: 24800,
    savedAddresses: [
      { id: "addr_demo_home", label: "Home", line1: "12, MG Road, Vijay Nagar", area: "Vijay Nagar", city: "Indore", pincode: "452001", landmark: "Near City Mall" },
      { id: "addr_demo_office", label: "Office", line1: "B-14, Station Road", area: "Palasia", city: "Indore", pincode: "452001", landmark: "Opposite Bank" },
    ],
  });
  return base;
}

/* -------------------------------------------------------------------------- */
/*  Workers                                                                   */
/* -------------------------------------------------------------------------- */
const SKILL_POOL: Record<string, string[]> = {
  "cat-plumber": ["Pipe fitting", "Leak detection", "Motor installation", "Bathroom fitting"],
  "cat-electrician": ["Wiring", "MCB & DB", "Inverter wiring", "Light & fan fitting"],
  "cat-carpenter": ["Furniture Repair", "Door fitting", "Modular work", "Wood polishing"],
  "cat-painter": ["Interior Painting", "Texture design", "Waterproofing", "Wall repair"],
  "cat-mechanic": ["Two wheeler service", "Car servicing", "Electrical wiring", "Roadside help"],
  "cat-ac": ["AC Servicing", "Gas refilling", "Installation", "Troublesrooting"],
  "cat-appliance": ["Washing Machine", "Refrigerator", "Geyser", "Microwave"],
  "cat-maid": ["Utensils cleaning", "Cooking", "Baby Care", "Ironing"],
  "cat-cleaner": ["Deep Cleaning", "Sofa cleaning", "Bathroom cleaning", "Office Cleaning"],
  "cat-driver": ["City transfers", "Outstation", "Airport pickup", "Monthly driving"],
  "cat-labour": ["Brick work", "Plaster", "Loading", "Shifting"],
  "cat-computer": ["Laptop Repair", "PC building", "OS install", "Networking"],
  "cat-mobile": ["Screen Replacement", "Battery", "Software", "Data recovery"],
  "cat-gardener": ["Lawn care", "Planting", "Tree pruning", "Irrigation"],
  "cat-tutor": ["Matrematics", "Prysics", "English", "Competitive Exams"],
  "cat-beauty": ["Hair styling", "Facial", "Bridal makeup", "Waxing"],
};

const HEADLINE_BY_CAT: Record<string, string> = {
  "cat-plumber": "Experienced plumber for homes & shops",
  "cat-electrician": "Certified electrician with 24x7 availability",
  "cat-carpenter": "Furniture and door fitting specialist",
  "cat-painter": "Professional painter for interiors & exteriors",
  "cat-mechanic": "Doorstep two-wheeler and car mechanic",
  "cat-ac": "AC service expert for all leading brands",
  "cat-appliance": "Home appliance repair specialist",
  "cat-maid": "Verified domestic help, trained & background checked",
  "cat-cleaner": "Deep cleaning specialist for homes and offices",
  "cat-driver": "Professional driver with clean vehicles",
  "cat-labour": "Skilled labour for construction and shifting",
  "cat-computer": "Computer and laptop repair expert",
  "cat-mobile": "Mobile phone repair with genuine parts",
  "cat-gardener": "Garden and lawn maintenance expert",
  "cat-tutor": "Certified home tutor for all classes",
  "cat-beauty": "Home beauty service by trained professionals",
};

const ABOUT_TEMPLATES = [
  "I have spent several years working with households and small businesses across {city}. I take pride in clean work, arrive on time and explain the cost before starting. Every job includes a service warranty.",
  "Working out of {city} for over {exp} years, I have handled everything from urgent repairs to complete installations. I use genuine parts and provide a written estimate upfront.",
  "I am a verified professional serving the {area} region. My focus is on quality, hygiene and finishing the job in a single visit wherever possible. Happy to answer questions on call.",
  "Trusted by more than {jobs} families in {city}. I specialise in quick turnarounds and am available for same-day appointments in most areas.",
];

function ratingBreakdown(total: number) {
  const pct = () => 0;
  const breakdown = { 1: pct(), 2: pct(), 3: pct(), 4: pct(), 5: pct() } as Record<1 | 2 | 3 | 4 | 5, number>;
  const five = int(62, 88);
  const four = int(7, 18);
  const three = int(1, 8);
  const two = int(0, 3);
  const one = Math.max(0, 100 - five - four - three - two);
  breakdown[5] = five;
  breakdown[4] = four;
  breakdown[3] = three;
  breakdown[2] = two;
  breakdown[1] = one;
  void total;
  return breakdown;
}

function buildWorkerBase(i: number, name: string, categoryId: string, city: string, verified: Worker["verification"]): Worker {
  const cat = CATEGORIES.find((c) => c.id === categoryId)!;
  const serviceIds = SERVICES.filter((s) => s.categoryId === categoryId).map((s) => s.id);
  const exp = int(1, 18);
  const reviewCount = int(6, 190);
  const jobs = int(24, 620);
  const basePrice = SERVICES.find((s) => s.categoryId === categoryId)?.startingPrice ?? 300;
  const address1 = {
    line1: `${int(1, 99)}, ${pick(STREETS)}`,
    area: pick(AREAS[city] ?? ["Sector 1"]),
    city,
    pincode: String(int(110001, 560099)),
  };
  const docs: WorkerDocument[] = (["AADHAAR", "PAN", "ADDRESS_PROOF", "PHOTO"] as const).map((type, idx) => ({
    id: `doc_${i}_${idx}`,
    type,
    number:
      type === "AADHAAR"
        ? `XXXX XXXX ${int(1000, 9999)}`
        : type === "PAN"
          ? `XXXXX${int(1000, 9999)}X`
          : type === "ADDRESS_PROOF"
            ? `AB123${int(1000, 9999)}`
            : `IMG-${int(10000, 99999)}`,
    uploadedAt: iso(-int(20, 300), int(9, 18), int(0, 59)),
    status:
      verified === "REJECTED"
        ? idx === 1
          ? "REJECTED"
          : "APPROVED"
        : verified === "PENDING"
          ? "PENDING"
          : "APPROVED",
    rejectionReason:
      verified === "REJECTED" && idx === 1
        ? "Address proof image is not readable. Please upload a clearer copy."
        : undefined,
  }));
  const availability = [1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    enabled: day !== 0,
    start: day === 6 ? "10:00" : "09:00",
    end: day === 6 ? "17:00" : "19:00",
  }));
  return {
    id: `wrk_${i + 1}`,
    name,
    email: emailSlug(name, i + 1),
    phone: `+91 ${int(70, 99)}${String(int(10000000, 99999999))}`,
    role: "WORKER",
    status: verified === "REJECTED" ? "PENDING" : chance(0.08) ? "SUSPENDED" : "ACTIVE",
    avatarSeed: AVATAR_PALETTE[(i + 3) % AVATAR_PALETTE.length],
    city,
    pincode: address1.pincode,
    address: address1.line1,
    area: address1.area,
    joinedAt: iso(-int(20, 900), int(9, 18), int(0, 59)),
    lastActiveAt: iso(-int(0, 4), int(8, 22), int(0, 59)),
    isOnline: chance(0.4),
    headline: HEADLINE_BY_CAT[categoryId],
    about: pick(ABOUT_TEMPLATES)
      .replace("{city}", city)
      .replace("{area}", address1.area)
      .replace("{exp}", String(exp))
      .replace("{jobs}", String(jobs)),
    categoryId,
    subcategoryIds: cat.subcategories.slice(0, Math.min(3, cat.subcategories.length)).map((s) => s.id),
    serviceIds,
    skills: SKILL_POOL[categoryId].slice(0, 4),
    experienceYears: exp,
    rating: Number((3.5 + rand() * 1.5).toFixed(2)),
    reviewCount,
    completedJobs: jobs,
    cancelledJobs: int(0, 12),
    verification: verified,
    verifiedAt: verified === "APPROVED" ? iso(-int(10, 400)) : undefined,
    rejectionReason: verified === "REJECTED" ? "Provided ID number does not match the uploaded document. Please re-upload." : undefined,
    pricing: {
      visitCharge: basePrice,
      startingPrice: Math.round((basePrice * int(100, 140)) / 100),
      hourlyPrice: Math.round((basePrice * int(60, 110)) / 100),
      minJobAmount: Math.round((basePrice * int(80, 120)) / 100),
    },
    areas: (AREAS[city] ?? ["Sector 1"]).slice(0, 4),
    availability,
    emergencyAvailable: chance(0.5),
    languages: chance(0.4) ? ["Hindi", "English", "Marathi"] : ["Hindi", "English"],
    documents: docs,
    blockedDates: [],
    ratingBreakdown: ratingBreakdown(reviewCount),
  };
}

export function buildWorkers(): Worker[] {
  const out: Worker[] = [];
  const used = new Set<string>();
  let i = 0;
  for (const cat of CATEGORIES) {
    for (let n = 0; n < 2; n += 1) {
      const isMale = chance(0.65);
      let name = `${isMale ? pick(FIRST_M) : pick(FIRST_F)} ${pick(LAST)}`;
      let guard = 0;
      while (used.has(name) && guard < 50) {
        name = `${isMale ? pick(FIRST_M) : pick(FIRST_F)} ${pick(LAST)}`;
        guard += 1;
      }
      used.add(name);
      const city = CITIES[(i * 3 + n) % CITIES.length];
      const verification: Worker["verification"] = i < 4 ? "PENDING" : i === 4 ? "REJECTED" : "APPROVED";
      out.push(buildWorkerBase(i, name, cat.id, city, verification));
      i += 1;
    }
  }

  out.unshift({
    ...buildWorkerBase(0, "Rajesh Kumar", "cat-plumber", "Indore", "APPROVED"),
    id: DEMO_WORKER_ID,
    email: "worker@kaamwala.com",
    phone: "+91 98111 22334",
    name: "Rajesh Kumar",
    isOnline: true,
    rating: 4.8,
    reviewCount: 186,
    completedJobs: 642,
    experienceYears: 12,
    skills: ["Pipe fitting", "Leak detection", "Motor installation", "Bathroom fitting", "Water tank work"],
    headline: "Top rated plumber in Indore with 12 years of experience",
    about: "I am Rajesh, a plumber from Indore with 12 years of hands-on experience. I specialise in leak detection, hidden pipe repairs, motor installation and complete bathroom plumbing. I carry genuine branded parts and provide a written estimate before starting any work. Over 600 families in Vijay Nagar, Palasia and Rajwada have trusted me with their homes.",
    pricing: { visitCharge: 299, startingPrice: 350, hourlyPrice: 250, minJobAmount: 300 },
    areas: ["Vijay Nagar", "Palasia", "Rau", "Bhawarkuan", "Rajwada"],
    emergencyAvailable: true,
    languages: ["Hindi", "English", "Marathi"],
    area: "Vijay Nagar",
    city: "Indore",
    pincode: "452001",
    address: "18, Rajwada Main Road",
    avatarSeed: "bg-indigo-500",
  });
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Bookings                                                                  */
/* -------------------------------------------------------------------------- */
export const BOOKING_TITLES: Record<string, string[]> = {
  "cat-plumber": ["Kitchen tap leaking", "Bathroom pipe blockage", "Water tank overflow", "Flush valve replacement"],
  "cat-electrician": ["MCB tripping issue", "Ceiling Fan Installation", "Switchboard sparking", "Tube light not working"],
  "cat-carpenter": ["Sofa leg broken", "Wardrobe door hinge", "Study table repair", "Main door alignment"],
  "cat-painter": ["2BHK interior painting", "Water seepage wall patch", "Balcony texture paint"],
  "cat-mechanic": ["Bike periodic service", "Car AC not cooling", "Bike chain and brake work"],
  "cat-ac": ["Split AC servicing", "AC not cooling", "New AC installation"],
  "cat-appliance": ["Washing machine not spinning", "Fridge not cooling", "Geyser water not heating"],
  "cat-maid": ["2 hours cleaning", "Monthly maid request", "Kitchen deep clean"],
  "cat-cleaner": ["2BHK deep cleaning", "Sofa Shampoo Cleaning", "Office monthly cleaning"],
  "cat-driver": ["Airport drop", "Outstation to Ujjain", "Full day car rental"],
  "cat-labour": ["Mason for wall work", "House shifting support"],
  "cat-computer": ["Laptop overheating issue", "New PC assembly"],
  "cat-mobile": ["Phone screen cracked", "Phone battery replacement"],
  "cat-gardener": ["Lawn maintenance", "Garden planting work"],
  "cat-tutor": ["Class 10 maths tuition", "JEE crash course enquiry", "Spoken English batch"],
  "cat-beauty": ["Home Salon Session", "Bridal makeup"],
};

const DESCRIPTIONS = [
  "The issue started two days ago and is getting worse. Please bring the required tools and any genuine parts.",
  "I noticed the problem this morning. Kindly visit after 11 AM as I will be out before that.",
  "Work has already been started by me but I need help to finish it properly. Materials will be arranged on site.",
  "Please check the unit and share a cost estimate on WhatsApp before starting the repair.",
  "This is a second floor flat with a working lift. Parking is available in the basement.",
  "Urgent requirement. Please call before coming so that someone can be present at the house.",
  "Regular service required. The last service was around six months ago at another place.",
  "The work is simple but I want it done neatly with proper finishing and cleanup afterwards.",
];

const TIME_POOL = ["08:00 AM","09:00 AM","10:00 AM","11:00 AM","01:00 PM","02:00 PM","04:00 PM","05:00 PM","06:00 PM"];

function buildTimeline(status: BookingStatus, createdAt: string): Booking["timeline"] {
  const base = new Date(createdAt).getTime();
  const out: Booking["timeline"] = [{ status: "REQUESTED", at: createdAt }];
  const flow: BookingStatus[] = ["ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"];
  const idx = flow.indexOf(status as (typeof flow)[number]);
  if (idx >= 0) {
    for (let i = 0; i <= idx; i += 1) {
      out.push({ status: flow[i], at: new Date(base + (i + 1) * 3600_000).toISOString() });
    }
  } else if (status === "CANCELLED" || status === "REJECTED") {
    out.push({ status, at: new Date(base + 3600_000).toISOString(), note: status === "REJECTED" ? "Worker could not attend the requested slot" : "Cancelled by user" });
  }
  return out;
}

function buildBookings(workers: Worker[], customers: Customer[], count: number): Booking[] {
  const out: Booking[] = [];
  const plan: { status: BookingStatus; offset: number }[] = [
    { status: "REQUESTED", offset: 0 },
    { status: "REQUESTED", offset: 0 },
    { status: "ACCEPTED", offset: 1 },
    { status: "CONFIRMED", offset: 2 },
    { status: "ON_THE_WAY", offset: 0 },
    { status: "IN_PROGRESS", offset: 0 },
    { status: "IN_PROGRESS", offset: 1 },
    { status: "COMPLETED", offset: -3 },
    { status: "COMPLETED", offset: -6 },
    { status: "COMPLETED", offset: -10 },
    { status: "COMPLETED", offset: -14 },
    { status: "COMPLETED", offset: -20 },
    { status: "CANCELLED", offset: -8 },
    { status: "REJECTED", offset: -12 },
    { status: "COMPLETED", offset: -25 },
    { status: "COMPLETED", offset: -30 },
    { status: "COMPLETED", offset: -35 },
    { status: "COMPLETED", offset: -40 },
    { status: "CONFIRMED", offset: 3 },
    { status: "ACCEPTED", offset: 2 },
    { status: "COMPLETED", offset: -45 },
    { status: "COMPLETED", offset: -50 },
    { status: "CANCELLED", offset: -18 },
  ];

  for (let i = 0; i < count; i += 1) {
    const { status, offset } = plan[i % plan.length];
    const worker = workers[1 + ((i * 5) % (workers.length - 1))];
    const customer = customers[1 + ((i * 3) % (customers.length - 1))];
    const services = SERVICES.filter((s) => s.categoryId === worker.categoryId);
    const service = services[i % services.length];
    const titles = BOOKING_TITLES[worker.categoryId] ?? ["Service request"];
    const createdAt = iso(offset, int(8, 19), int(0, 59));
    const price = worker.pricing.startingPrice + int(0, 4) * worker.pricing.hourlyPrice;
    const platformFee = Math.round((price * 10) / 100);
    const Method = pick(["UPI", "CARD", "CASH", "WALLET"] as PaymentMethod[]);
    const isDone = status === "COMPLETED";
    out.push({
      id: `BKG-${String(1001 + i)}`,
      customerId: customer.id,
      workerId: worker.id,
      serviceId: service.id,
      categoryId: service.categoryId,
      title: titles[i % titles.length],
      description: pick(DESCRIPTIONS),
      notes: chance(0.4) ? "Please call before arriving. Gate code 4412." : undefined,
      images: [],
      address: {
        line1: `${pick(HOUSE_NO)}, ${pick(STREETS)}`,
        area: pick(AREAS[customer.city] ?? ["Sector 1"]),
        city: customer.city,
        pincode: customer.pincode,
        landmark: pick(["Near City Mall", "Opposite Bank", "Next to Temple"]),
      },
      scheduledDate: iso(Math.max(offset, 0), int(9, 18), 0).slice(0, 10),
      scheduledTime: TIME_POOL[i % TIME_POOL.length],
      isFlexible: chance(0.35),
      status,
      price,
      visitCharge: worker.pricing.visitCharge,
      platformFee,
      paymentStatus: isDone ? "PAID" : status === "CANCELLED" || status === "REJECTED" ? "REFUNDED" : chance(0.3) ? "PAID" : "PENDING",
      paymentMethod: Method,
      timeline: buildTimeline(status, createdAt),
      createdAt,
      cancelReason: status === "CANCELLED" ? "Change of plan, will book again next week." : undefined,
      rating: isDone && chance(0.6) ? int(3, 5) : undefined,
      workerEta: status === "ON_THE_WAY" ? int(8, 45) : undefined,
    });
  }

  // Demo customer bookings (bookings created by The demo customer against The demo worker)
  const demoCustomer = customers[0];
  const demoWorker = workers[0];
  const demoServices = SERVICES.filter((s) => s.categoryId === demoWorker.categoryId);
  const demoPlan: { status: BookingStatus; offset: number; idx: number }[] = [
    { status: "IN_PROGRESS", offset: 0, idx: 0 },
    { status: "CONFIRMED", offset: 1, idx: 1 },
    { status: "REQUESTED", offset: 2, idx: 2 },
    { status: "COMPLETED", offset: -4, idx: 0 },
    { status: "COMPLETED", offset: -9, idx: 1 },
    { status: "COMPLETED", offset: -15, idx: 2 },
    { status: "COMPLETED", offset: -22, idx: 0 },
    { status: "CANCELLED", offset: -30, idx: 1 },
  ];
  demoPlan.forEach((d, i) => {
    const service = demoServices[d.idx % demoServices.length];
    const createdAt = iso(d.offset, int(8, 20), int(0, 59));
    const price = demoWorker.pricing.startingPrice + int(1, 3) * demoWorker.pricing.hourlyPrice;
    const isDone = d.status === "COMPLETED";
    out.push({
      id: `BKG-${2001 + i}`,
      customerId: demoCustomer.id,
      workerId: d.status === "REQUESTED" ? demoWorker.id : demoWorker.id,
      serviceId: service.id,
      categoryId: service.categoryId,
      title: ["Kitchen tap leaking", "Bathroom pipe blockage", "Water tank overflow"][d.idx % 3],
      description: pick(DESCRIPTIONS),
      notes: "Please call before arriving. Gate code 4412.",
      images: [],
      address: {
        line1: "12, MG Road, Vijay Nagar",
        area: "Vijay Nagar",
        city: "Indore",
        pincode: "452001",
        landmark: "Near City Mall",
      },
      scheduledDate: iso(Math.max(d.offset, 0), int(9, 18), 0).slice(0, 10),
      scheduledTime: TIME_POOL[(i + 2) % TIME_POOL.length],
      isFlexible: i % 3 === 0,
      status: d.status,
      price,
      visitCharge: demoWorker.pricing.visitCharge,
      platformFee: Math.round((price * 10) / 100),
      paymentStatus: isDone ? "PAID" : d.status === "CANCELLED" ? "REFUNDED" : "PENDING",
      paymentMethod: pick(["UPI", "UPI", "CARD", "CASH"] as PaymentMethod[]),
      timeline: buildTimeline(d.status, createdAt),
      createdAt,
      cancelReason: d.status === "CANCELLED" ? "Change of plan, will book again next week." : undefined,
      rating: isDone ? [5, 4, 5, 5][i % 4] : undefined,
    });
  });

  // Requests sent to The demo worker
  const otrerCustomers = customers.slice(1, 9);
  for (let i = 0; i < 5; i += 1) {
    const customer = otrerCustomers[i % otrerCustomers.length];
    const service = demoServices[i % demoServices.length];
    const createdAt = iso(0, int(8, 19), int(0, 59));
    out.push({
      id: `BKG-${2101 + i}`,
      customerId: customer.id,
      workerId: demoWorker.id,
      serviceId: service.id,
      categoryId: service.categoryId,
      title: ["Flush valve replacement", "Water tank overflow", "Bathroom pipe blockage", "Kitchen tap leaking", "Pipe replacement"][i],
      description: pick(DESCRIPTIONS),
      notes: chance(0.6) ? "Call on arrival, I will be at home." : undefined,
      images: [],
      address: {
        line1: `${pick(HOUSE_NO)}, ${pick(STREETS)}`,
        area: pick(AREAS[customer.city] ?? ["Sector 1"]),
        city: customer.city,
        pincode: customer.pincode,
        landmark: "Opposite Bank",
      },
      scheduledDate: iso(int(0, 4), int(9, 18), 0).slice(0, 10),
      scheduledTime: TIME_POOL[(i + 3) % TIME_POOL.length],
      isFlexible: i % 2 === 0,
      status: "REQUESTED",
      price: demoWorker.pricing.startingPrice + int(1, 3) * demoWorker.pricing.hourlyPrice,
      visitCharge: demoWorker.pricing.visitCharge,
      platformFee: 0,
      paymentStatus: "PENDING",
      paymentMethod: "CASH",
      timeline: [{ status: "REQUESTED", at: createdAt }],
      createdAt,
    });
  }

  return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/* -------------------------------------------------------------------------- */
/*  Reviews / Transactions / Complaints / Notifications / Crat                 */
/* -------------------------------------------------------------------------- */
function buildReviews(bookings: Booking[], workers: Worker[], customers: Customer[]): Review[] {
  const done = bookings.filter((b) => b.status === "COMPLETED" && b.workerId);
  const out: Review[] = [];
  let i = 0;
  for (const b of done) {
    if (!chance(0.72)) continue;
    const worker = workers.find((w) => w.id === b.workerId);
    if (!worker) continue;
    const r = b.rating ?? (chance(0.82) ? 5 : chance(0.6) ? 4 : 3);
    const text = r >= 4 ? pick(REVIEW_TEXTS_POS) : r === 3 ? pick(REVIEW_TEXTS_MID) : pick(REVIEW_TEXTS_NEG);
    out.push({
      id: `REV-${5001 + i}`,
      bookingId: b.id,
      customerId: b.customerId,
      workerId: b.workerId!,
      serviceId: b.serviceId,
      rating: r,
      comment: text,
      images: chance(0.18) ? [`job-${i}`] : [],
      createdAt: new Date(new Date(b.createdAt).getTime() + 86400000).toISOString(),
      isHidden: chance(0.05),
      reply: chance(0.25) ? "Thank you for the feedback! It was a pleasure serving you." : undefined,
      helpfulCount: int(0, 24),
    });
    i += 1;
  }
  void customers;
  return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function buildTransactions(bookings: Booking[]): Transaction[] {
  return bookings
    .filter((b) => b.paymentStatus === "PAID" && b.workerId)
    .map((b, i) => ({
      id: `TXN-${7001 + i}`,
      bookingId: b.id,
      customerId: b.customerId,
      workerId: b.workerId!,
      amount: b.price + b.platformFee,
      platformFee: b.platformFee,
      workerEarning: b.price,
      method: b.paymentMethod,
      status: "PAID" as const,
      createdAt: b.timeline[b.timeline.length - 1]?.at ?? b.createdAt,
      reference: `KW${Math.floor(10000000 + rand() * 89999999)}`,
      invoiceNo: `INV-2024-${String(1200 + i).padStart(5, "0")}`,
    }));
}

const COMPLAINT_SEEDS: { reason: ComplaintReason; subject: string; status: Complaint["status"] }[] = [
  { reason: "OVERCHARGE", subject: "Charged more than the quoted price", status: "OPEN" },
  { reason: "QUALITY_ISSUE", subject: "Work did not last, tap started leaking again", status: "OPEN" },
  { reason: "NO_SHOW", subject: "Worker did not attend the appointment", status: "UNDER_REVIEW" },
  { reason: "UNPROFESSIONAL", subject: "Rude behaviour and no uniform", status: "UNDER_REVIEW" },
  { reason: "QUALITY_ISSUE", subject: "Painting finish was patchy", status: "RESOLVED" },
  { reason: "DAMAGE", subject: "Scratch on the marble floor during work", status: "RESOLVED" },
  { reason: "OVERCHARGE", subject: "Extra visit charges not informed", status: "REJECTED" },
  { reason: "OTHER", subject: "Wrong part supplied in the service", status: "OPEN" },
  { reason: "NO_SHOW", subject: "Cancelled job on the day of service", status: "RESOLVED" },
  { reason: "QUALITY_ISSUE", subject: "AC cooling reduced after servicing", status: "UNDER_REVIEW" },
  { reason: "UNPROFESSIONAL", subject: "Worker did not carry proper tools", status: "OPEN" },
  { reason: "DAMAGE", subject: "Wall damage while fixing the TV mount", status: "REJECTED" },
];

function buildComplaints(bookings: Booking[]): Complaint[] {
  const pool = bookings.filter((b) => b.workerId && b.status !== "REQUESTED");
  return COMPLAINT_SEEDS.map((seed, i) => {
    const b = pool[(i * 3) % pool.length];
    return {
      id: `CMP-${3001 + i}`,
      bookingId: b.id,
      customerId: b.customerId,
      workerId: b.workerId!,
      reason: seed.reason,
      subject: seed.subject,
      customerStatement:
        "I booked the service through KaamWala and the work was completed, however the final outcome was not as expected. I have already spoken to the support team once and was asked to share the details here.",
      workerStatement:
        "I attended the location on time and completed the assigned work as per the description. I have shared the details of the work done in the chat as well.",
      status: seed.status,
      createdAt: iso(-int(1, 40), int(9, 20), int(0, 59)),
      resolvedAt: seed.status === "RESOLVED" ? iso(-int(0, 10), int(10, 19), int(0, 59)) : undefined,
      resolution:
        seed.status === "RESOLVED"
          ? "Refund of 40% processed and free re-visit scheduled for the customer."
          : seed.status === "REJECTED"
            ? "Evidence provided by the worker was verified. Claim could not be validated."
            : undefined,
      adminNotes:
        seed.status !== "OPEN"
          ? [{ id: `note_${i}_1`, note: "Contacted both parties. Waiting for the worker's response.", createdAt: iso(-int(1, 6), int(11, 18), int(0, 59)) }]
          : [],
      attachments: chance(0.5) ? ["work-1", "work-2"] : [],
    };
  });
}

function buildNotifications(userId: string, bookings: Booking[]): AppNotification[] {
  const mine = bookings.filter((b) => b.customerId === userId).slice(0, 8);
  const seeds: Omit<AppNotification, "id" | "userId" | "isRead" | "createdAt">[] = [
    { category: "SYSTEM", title: "Welcome to KaamWala", body: "Your account is ready. Book any service in under a minute.", href: "/customer/services" },
    { category: "BOOKING", title: "Booking requested", body: "Your request has been sent. Workers usually respond within 10 minutes.", href: "/customer/bookings" },
    { category: "PAYMENT", title: "Payment successful", body: "₹1,450 has been debited from your UPI account.", href: "/customer/payments" },
    { category: "WORKER", title: "Worker assigned", body: "Rajesh Kumar accepted your booking request.", href: "/customer/bookings" },
    { category: "BOOKING", title: "Reminder", body: "Your appointment is scheduled for tomorrow at 10:00 AM.", href: "/customer/bookings" },
    { category: "SYSTEM", title: "Rate your recent service", body: "Tell other customers about your experience.", href: "/customer/reviews" },
  ];
  const fromBookings: Omit<AppNotification, "id" | "userId" | "isRead" | "createdAt">[] = mine.map((b) => ({
    category: b.status === "COMPLETED" ? "BOOKING" : "BOOKING",
    title: `Booking ${b.id} ${b.status.toLowerCase().replace(/_/g, " ")}`,
    body: `${b.title} · ${b.scheduledDate}`,
    href: `/customer/bookings/${b.id}`,
  }));
  return [...fromBookings, ...seeds].slice(0, 14).map((n, i) => ({
    ...n,
    id: `ntf_${userId}_${i}`,
    userId,
    isRead: i > 4,
    createdAt: iso(-i, int(8, 20), int(0, 59)),
  }));
}

function buildWorkerNotifications(userId: string, bookings: Booking[]): AppNotification[] {
  const mine = bookings.filter((b) => b.workerId === userId).slice(0, 10);
  const fromBookings: Omit<AppNotification, "id" | "userId" | "isRead" | "createdAt">[] = mine.map((b) => ({
    category: b.status === "COMPLETED" ? "PAYMENT" : "BOOKING",
    title: `New ${b.status.toLowerCase().replace(/_/g, " ")} booking ${b.id}`,
    body: `${b.title} · ${b.address.area}, ${b.address.city}`,
    href: `/worker/jobs/${b.id}`,
  }));
  const seeds: Omit<AppNotification, "id" | "userId" | "isRead" | "createdAt">[] = [
    { category: "SYSTEM", title: "Profile is verified", body: "You are now visible to customers in your service area.", href: "/worker/profile" },
    { category: "PAYMENT", title: "Payout processed", body: "₹8,420 has been transferred to your bank account.", href: "/worker/earnings" },
    { category: "BOOKING", title: "Keep your rating high", body: "Complete 2 more jobs this week to stay in the top 10% of Indore.", href: "/worker/reviews" },
  ];
  return [...fromBookings, ...seeds].slice(0, 14).map((n, i) => ({
    ...n,
    id: `ntf_${userId}_${i}`,
    userId,
    isRead: i > 3,
    createdAt: iso(-Math.floor(i / 2), int(8, 21), int(0, 59)),
  }));
}

function buildChat(
  me: string,
  counterpartId: string,
  role: "CUSTOMER" | "WORKER",
  bookingId: string | undefined,
): { conversation: Conversation; messages: Message[] } {
  const other = role === "CUSTOMER" ? "worker" : "customer";
  const script =
    role === "CUSTOMER"
      ? [
          { from: other, text: "Hello! I have accepted your booking request.", offset: -300 },
          { from: me, text: "Hi, thank you. Please bring a 2.5 inch brass gate valve, the leak is near the tank outlet.", offset: -290 },
          { from: other, text: "Sure, I always carry spare valves. I will reach by 10:30 AM.", offset: -285 },
          { from: me, text: "That works. I will keep the gate open. Please share a photo once the work is done.", offset: -280 },
          { from: other, text: "Will do. Also, if the joint is corroded we may need to replace a small section of the pipe. I will confirm the cost before starting.", offset: -275 },
          { from: me, text: "Please go ahead, but keep the total under ₹1,500.", offset: -30 },
          { from: other, text: "Noted 👍 I will update you once I am on the way.", offset: -12 },
        ]
      : [
          { from: other, text: "Hi, do you have a plumber available for tomorrow morning?", offset: -280 },
          { from: me, text: "Yes, I can visit between 9 AM and 11 AM tomorrow.", offset: -276 },
          { from: other, text: "Perfect. It is a kitchen sink that is blocked and water is backing up.", offset: -270 },
          { from: me, text: "Got it. Please do not use the sink and I will bring a drain auger. The visit charge is ₹299 and the job is usually ₹800-₹1,200.", offset: -265 },
          { from: other, text: "That is fine. Please book it for 10:00 AM.", offset: -25 },
        ];

  const conversationId = `cnv_${me}_${counterpartId}`;
  const messages: Message[] = script.map((m, i) => ({
    id: `msg_${conversationId}_${i}`,
    conversationId,
    senderId: m.from,
    text: m.text,
    createdAt: iso(Math.round(m.offset / 60), int(9, 19), (i * 7) % 60),
    isRead: i < script.length - 1,
    Attachment: m.from === other && i === 0 ? { name: "work-photo.jpg", type: "image" } : undefined,
  }));
  return {
    conversation: {
      id: conversationId,
      customerId: role === "CUSTOMER" ? me : counterpartId,
      workerId: role === "WORKER" ? me : counterpartId,
      bookingId,
      lastMessageAt: messages[messages.length - 1].createdAt,
      unreadCount: role === "CUSTOMER" ? 1 : 2,
    },
    messages,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public reviews for workers                                                 */
/* -------------------------------------------------------------------------- */
export function buildWorkerReviewList(workerId: string, count: number, seedOffset: number) {
  const r = mulberry32(9000 + seedOffset);
  const pickFrom = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const out: Review[] = [];
  for (let i = 0; i < count; i += 1) {
    const rating = r() < 0.78 ? 5 : r() < 0.8 ? 4 : r() < 0.9 ? 3 : r() < 0.95 ? 2 : 1;
    out.push({
      id: `wr_${workerId}_${i}`,
      bookingId: `BKG-${3000 + i}`,
      customerId: `cus_${1 + (i % 20)}`,
      workerId,
      serviceId: SERVICES[0].id,
      rating,
      comment: rating >= 4 ? pickFrom(REVIEW_TEXTS_POS) : rating === 3 ? pickFrom(REVIEW_TEXTS_MID) : pickFrom(REVIEW_TEXTS_NEG),
      images: r() < 0.2 ? [`wr-${i}`] : [],
      createdAt: iso(-(i * 2 + 1), int(9, 20), int(0, 59)),
      isHidden: false,
      helpfulCount: Math.floor(r() * 22),
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Root build                                                                */
/* -------------------------------------------------------------------------- */
export interface MockDatabase {
  categories: ServiceCategory[];
  services: Service[];
  workers: Worker[];
  customers: Customer[];
  bookings: Booking[];
  transactions: Transaction[];
  reviews: Review[];
  complaints: Complaint[];
  conversations: Conversation[];
  messages: Message[];
  notifications: AppNotification[];
  earningsSeries: { day: string; earnings: number; jobs: number }[];
  bookingSeries: { month: string; bookings: number; revenue: number; customers: number; workers: number }[];
}

export function buildDatabase(): MockDatabase {
  const categories = structuredClone(CATEGORIES);
  const services = structuredClone(SERVICES);
  const customers = buildCustomers();
  const workers = buildWorkers();
  const bookings = buildBookings(workers, customers, 24);

  const workerCountByCat: Record<string, number> = {};
  workers.forEach((w) => {
    workerCountByCat[w.categoryId] = (workerCountByCat[w.categoryId] ?? 0) + 1;
  });
  const ratingsByCat: Record<string, number[]> = {};
  const workersByCat: Record<string, Worker[]> = {};
  workers.forEach((w) => {
    (ratingsByCat[w.categoryId] ??= []).push(w.rating);
    (workersByCat[w.categoryId] ??= []).push(w);
  });
  services.forEach((s) => {
    s.workerCount = workerCountByCat[s.categoryId] ?? 0;
    const list = ratingsByCat[s.categoryId] ?? [4.3];
    s.rating = Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1));
    s.shortDescription = `${s.name} in ${s.categoryId.replace("cat-", "").replace(/-/g, " ")} — fixed visit charge, verified pros.`;
    s.reviewCount = (workersByCat[s.categoryId] ?? []).reduce((sum, w) => sum + w.reviewCount, 0);
    s.includes = [
      "On-site visit and diagnosis",
      "Labour charges for the standard scope",
      "Basic tools and consumables",
      "Digital invoice and warranty on the work",
    ];
  });
  categories.forEach((c) => {
    c.subcategories = c.subcategories.map((sub) => ({
      ...sub,
      serviceCount: services.filter((s) => s.subcategoryId === sub.id).length,
    }));
  });

  const reviews = buildReviews(bookings, workers, customers);
  const transactions = buildTransactions(bookings);
  const complaints = buildComplaints(bookings);

  const conversations: Conversation[] = [];
  const messages: Message[] = [];

  // Demo customer conversation With The demo worker
  const demoBooking = bookings.find((b) => b.customerId === DEMO_CUSTOMER_ID && b.workerId === DEMO_WORKER_ID);
  const c1 = buildChat(DEMO_CUSTOMER_ID, DEMO_WORKER_ID, "CUSTOMER", demoBooking?.id);
  conversations.push(c1.conversation);
  messages.push(...c1.messages);

  // Demo customer conversations With other workers
  [1, 2, 3, 4].forEach((i) => {
    const w = workers[i + 1];
    if (!w) return;
    const c = buildChat(DEMO_CUSTOMER_ID, w.id, "CUSTOMER", undefined);
    conversations.push(c.conversation);
    messages.push(...c.messages);
  });

  // Demo worker conversations With customers
  customers.slice(1, 6).forEach((c) => {
    const conv = buildChat(DEMO_WORKER_ID, c.id, "WORKER", undefined);
    conversations.push(conv.conversation);
    messages.push(...conv.messages);
  });

  const notifications = [
    ...buildNotifications(DEMO_CUSTOMER_ID, bookings),
    ...buildWorkerNotifications(DEMO_WORKER_ID, bookings),
  ];

  // Chart series
  const earningsSeries: MockDatabase["earningsSeries"] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    earningsSeries.push({
      day: d.toISOString().slice(0, 10),
      earnings: 800 + Math.round(rand() * 4200),
      jobs: 1 + Math.floor(rand() * 4),
    });
  }

  const bookingSeries: MockDatabase["bookingSeries"] = [];
  const monthNames = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const b = 240 + Math.round(rand() * 260);
    bookingSeries.push({
      month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      bookings: b,
      revenue: b * int(1100, 1900),
      customers: 90 + Math.round(rand() * 180),
      workers: 40 + Math.round(rand() * 90),
    });
  }

  return {
    categories,
    services,
    workers,
    customers,
    bookings,
    transactions,
    reviews,
    complaints,
    conversations,
    messages,
    notifications,
    earningsSeries,
    bookingSeries,
  };
}

export const TESTIMONIALS = [
  {
    id: "t1",
    name: "Sneha Patil",
    location: "Pune, Maharashtra",
    rating: 5,
    service: "Deep Cleaning",
    avatarSeed: "bg-fuchsia-600",
    quote:
      "I booked a deep cleaning service on a Sunday and the team arrived exactly on time. The pricing was transparent and there were no surprise charges at the end. This is now my go-to app for all home services.",
  },
  {
    id: "t2",
    name: "Karan Malhotra",
    location: "Delhi",
    rating: 5,
    service: "AC Servicing",
    avatarSeed: "bg-sky-600",
    quote:
      "My AC stopped cooling two days before summer vacation. KaamWala sent a technician the same evening and had it working again in under an hour. Genuinely impressed with the response time.",
  },
  {
    id: "t3",
    name: "Meera Pillai",
    location: "Indore, Madhya Pradesh",
    rating: 4,
    service: "Plumbing",
    avatarSeed: "bg-emerald-600",
    quote:
      "The plumber explained the problem, showed me the cost of the part and completed the repair in under forty minutes. I could track him on the app while he was on the way. Very transparent experience.",
  },
  {
    id: "t4",
    name: "Aditya Kulkarni",
    location: "Mumbai, Maharashtra",
    rating: 5,
    service: "Bike Service",
    avatarSeed: "bg-amber-600",
    quote:
      "Booked a doorstep bike service while at the office. The mechanic arrived with all genuine parts and a printed service report. Paying after the work through UPI took five seconds.",
  },
  {
    id: "t5",
    name: "Ritika Bansal",
    location: "Ujjain, Madhya Pradesh",
    rating: 5,
    service: "Tutor",
    avatarSeed: "bg-violet-600",
    quote:
      "Found a verified maths tutor for my daughter in under five minutes. The tutor conducts a demo class before taking the subscription, which is exactly what I wanted.",
  },
  {
    id: "t6",
    name: "Vikram Singh",
    location: "Jaipur, Rajasthan",
    rating: 4,
    service: "Home Appliance Repair",
    avatarSeed: "bg-rose-600",
    quote:
      "My washing machine started leaking water. The technician came the next morning, repaired it and gave a 90 day warranty. Worth every rupee of what I paid.",
  },
];
