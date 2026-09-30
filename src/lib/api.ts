/**
 * Thin transport helpers used by every mock service module.
 * These are the only place that knows we are talking to a fake backend,
 * so swapping in real HTTP calls means replacing `apiRequest` only.
 */

export const API_BASE = "/api";

export function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export function delayError(message: string, ms = 380): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function byNewest<T extends { createdAt: string }>(a: T, b: T) {
  return +new Date(b.createdAt) - +new Date(a.createdAt);
}
