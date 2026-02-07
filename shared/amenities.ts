/**
 * Common real estate amenities
 */
export const AMENITIES = [
  { id: "pool", label: "Swimming Pool", icon: "🏊" },
  { id: "gym", label: "Gym/Fitness Center", icon: "💪" },
  { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "ac", label: "Air Conditioning", icon: "❄️" },
  { id: "heating", label: "Heating", icon: "🔥" },
  { id: "laundry", label: "Laundry", icon: "🧺" },
  { id: "dishwasher", label: "Dishwasher", icon: "🍽️" },
  { id: "balcony", label: "Balcony/Patio", icon: "🏡" },
  { id: "garden", label: "Garden", icon: "🌳" },
  { id: "garage", label: "Garage", icon: "🚗" },
  { id: "security", label: "Security System", icon: "🔒" },
  { id: "elevator", label: "Elevator", icon: "🛗" },
  { id: "concierge", label: "Concierge", icon: "🎩" },
  { id: "theater", label: "Home Theater", icon: "🎬" },
  { id: "sauna", label: "Sauna", icon: "🧖" },
  { id: "wifi", label: "WiFi Ready", icon: "📶" },
] as const;

export type AmenityId = (typeof AMENITIES)[number]["id"];

export function getAmenityLabel(id: string): string {
  const amenity = AMENITIES.find((a) => a.id === id);
  return amenity?.label || id;
}

export function getAmenityIcon(id: string): string {
  const amenity = AMENITIES.find((a) => a.id === id);
  return amenity?.icon || "✨";
}
