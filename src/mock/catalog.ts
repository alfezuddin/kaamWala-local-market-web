import type { Service, ServiceCategory } from "@/types";

type CatSeed = {
  id: string;
  name: string;
  icon: string;
  description: string;
  subs: { id: string; name: string; description: string }[];
  services: { id: string; name: string; sub: string; price: number; description: string; icon: string }[];
};

const CATALOG_SEED: CatSeed[] = [
  {
    id: "cat-plumber",
    name: "Plumber",
    icon: "Wrench",
    description: "Leaks, taps, pipelines and water tank work.",
    subs: [
      { id: "sub-plumber-pipe", name: "Pipe Repair", description: "Leak detection and pipe fixing" },
      { id: "sub-plumber-tap", name: "Tap & Fittings", description: "Tap installation and replacement" },
      { id: "sub-plumber-tank", name: "Water Tank", description: "Overhead tank installation and cleaning" },
      { id: "sub-plumber-bathroom", name: "Bathroom Plumbing", description: "Bathroom fittings and drainage" },
    ],
    services: [
      { id: "svc-plumber-visit", name: "Plumber Visit & Diagnosis", sub: "sub-plumber-pipe", price: 299, icon: "Wrench", description: "On-site inspection, leak diagnosis and minor repairs included." },
      { id: "svc-plumber-tap", name: "Tap or Faucet Installation", sub: "sub-plumber-tap", price: 450, icon: "Droplets", description: "Replace or install kitchen and bathroom taps with new fitting." },
      { id: "svc-plumber-tank", name: "Water Tank Cleaning & Repair", sub: "sub-plumber-tank", price: 1200, icon: "Waves", description: "Overhead tank cleaning, leak repair and complete reinstallation." },
    ],
  },
  {
    id: "cat-electrician",
    name: "Electrician",
    icon: "Zap",
    description: "Wiring, switchboards, fans and lighting.",
    subs: [
      { id: "sub-elec-wiring", name: "Household Wiring", description: "Internal and external wiring" },
      { id: "sub-elec-fan", name: "Fan & Light", description: "Fan, light and fixture installation" },
      { id: "sub-elec-board", name: "Switchboard & DB", description: "Distribution boards and MCB work" },
    ],
    services: [
      { id: "svc-elec-visit", name: "Electrician Visit & Fault Finding", sub: "sub-elec-wiring", price: 349, icon: "Zap", description: "Complete fault inspection, wiring check and minor rectification." },
      { id: "svc-elec-fan", name: "Ceiling Fan Installation", sub: "sub-elec-fan", price: 550, icon: "Fan", description: "Supply and install a branded ceiling fan with regulator." },
      { id: "svc-elec-board", name: "Switchboard Repair / DB Upgrade", sub: "sub-elec-board", price: 900, icon: "Sliders", description: "Rewire switchboards, upgrade distribution board and MCBs." },
    ],
  },
  {
    id: "cat-carpenter",
    name: "Carpenter",
    icon: "Hammer",
    description: "Furniture repair, fittings and wood work.",
    subs: [
      { id: "sub-carp-repair", name: "Furniture Repair", description: "Repairing sofas, beds and chairs" },
      { id: "sub-carp-furniture", name: "Custom Furniture", description: "Made-to-order furniture" },
      { id: "sub-carp-door", name: "Door & Window", description: "Door fitting, hinges and locks" },
    ],
    services: [
      { id: "svc-carp-repair", name: "Furniture Repair & Fitting", sub: "sub-carp-repair", price: 400, icon: "Hammer", description: "Fix loose joints, replace hinges, tighten and polish." },
      { id: "svc-carp-door", name: "Door / Window Fitting", sub: "sub-carp-door", price: 700, icon: "DoorOpen", description: "Install, align and repair doors, windows and locks." },
      { id: "svc-carp-custom", name: "Custom Wooden Furniture", sub: "sub-carp-furniture", price: 3500, icon: "Armchair", description: "Wardrobes, study tables and modular units." },
    ],
  },
  {
    id: "cat-painter",
    name: "Painter",
    icon: "Paintbrush",
    description: "Interior, exterior and texture painting.",
    subs: [
      { id: "sub-paint-interior", name: "Interior Painting", description: "Walls, ceilings and interiors" },
      { id: "sub-paint-exterior", name: "Exterior Painting", description: "Facade and outdoor walls" },
      { id: "sub-paint-texture", name: "Texture & Design", description: "Designer finishes and patterns" },
    ],
    services: [
      { id: "svc-paint-room", name: "Room Painting (2 Walls)", sub: "sub-paint-interior", price: 2400, icon: "Paintbrush", description: "Two walls of an average room, prep and two coats included." },
      { id: "svc-paint-full", name: "Full Home Interior Painting", sub: "sub-paint-interior", price: 14000, icon: "Home", description: "2BHK complete interior painting with consultation." },
      { id: "svc-paint-texture", name: "3D Texture Wall Art", sub: "sub-paint-texture", price: 85, icon: "Palette", description: "Designer texture finish, per square foot." },
    ],
  },
  {
    id: "cat-mechanic",
    name: "Mechanic",
    icon: "Car",
    description: "Two-wheeler and car servicing at your door.",
    subs: [
      { id: "sub-mech-bike", name: "Two Wheeler", description: "Bike and scooter service" },
      { id: "sub-mech-car", name: "Car Service", description: "Car periodic servicing" },
      { id: "sub-mech-roadside", name: "Roadside Assistance", description: "Breakdown and towing help" },
    ],
    services: [
      { id: "svc-mech-bike", name: "Bike Service (Doorstep)", sub: "sub-mech-bike", price: 599, icon: "Bike", description: "Complete bike service at your location with genuine parts." },
      { id: "svc-mech-car", name: "Car Periodic Service", sub: "sub-mech-car", price: 4200, icon: "Car", description: "Periodic car servicing with 21-point inspection report." },
      { id: "svc-mech-roadside", name: "Roadside Assistance (24x7)", sub: "sub-mech-roadside", price: 499, icon: "Truck", description: "On-call mechanic support within your city limits." },
    ],
  },
  {
    id: "cat-ac",
    name: "AC Technician",
    icon: "AirVent",
    description: "AC servicing, installation and gas filling.",
    subs: [
      { id: "sub-ac-service", name: "AC Servicing", description: "Split and window AC service" },
      { id: "sub-ac-install", name: "AC Installation", description: "Installation and shifting" },
      { id: "sub-ac-repair", name: "AC Repair", description: "Cooling and electrical repair" },
    ],
    services: [
      { id: "svc-ac-service", name: "AC Deep Service", sub: "sub-ac-service", price: 799, icon: "Snowflake", description: "Split AC servicing with coil wash and gas check." },
      { id: "svc-ac-install", name: "AC Installation & Shifting", sub: "sub-ac-install", price: 1600, icon: "AirVent", description: "Installation with vacuum pipe, drain and testing." },
      { id: "svc-ac-gas", name: "AC Gas Refilling", sub: "sub-ac-repair", price: 2400, icon: "Gauge", description: "Leak detection and R32/R410 gas refilling." },
    ],
  },
  {
    id: "cat-appliance",
    name: "Appliance Repair",
    icon: "Refrigerator",
    description: "Washer, fridge, microwave and geyser repair.",
    subs: [
      { id: "sub-app-washer", name: "Washing Machine", description: "Front and top load repair" },
      { id: "sub-app-fridge", name: "Refrigerator", description: "Cooling and compressor repair" },
      { id: "sub-app-geyser", name: "Geyser", description: "Water heater service" },
    ],
    services: [
      { id: "svc-app-washer", name: "Washing Machine Repair", sub: "sub-app-washer", price: 650, icon: "WashingMachine", description: "Diagnosis and repair for all leading brands." },
      { id: "svc-app-fridge", name: "Refrigerator Repair Visit", sub: "sub-app-fridge", price: 700, icon: "Refrigerator", description: "Cooling issue, gas charging and thermostat repair." },
      { id: "svc-app-geyser", name: "Geyser Service & Repair", sub: "sub-app-geyser", price: 800, icon: "Thermometer", description: "Heating element, thermostat and anode replacement." },
    ],
  },
  {
    id: "cat-maid",
    name: "Maid",
    icon: "Sparkles",
    description: "Verified domestic help for daily needs.",
    subs: [
      { id: "sub-maid-full", name: "Full Time Helper", description: "8 hour daily domestic help" },
      { id: "sub-maid-cook", name: "Cooking Help", description: "Indian and continental cooking" },
      { id: "sub-maid-baby", name: "Baby Care", description: "Newborn and toddler care" },
    ],
    services: [
      { id: "svc-maid-visit", name: "Maid for 2 Hours", sub: "sub-maid-full", price: 500, icon: "Sparkles", description: "Utensils, floor and bathroom cleaning for 2 hours." },
      { id: "svc-maid-full", name: "Full Time Maid (Monthly)", sub: "sub-maid-full", price: 14000, icon: "Briefcase", description: "Verified helper for 8 hours a day, 6 days a week." },
      { id: "svc-maid-cook", name: "Cooking Helper (2 Hours)", sub: "sub-maid-cook", price: 550, icon: "CookingPot", description: "Prepare Indian meals as per your preferred menu." },
    ],
  },
  {
    id: "cat-cleaner",
    name: "Cleaner",
    icon: "SprayCan",
    description: "Deep cleaning for homes and offices.",
    subs: [
      { id: "sub-clean-deep", name: "Deep Cleaning", description: "Kitchen, bathroom and sofa" },
      { id: "sub-clean-office", name: "Office Cleaning", description: "Commercial cleaning" },
      { id: "sub-clean-move", name: "Moving / Post Renovation", description: "Move-in and move-out cleaning" },
    ],
    services: [
      { id: "svc-clean-deep", name: "Home Deep Cleaning", sub: "sub-clean-deep", price: 3200, icon: "SprayCan", description: "Complete 2BHK deep cleaning with bathroom and kitchen." },
      { id: "svc-clean-sofa", name: "Sofa Shampoo Cleaning", sub: "sub-clean-deep", price: 899, icon: "Sofa", description: "Shampoo and vacuum cleaning for a 5-seater sofa." },
      { id: "svc-clean-office", name: "Office Cleaning (Monthly)", sub: "sub-clean-office", price: 9500, icon: "Building2", description: "Daily office cleaning with weekly deep clean." },
    ],
  },
  {
    id: "cat-driver",
    name: "Driver",
    icon: "SteeringWheel",
    description: "On-demand drivers for trips and outings.",
    subs: [
      { id: "sub-drv-out", name: "Outstation", description: "Long distance travel" },
      { id: "sub-drv-local", name: "Local Transfer", description: "Airport and city transfers" },
      { id: "sub-drv-monthly", name: "Monthly Driver", description: "Dedicated full time driver" },
    ],
    services: [
      { id: "svc-drv-local", name: "Local Car Rental (10 hrs / 100 km)", sub: "sub-drv-local", price: 1200, icon: "Car", description: "Sedan with an experienced, verified driver." },
      { id: "svc-drv-airport", name: "Airport Transfer", sub: "sub-drv-local", price: 850, icon: "Plane", description: "Pickup or drop at Indore Devi Ahilyabai Airport." },
      { id: "svc-drv-monthly", name: "Monthly Driver (26 days)", sub: "sub-drv-monthly", price: 18000, icon: "CalendarDays", description: "Dedicated driver for your vehicle, 8 hours a day." },
    ],
  },
  {
    id: "cat-labour",
    name: "Labour",
    icon: "Users",
    description: "Masons, helpers, painters and loaders.",
    subs: [
      { id: "sub-lab-mason", name: "Mason", description: "Brick work and plaster" },
      { id: "sub-lab-helper", name: "Helper", description: "Loading and shifting" },
      { id: "sub-lab-packer", name: "Packer & Loader", description: "House shifting support" },
    ],
    services: [
      { id: "svc-lab-mason", name: "Mason (Per Day)", sub: "sub-lab-mason", price: 800, icon: "BrickWall", description: "Skilled mason with all basic tools." },
      { id: "svc-lab-helper", name: "Loading Helper (Per Day)", sub: "sub-lab-helper", price: 500, icon: "Package", description: "Loading, unloading and packing help." },
      { id: "svc-lab-shift", name: "House shifting support", sub: "sub-lab-packer", price: 1200, icon: "Truck", description: "Complete packing and loading support for one day." },
    ],
  },
  {
    id: "cat-computer",
    name: "Computer Repair",
    icon: "Monitor",
    description: "Desktop, laptop and software support.",
    subs: [
      { id: "sub-cmp-laptop", name: "Laptop Repair", description: "Screen, keyboard, battery" },
      { id: "sub-cmp-desktop", name: "Desktop & PC", description: "PC building and repair" },
      { id: "sub-cmp-software", name: "Software Support", description: "OS and software installation" },
    ],
    services: [
      { id: "svc-cmp-laptop", name: "Laptop Repair Visit", sub: "sub-cmp-laptop", price: 600, icon: "Laptop", description: "Diagnosis for screen, motherboard, battery and overheating." },
      { id: "svc-cmp-build", name: "PC Building Service", sub: "sub-cmp-desktop", price: 1800, icon: "Monitor", description: "PC assembly, cable management and OS installation." },
      { id: "svc-cmp-software", name: "Software Installation & AMC", sub: "sub-cmp-software", price: 999, icon: "Download", description: "OS install, antivirus setup and yearly AMC." },
    ],
  },
  {
    id: "cat-mobile",
    name: "Mobile Repair",
    icon: "Smartphone",
    description: "Screen, battery and software repair.",
    subs: [
      { id: "sub-mob-screen", name: "Screen Replacement", description: "Display and touch repair" },
      { id: "sub-mob-battery", name: "Battery & Charging", description: "Battery and port repair" },
      { id: "sub-mob-software", name: "Software & Data", description: "OS upgrade and data recovery" },
    ],
    services: [
      { id: "svc-mob-screen", name: "Mobile Screen Replacement", sub: "sub-mob-screen", price: 1499, icon: "Smartphone", description: "Original quality display with 30 day warranty." },
      { id: "svc-mob-battery", name: "Mobile Battery Replacement", sub: "sub-mob-battery", price: 999, icon: "BatteryCharging", description: "Genuine battery replacement with old battery buyback." },
      { id: "svc-mob-software", name: "Software Repair & Data Recovery", sub: "sub-mob-software", price: 799, icon: "HardDrive", description: "Bootloop fix, upgrade and recovery of lost data." },
    ],
  },
  {
    id: "cat-gardener",
    name: "Gardener",
    icon: "Leaf",
    description: "Lawns, gardens, plants and tree care.",
    subs: [
      { id: "sub-grd-lawn", name: "Lawn & Garden", description: "Mowing and maintenance" },
      { id: "sub-grd-plant", name: "Plant Care", description: "Indoor and outdoor plants" },
      { id: "sub-grd-tree", name: "Tree Care", description: "Pruning and removal" },
    ],
    services: [
      { id: "svc-grd-lawn", name: "Lawn Maintenance (Per Visit)", sub: "sub-grd-lawn", price: 700, icon: "Leaf", description: "Mowing, edging, weeding and watering." },
      { id: "svc-grd-garden", name: "Garden Setup & Planting", sub: "sub-grd-plant", price: 4500, icon: "Flower2", description: "Garden layout, soil preparation and planting." },
      { id: "svc-grd-tree", name: "Tree Pruning & Shaping", sub: "sub-grd-tree", price: 1800, icon: "Trees", description: "Safe pruning of trees with debris cleanup." },
    ],
  },
  {
    id: "cat-tutor",
    name: "Tutor",
    icon: "GraduationCap",
    description: "Home tuition for school and competitive exams.",
    subs: [
      { id: "sub-tut-school", name: "School Subjects", description: "Class 1 to 12 all subjects" },
      { id: "sub-tut-competitive", name: "Competitive Exams", description: "JEE, NEET, NDA, SSC" },
      { id: "sub-tut-skill", name: "Skill Learning", description: "Spoken English, coding" },
    ],
    services: [
      { id: "svc-tut-home", name: "Home Tuition (Per Hour)", sub: "sub-tut-school", price: 450, icon: "GraduationCap", description: "One-on-one tuition at your home with a verified tutor." },
      { id: "svc-tut-jee", name: "JEE / NEET Crash Course", sub: "sub-tut-competitive", price: 3000, icon: "BookOpen", description: "Two month focused crash course with test series." },
      { id: "svc-tut-english", name: "Spoken English (1 Month)", sub: "sub-tut-skill", price: 3500, icon: "Languages", description: "30 sessions of practical spoken English coaching." },
    ],
  },
  {
    id: "cat-beauty",
    name: "Beauty Services",
    icon: "Heart",
    description: "Salon services at home from verified experts.",
    subs: [
      { id: "sub-bty-hair", name: "Hair Services", description: "Cut, colour, spa and styling" },
      { id: "sub-bty-face", name: "Facial & Skin", description: "Cleanup, facial and waxing" },
      { id: "sub-bty-makeup", name: "Makeup", description: "Bridal and party makeup" },
    ],
    services: [
      { id: "svc-bty-home-salon", name: "Home Salon Session", sub: "sub-bty-hair", price: 1200, icon: "Heart", description: "Haircut, wash, spa and facial at your home." },
      { id: "svc-bty-facial", name: "Gold Facial", sub: "sub-bty-face", price: 1500, icon: "Sparkle", description: "Premium facial with premium products." },
      { id: "svc-bty-bridal", name: "Bridal Makeup Package", sub: "sub-bty-makeup", price: 8500, icon: "Crown", description: "Complete bridal trial and final day makeup." },
    ],
  },
];

export const CATEGORIES: ServiceCategory[] = CATALOG_SEED.map((cat, i) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.name.toLowerCase().replace(/\s+/g, "-"),
  icon: cat.icon,
  description: cat.description,
  isActive: true,
  order: i + 1,
  createdAt: new Date(Date.now() - (200 - i) * 86400000).toISOString(),
  subcategories: cat.subs.map((s) => ({
    id: s.id,
    categoryId: cat.id,
    name: s.name,
    slug: s.name.toLowerCase().replace(/\s+/g, "-"),
    description: s.description,
    isActive: true,
    serviceCount: cat.services.filter((svc) => svc.sub === s.id).length,
  })),
}));

export const SERVICES: Service[] = CATALOG_SEED.flatMap((cat) =>
  cat.services.map((svc) => ({
    id: svc.id,
    name: svc.name,
    slug: svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-"),
    categoryId: cat.id,
    subcategoryId: svc.sub,
    description: svc.description,
    startingPrice: svc.price,
    icon: svc.icon,
    isActive: true,
    workerCount: 0,
    rating: 0,
    shortDescription: svc.description,
    reviewCount: 0,
    includes: [],
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
  })),
);
