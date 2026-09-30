import { delay } from "@/lib/api";
import type { PlatformSettings } from "@/types";

const SETTINGS_KEY = "kaamwala.settings.v1";

export const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "KaamWala",
  tagline: "Har Kaam Ka Bharosemand Saathi",
  supportEmail: "support@kaamwala.com",
  supportPhone: "+91 90000 12345",
  commissionPercent: 10,
  gstPercent: 18,
  minBookingAmount: 199,
  autoVerifyWorkers: false,
  maintenanceMode: false,
  bookingWindowDays: 30,
  notifications: {
    emailBookingUpdates: true,
    emailPromotions: false,
    smsBookingUpdates: true,
    pushEnabled: true,
  },
  security: {
    twoFactor: false,
    sessionTimeoutMinutes: 60,
  },
};

export function readSettings(): PlatformSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as PlatformSettings) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: PlatformSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function getSettings() {
  return delay(readSettings(), 200);
}

export async function saveSettings(settings: PlatformSettings) {
  writeSettings(settings);
  return delay(settings, 620);
}
