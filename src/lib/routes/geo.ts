const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function polylineDistanceKm(
  points: { latitude: number; longitude: number }[]
): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return Math.round(total * 10) / 10;
}

export function estimateMinutesFromDistance(km: number): number {
  if (km <= 0) return 0;
  return Math.max(5, Math.round((km / 28.6) * 205));
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function defaultStopName(
  order: number,
  total: number,
  area: string
): string {
  if (order === 1) return `1st Stop - ${area} Barangay Hall`;
  if (order === total && total > 1) return `${ordinal(order)} Stop - End`;
  return `Purok ${order - 1}, ${area}`;
}

export function defaultStopDescription(order: number, total: number): string {
  if (order === 1) return "Start point";
  if (order === total && total > 1) return "End point";
  return "Residential Area";
}

export const JASAAN_MAP_CENTER: [number, number] = [8.6543, 124.755];
