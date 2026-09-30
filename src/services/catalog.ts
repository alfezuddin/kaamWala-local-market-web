import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { Service, ServiceCategory, Subcategory } from "@/types";

export async function getCategories(includeInactive = false) {
  const db = getDb();
  const list = includeInactive ? db.categories : db.categories.filter((c) => c.isActive);
  return delay(list, 240);
}

export async function getCategoryBySlug(slug: string) {
  const db = getDb();
  return delay(db.categories.find((c) => c.slug === slug) ?? null, 220);
}

export async function getCategoryById(id: string) {
  const db = getDb();
  return delay(db.categories.find((c) => c.id === id) ?? null, 200);
}

export interface ServiceFilters {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: "recommended" | "rating" | "price_asc" | "price_desc";
  /** Admin only: include hidden services in the result. */
  includeInactive?: boolean;
}

export async function getServices(filters: ServiceFilters = {}) {
  const db = getDb();
  let list: Service[] = filters.includeInactive
    ? [...db.services]
    : db.services.filter((s) => s.isActive);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        db.categories.find((c) => c.id === s.categoryId)?.name.toLowerCase().includes(q),
    );
  }
  if (filters.categoryId) list = list.filter((s) => s.categoryId === filters.categoryId);
  if (filters.subcategoryId) list = list.filter((s) => s.subcategoryId === filters.subcategoryId);
  if (filters.minPrice !== undefined) list = list.filter((s) => s.startingPrice >= filters.minPrice!);
  if (filters.maxPrice !== undefined) list = list.filter((s) => s.startingPrice <= filters.maxPrice!);
  if (filters.minRating) list = list.filter((s) => s.rating >= filters.minRating!);

  switch (filters.sort) {
    case "rating":
      list = [...list].sort((a, b) => b.rating - a.rating);
      break;
    case "price_asc":
      list = [...list].sort((a, b) => a.startingPrice - b.startingPrice);
      break;
    case "price_desc":
      list = [...list].sort((a, b) => b.startingPrice - a.startingPrice);
      break;
    default:
      list = [...list].sort((a, b) => b.workerCount - a.workerCount);
  }
  return delay(list, 300);
}

export async function getServiceById(id: string) {
  const db = getDb();
  return delay(db.services.find((s) => s.id === id) ?? null, 200);
}

export async function getServiceBySlug(slug: string) {
  const db = getDb();
  return delay(db.services.find((s) => s.slug === slug) ?? null, 200);
}

export async function getServicesByCategory(categoryId: string) {
  const db = getDb();
  return delay(db.services.filter((s) => s.categoryId === categoryId && s.isActive), 260);
}

export async function getPopularServices(limit = 8) {
  const db = getDb();
  return delay([...db.services].filter((s) => s.isActive).sort((a, b) => b.workerCount - a.workerCount).slice(0, limit), 260);
}

export async function getRelatedServices(serviceId: string, limit = 4) {
  const db = getDb();
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) return delay<Service[]>([], 200);
  return delay(
    db.services.filter((s) => s.categoryId === service.categoryId && s.id !== service.id).slice(0, limit),
    240,
  );
}

export async function getWorkersForService(serviceId: string) {
  const db = getDb();
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) return delay([], 240);
  return delay(
    db.workers
      .filter((w) => w.verification === "APPROVED" && w.serviceIds.includes(serviceId))
      .sort((a, b) => b.rating - a.rating),
    300,
  );
}

export async function getSubcategories(categoryId: string) {
  const db = getDb();
  const cat = db.categories.find((c) => c.id === categoryId);
  return delay<Subcategory[]>(cat?.subcategories ?? [], 200);
}

export interface CategoryInput {
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
}

export async function createCategory(input: CategoryInput) {
  return mutate((db) => {
    const category: ServiceCategory = {
      id: makeId("cat"),
      name: input.name,
      slug: input.name.toLowerCase().replace(/\s+/g, "-"),
      icon: input.icon,
      description: input.description,
      isActive: input.isActive,
      order: db.categories.length + 1,
      subcategories: [],
      createdAt: new Date().toISOString(),
    };
    db.categories.push(category);
    return delay(category, 550);
  });
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  return mutate((db) => {
    const category = db.categories.find((c) => c.id === id);
    if (!category) throw new Error("Category not found");
    Object.assign(category, input);
    return delay(category, 520);
  });
}

export async function deleteCategory(id: string) {
  return mutate((db) => {
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    const [removed] = db.categories.splice(index, 1);
    db.services = db.services.filter((s) => s.categoryId !== id);
    return delay(removed, 480);
  });
}

export async function createSubcategory(categoryId: string, input: { name: string; description: string; isActive: boolean }) {
  return mutate((db) => {
    const category = db.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error("Category not found");
    const sub: Subcategory = {
      id: makeId("sub"),
      categoryId,
      name: input.name,
      slug: input.name.toLowerCase().replace(/\s+/g, "-"),
      description: input.description,
      isActive: input.isActive,
      serviceCount: 0,
    };
    category.subcategories.push(sub);
    return delay(sub, 500);
  });
}

export async function updateSubcategory(categoryId: string, subId: string, input: Partial<{ name: string; description: string; isActive: boolean }>) {
  return mutate((db) => {
    const category = db.categories.find((c) => c.id === categoryId);
    const sub = category?.subcategories.find((s) => s.id === subId);
    if (!sub) throw new Error("Subcategory not found");
    Object.assign(sub, input);
    return delay(sub, 480);
  });
}

export async function deleteSubcategory(categoryId: string, subId: string) {
  return mutate((db) => {
    const category = db.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error("Category not found");
    category.subcategories = category.subcategories.filter((s) => s.id !== subId);
    db.services = db.services.filter((s) => s.subcategoryId !== subId);
    return delay(subId, 420);
  });
}

export interface ServiceInput {
  name: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  startingPrice: number;
  icon: string;
  isActive: boolean;
}

export async function createService(input: ServiceInput) {
  return mutate((db) => {
    const category = db.categories.find((c) => c.id === input.categoryId);
    if (!category) throw new Error("Category not found");
    const service: Service = {
      id: makeId("svc"),
      name: input.name,
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-"),
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      description: input.description,
      startingPrice: input.startingPrice,
      icon: input.icon,
      isActive: input.isActive,
      workerCount: 0,
      rating: 0,
      shortDescription: input.description,
      reviewCount: 0,
      includes: [],
      createdAt: new Date().toISOString(),
    };
    db.services.unshift(service);
    return delay(service, 560);
  });
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  return mutate((db) => {
    const service = db.services.find((s) => s.id === id);
    if (!service) throw new Error("Service not found");
    Object.assign(service, input);
    return delay(service, 520);
  });
}

export async function deleteService(id: string) {
  return mutate((db) => {
    const index = db.services.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Service not found");
    const [removed] = db.services.splice(index, 1);
    return delay(removed, 450);
  });
}

export async function getCategoryStats() {
  const db = getDb();
  return delay(
    db.categories.map((c) => {
      const services = db.services.filter((s) => s.categoryId === c.id);
      const workers = db.workers.filter((w) => w.categoryId === c.id);
      const bookings = db.bookings.filter((b) => b.categoryId === c.id);
      return {
        category: c,
        services: services.length,
        workers: workers.length,
        bookings: bookings.length,
        revenue: bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.price, 0),
      };
    }),
    300,
  );
}

/** Admin view: services enriched with category, subcategory and booking totals. */
export async function getAdminServices(filters: ServiceFilters = {}) {
  const db = getDb();
  const base = await getServices(filters);
  return delay(
    base.map((s) => ({
      ...s,
      category: db.categories.find((c) => c.id === s.categoryId) ?? null,
      subcategory: s.subcategoryId
        ? (db.categories.find((c) => c.id === s.categoryId)?.subcategories.find((sub) => sub.id === s.subcategoryId) ??
          null)
        : null,
      bookingCount: db.bookings.filter((b) => b.serviceId === s.id).length,
      completedCount: db.bookings.filter((b) => b.serviceId === s.id && b.status === "COMPLETED").length,
    })),
    300,
  );
}

export { byNewest };
