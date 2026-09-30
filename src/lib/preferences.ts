export type Language = "en" | "hi" | "mr";
export type Density = "comfortable" | "compact";
export type DateFormat = "dd-mm-yyyy" | "dd-mmm-yyyy" | "yyyy-mm-dd";
export type TimeFormat = "12h" | "24h";

export interface UserPreferences {
  language: Language;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  density: Density;
  notifications: {
    emailBookingUpdates: boolean;
    emailPromotions: boolean;
    smsBookingUpdates: boolean;
    pushBookingUpdates: boolean;
    pushPromotions: boolean;
  };
  quietHours: {
    enabled: boolean;
    from: string;
    to: string;
  };
  walletTopUpReminders: boolean;
  defaultPaymentMethod: "UPI" | "CARD" | "CASH" | "WALLET";
  autoConfirmBookings: boolean;
  shareBookingLocation: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "en",
  dateFormat: "dd-mmm-yyyy",
  timeFormat: "12h",
  density: "comfortable",
  notifications: {
    emailBookingUpdates: true,
    emailPromotions: false,
    smsBookingUpdates: true,
    pushBookingUpdates: true,
    pushPromotions: false,
  },
  quietHours: {
    enabled: false,
    from: "22:00",
    to: "07:00",
  },
  walletTopUpReminders: true,
  defaultPaymentMethod: "UPI",
  autoConfirmBookings: false,
  shareBookingLocation: true,
};

const PREFS_KEY = "kaamwala.preferences.v1";

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function coerce(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_PREFERENCES;
  const input = raw as Partial<UserPreferences>;
  const notifications = (input.notifications ?? {}) as Partial<UserPreferences["notifications"]>;
  const quietHours = (input.quietHours ?? {}) as Partial<UserPreferences["quietHours"]>;
  const merged: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...input,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...Object.fromEntries(
        Object.entries(notifications).filter(([, v]) => isBool(v)),
      ),
    },
    quietHours: {
      ...DEFAULT_PREFERENCES.quietHours,
      ...(typeof quietHours.from === "string" ? { from: quietHours.from } : {}),
      ...(typeof quietHours.to === "string" ? { to: quietHours.to } : {}),
      ...(isBool(quietHours.enabled) ? { enabled: quietHours.enabled } : {}),
    },
  };
  return merged;
}

export function readPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? coerce(JSON.parse(raw)) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(preferences: UserPreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  } catch {
    // storage unavailable: preferences stay in memory for this session
  }
}

export function resetPreferences(): UserPreferences {
  writePreferences(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
}
