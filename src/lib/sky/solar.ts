export type Season = "winter" | "spring" | "summer" | "autumn";
export type Phase = "night" | "dawn" | "day" | "dusk";

export type Sky = {
  phase: Phase;
  season: Season;
  sun: number;
  rise: number;
  set: number;
  lat: number;
  lon: number;
};

const TZ: Record<string, [number, number]> = {
  "America/Toronto": [42.32, -82.54],
  "America/New_York": [40.71, -74.01],
  "America/Chicago": [41.88, -87.63],
  "America/Denver": [39.74, -104.99],
  "America/Los_Angeles": [34.05, -118.24],
  "America/Vancouver": [49.28, -123.12],
  "America/Edmonton": [53.55, -113.49],
  "America/Winnipeg": [49.9, -97.14],
  "America/Halifax": [44.65, -63.57],
  "America/St_Johns": [47.56, -52.71],
  "Europe/London": [51.51, -0.13],
  "Europe/Paris": [48.86, 2.35],
  "Australia/Sydney": [-33.87, 151.21],
};

export function place(): [number, number] {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TZ[tz] || [42.32, -82.54];
}

export function seasonOf(d: Date, lat: number): Season {
  const m = d.getMonth();
  const south = lat < 0;
  const k = south ? (m + 6) % 12 : m;
  if (k < 2 || k === 11) return "winter";
  if (k < 5) return "spring";
  if (k < 8) return "summer";
  return "autumn";
}

export function sky(d: Date, lat: number, lon: number): Sky {
  const { rise, set } = sunTimes(d, lat, lon);
  const t = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const twilight = 0.75;
  let phase: Phase = "day";
  if (t < rise - twilight || t >= set + twilight) phase = "night";
  else if (t < rise + twilight) phase = "dawn";
  else if (t >= set - twilight) phase = "dusk";
  const span = Math.max(0.2, set - rise);
  const sun = Math.max(0, Math.min(1, (t - rise) / span));
  return { phase, season: seasonOf(d, lat), sun, rise, set, lat, lon };
}

function sunTimes(d: Date, lat: number, lon: number) {
  const day = julian(d) - 2451545 + 0.0008;
  const J = day - lon / 360;
  const M = (357.5291 + 0.98560028 * J) % 360;
  const C = 1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545 + J + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
  const dcl = Math.asin(sin(L) * sin(23.4397));
  const ha = Math.acos((sin(-0.833 * (Math.PI / 180)) - sinDeg(lat) * Math.sin(dcl)) / (cosDeg(lat) * Math.cos(dcl)));
  if (!Number.isFinite(ha)) return { rise: 6, set: 18 };
  const jr = Jt - ha / (2 * Math.PI);
  const js = Jt + ha / (2 * Math.PI);
  return { rise: julianHour(jr, d), set: julianHour(js, d) };
}

function julian(d: Date) {
  return d.getTime() / 86400000 + 2440587.5;
}
function julianHour(J: number, d: Date) {
  const utc = (J - 2440587.5) * 24;
  const local = utc + d.getTimezoneOffset() / -60;
  let h = local % 24;
  if (h < 0) h += 24;
  return h;
}
function sin(d: number) {
  return Math.sin((d * Math.PI) / 180);
}
function sinDeg(d: number) {
  return Math.sin((d * Math.PI) / 180);
}
function cosDeg(d: number) {
  return Math.cos((d * Math.PI) / 180);
}
