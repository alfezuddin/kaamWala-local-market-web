import { delay } from "@/lib/api";
import { getDb } from "@/mock/db";
import type { Service, ServiceCategory, Worker } from "@/types";

export interface GlobalSearchResults {
  services: Service[];
  workers: Worker[];
  categories: ServiceCategory[];
}

export async function globalSearch(term: string) {
  const q = term.trim().toLowerCase();
  if (q.length < 2) {
    return delay<GlobalSearchResults>({ services: [], workers: [], categories: [] }, 120);
  }
  const db = getDb();
  const services = db.services
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        db.categories.find((c) => c.id === s.categoryId)?.name.toLowerCase().includes(q),
    )
    .slice(0, 6);
  const workers = db.workers
    .filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.headline.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        w.skills.some((s) => s.toLowerCase().includes(q)) ||
        db.categories.find((c) => c.id === w.categoryId)?.name.toLowerCase().includes(q),
    )
    .slice(0, 6);
  const categories = db.categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4);
  return delay<GlobalSearchResults>({ services, workers, categories }, 260);
}
