export type Coords = { lat: number; lng: number };

export const CITY_COORDS: Record<string, Coords> = {
  casablanca: { lat: 33.5731, lng: -7.5898 },
  rabat: { lat: 34.0209, lng: -6.8416 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
  fes: { lat: 34.0331, lng: -5.0003 },
  fès: { lat: 34.0331, lng: -5.0003 },
  tanger: { lat: 35.7595, lng: -5.834 },
  agadir: { lat: 30.4278, lng: -9.5981 },
  meknes: { lat: 33.8935, lng: -5.5473 },
  meknès: { lat: 33.8935, lng: -5.5473 },
  oujda: { lat: 34.6867, lng: -1.9114 },
  kenitra: { lat: 34.261, lng: -6.5802 },
  kénitra: { lat: 34.261, lng: -6.5802 },
  tetouan: { lat: 35.5889, lng: -5.3626 },
  tétouan: { lat: 35.5889, lng: -5.3626 },
  safi: { lat: 32.2994, lng: -9.2372 },
  mohammedia: { lat: 33.6866, lng: -7.3829 },
  eljadida: { lat: 33.2316, lng: -8.5007 },
  'el jadida': { lat: 33.2316, lng: -8.5007 },
  nador: { lat: 35.1681, lng: -2.9335 },
  beni_mellal: { lat: 32.3373, lng: -6.3498 },
  'béni mellal': { lat: 32.3373, lng: -6.3498 },
  'beni mellal': { lat: 32.3373, lng: -6.3498 },
  essaouira: { lat: 31.5085, lng: -9.7595 },
  dakhla: { lat: 23.6848, lng: -15.9579 },
  laayoune: { lat: 27.1253, lng: -13.1625 },
  laâyoune: { lat: 27.1253, lng: -13.1625 },
  ouarzazate: { lat: 30.9189, lng: -6.8934 },
  taza: { lat: 34.2133, lng: -4.0103 },
  settat: { lat: 33.0011, lng: -7.6166 },
  khouribga: { lat: 32.8811, lng: -6.9063 },
  larache: { lat: 35.1932, lng: -6.1557 },
  al_hoceima: { lat: 35.2517, lng: -3.9372 },
  'al hoceima': { lat: 35.2517, lng: -3.9372 },
  errachidia: { lat: 31.9314, lng: -4.4244 },
  tiznit: { lat: 29.6974, lng: -9.7316 },
  taroudant: { lat: 30.4703, lng: -8.8769 },
  saidia: { lat: 35.0868, lng: -2.2299 },
  'saïdia': { lat: 35.0868, lng: -2.2299 }
};

const normalize = (city: string) => city.trim().toLowerCase();

export function coordsForCity(city?: string | null): Coords | null {
  if (!city) return null;
  return CITY_COORDS[normalize(city)] ?? null;
}

export function distanceKm(a: Coords, b: Coords): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
