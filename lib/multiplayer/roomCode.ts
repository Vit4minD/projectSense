export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const ROOM_CODE_LENGTH = 5;

export function generateRoomCode(rng: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const idx = Math.floor(rng() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[idx];
  }
  return code;
}

export function normalizeRoomCode(input: string): string | null {
  const candidate = input.trim().toUpperCase();
  if (candidate.length !== ROOM_CODE_LENGTH) return null;
  for (const ch of candidate) {
    if (!ROOM_CODE_ALPHABET.includes(ch)) return null;
  }
  return candidate;
}
