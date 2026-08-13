const GUEST_SEED_KEY = "tenet-content-guest-seed";

// stringden seed üretir
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// seed ile rastgele sayı üretir
function randomFromSeed(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// kayıtlı misafir idsi okur
function readGuestSeed(): string | null {
  try {
    return window.localStorage.getItem(GUEST_SEED_KEY);
  } catch {
    return null;
  }
}

// misafir seedi getirir veya üretir
function guestSeed(): string {
  if (typeof window === "undefined") return "guest";
  const stored = readGuestSeed();
  if (stored) return stored;

  const generated = window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    window.localStorage.setItem(GUEST_SEED_KEY, generated);
  } catch {
    return generated;
  }
  return generated;
}

// günlük içerik anahtarı üretir
export function contentAudienceKey(
  email?: string | null,
  profileId?: string | null,
): string {
  const identity = email?.trim().toLowerCase() || guestSeed();
  const day = new Date().toLocaleDateString("en-CA");
  return `${identity}:${profileId || "default"}:${day}`;
}

// seed ile diziyi karıştırır
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  const random = randomFromSeed(hashSeed(seed));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
