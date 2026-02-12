/**
 * Common real estate amenities
 */
export const AMENITIES = [
  { id: "piscina", label: "Piscina", icon: "🏊" },
  { id: "academia", label: "Academia/Centro de Fitness", icon: "💪" },
  { id: "estacionamento", label: "Estacionamento", icon: "🅿️" },
  { id: "ar_condicionado", label: "Ar Condicionado", icon: "❄️" },
  { id: "aquecimento", label: "Aquecimento", icon: "🔥" },
  { id: "lavanderia", label: "Lavanderia", icon: "🧺" },
  { id: "maquina_lavar_louca", label: "Máquina de Lavar Louça", icon: "🍽️" },
  { id: "varanda_patio", label: "Varanda/Patio", icon: "🏡" },
  { id: "jardim", label: "Jardim", icon: "🌳" },
  { id: "garagem", label: "Garagem", icon: "🚗" },
  { id: "sistema_seguranca", label: "Sistema de Segurança", icon: "🔒" },
  { id: "elevador", label: "Elevador", icon: "🛗" },
  { id: "concierge", label: "Concierge", icon: "🎩" },
  { id: "theater", label: "Home Theater", icon: "🎬" },
  { id: "sauna", label: "Sauna", icon: "🧖" },
  { id: "wifi", label: "WiFi Disponível", icon: "📶" },
] as const;

export type AmenityId = (typeof AMENITIES)[number]["id"];

export function getAmenityLabel(id: string): string {
  const amenity = AMENITIES.find(amenityItem => amenityItem.id === id);
  return amenity?.label || id;
}

export function getAmenityIcon(id: string): string {
  const amenity = AMENITIES.find(amenityItem => amenityItem.id === id);
  return amenity?.icon || "✨";
}
