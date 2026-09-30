import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

const FALLBACK = Icons.Wrench;

/** Resolves a lucide icon by name so mock data can store icon keys as strings. */
export function DynamicIcon({ name, ...props }: { name?: string } & LucideProps) {
  if (!name) return <FALLBACK {...props} />;
  const key = name as keyof typeof Icons;
  const Icon = (Icons[key] as React.ComponentType<LucideProps>) ?? FALLBACK;
  return <Icon {...props} />;
}

export const CATEGORY_ICON_OPTIONS = [
  "Wrench", "Zap", "Hammer", "Paintbrush", "Car", "AirVent", "Refrigerator", "Sparkles",
  "SprayCan", "SteeringWheel", "Users", "Monitor", "Smartphone", "Leaf", "GraduationCap",
  "Heart", "Scissors", "Sofa", "Waves", "CookingPot", "Shirt", "Baby", "Truck", "Plug",
  "Drill", "Cog", "Home", "Building2", "Droplets", "Snowflake", "Puzzle", "Palette",
];
