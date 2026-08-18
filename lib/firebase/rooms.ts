import {
  ref,
  get,
  set,
  update,
  remove,
  runTransaction,
  onValue,
  onDisconnect,
  serverTimestamp,
  query,
  orderByChild,
  type Database,
  type Unsubscribe,
} from "firebase/database";
import type { Room, RoomPlayer, RoomVisibility } from "@/lib/types";
import { getRtdb } from "./client";

export type CreateRoomInput = {
  code: string;
  host: string;
  hostDisplayName: string;
  hostAvatarInitials: string;
  trickId: string;
  seed: number;
  visibility: RoomVisibility;
};

export type JoinRoomInput = {
  code: string;
  uid: string;
  displayName: string;
  avatarInitials: string;
};

// A lean, world-readable (to authed users) advertisement of a joinable public
// room. It intentionally carries NO player display names — only the host uid
// (a non-identifying handle), the trick, a headcount and a timestamp — so the
// public lobby can list open games WITHOUT exposing who (which kids) are online
// or the codes of private rooms. See database.rules.json `roomIndex`.
export type RoomIndexEntry = {
  code: string;
  trickId: string;
  host: string;
  playerCount: number;
  createdAt: number;
};

// Hard cap on players. Enforced authoritatively for public rooms via the
// roomIndex.playerCount validate rule (1..8); best-effort here on the client.
const MAX_PLAYERS = 8;

function db(d?: Database): Database {
  return d ?? getRtdb();
}

function roomPath(code: string): string {
  return `rooms/${code}`;
}

function playerPath(code: string, uid: string): string {
  return `rooms/${code}/players/${uid}`;
}

function roomIndexPath(code: string): string {
  return `roomIndex/${code}`;
}

function playerCount(room: Room): number {
  return Object.keys(room.players ?? {}).length;
}

// A room is advertised in roomIndex only while it is a joinable public lobby.
function isAdvertisable(room: Pick<Room, "visibility" | "state">): boolean {
  return room.visibility === "public" && room.state === "lobby";
}

export async function createRoom(
  input: CreateRoomInput,
  d?: Database,
): Promise<void> {
  const database = db(d);
  const hostPlayer: RoomPlayer = {
    displayName: input.hostDisplayName,
    avatarInitials: input.hostAvatarInitials,
    solved: 0,
    joinedAt: serverTimestamp() as unknown as number,
    finishedAt: null,
  };
  const room: Room = {
    host: input.host,
    trickId: input.trickId,
    seed: input.seed,
    questionCount: 5,
    visibility: input.visibility,
    state: "lobby",
    createdAt: serverTimestamp() as unknown as number,
    startedAt: null,
    endedAt: null,
    winnerUid: null,
    players: { [input.host]: hostPlayer },
  };
  await set(ref(database, roomPath(input.code)), room);
  // Advertise public rooms in the world-readable index (private rooms stay
  // discoverable only by code — the invite model).
  if (input.visibility === "public") {
    await set(ref(database, roomIndexPath(input.code)), {
      trickId: input.trickId,
      host: input.host,
      playerCount: 1,
      createdAt: serverTimestamp() as unknown as number,
    });
  }
}

export async function joinRoom(
  input: JoinRoomInput,
  d?: Database,
): Promise<void> {
  const database = db(d);
  const player: RoomPlayer = {
    displayName: input.displayName,
    avatarInitials: input.avatarInitials,
    solved: 0,
    joinedAt: serverTimestamp() as unknown as number,
    finishedAt: null,
  };
  // The joining client does NOT need to read the room itself (reads are gated
  // to participants). It writes its own player slot; the rules only permit this
  // while the room is in 'lobby'.
  await set(ref(database, playerPath(input.code, input.uid)), player);
  // Bump the public headcount when this room is advertised. The transaction
  // aborts cleanly (returns undefined) when no index entry exists — i.e. the
  // room is private or not a lobby — so this is safe for every join path.
  await runTransaction(
    ref(database, `${roomIndexPath(input.code)}/playerCount`),
    (current: number | null) => {
      if (current === null || current === undefined) return undefined;
      return Math.min(MAX_PLAYERS, current + 1);
    },
  );
}

export async function leaveRoom(
  code: string,
  uid: string,
  d?: Database,
): Promise<void> {
  const database = db(d);
  await remove(ref(database, playerPath(code, uid)));
  const snap = await get(ref(database, roomPath(code)));
  const room = snap.val() as Room | null;
  if (!room) {
    await remove(ref(database, roomIndexPath(code)));
    return;
  }
  const players = room.players ?? {};
  const playerEntries = Object.entries(players);
  if (playerEntries.length === 0) {
    await deleteRoom(code, database);
    return;
  }
  // Keep the advertised headcount in sync (aborts if not advertised).
  await runTransaction(
    ref(database, `${roomIndexPath(code)}/playerCount`),
    (current: number | null) => {
      if (current === null || current === undefined) return undefined;
      return playerEntries.length;
    },
  );
  if (room.host === uid) {
    const nextHost = playerEntries.reduce<[string, RoomPlayer]>(
      (best, cur) => (cur[1].joinedAt < best[1].joinedAt ? cur : best),
      playerEntries[0],
    );
    await runTransaction(ref(database, roomPath(code)), (current: Room | null) => {
      if (!current) return current;
      if (current.host !== uid) return current;
      const stillPresent = current.players && current.players[nextHost[0]];
      if (!stillPresent) return current;
      current.host = nextHost[0];
      return current;
    });
  }
}

export async function incrementSolved(
  code: string,
  uid: string,
  d?: Database,
): Promise<number> {
  const result = await runTransaction(
    ref(db(d), `${playerPath(code, uid)}/solved`),
    (current: number | null) => (typeof current === "number" ? current : 0) + 1,
  );
  return (result.snapshot.val() as number) ?? 0;
}

export async function startRace(
  code: string,
  hostUid: string,
  d?: Database,
): Promise<void> {
  const database = db(d);
  await runTransaction(ref(database, roomPath(code)), (current: Room | null) => {
    if (!current) return current;
    if (current.state !== "lobby") return;
    if (current.host !== hostUid) return;
    current.state = "racing";
    current.startedAt = serverTimestamp() as unknown as number;
    return current;
  });
  // No longer a joinable lobby — drop it from the public index (idempotent).
  await remove(ref(database, roomIndexPath(code)));
}

export async function endRace(
  code: string,
  winnerUid: string,
  d?: Database,
): Promise<boolean> {
  const database = db(d);
  const result = await runTransaction(
    ref(database, roomPath(code)),
    (current: Room | null) => {
      if (!current) return current;
      if (current.state === "ended") return;
      current.state = "ended";
      current.winnerUid = winnerUid;
      current.endedAt = serverTimestamp() as unknown as number;
      if (current.players && current.players[winnerUid]) {
        current.players[winnerUid].finishedAt =
          serverTimestamp() as unknown as number;
      }
      return current;
    },
  );
  // Ensure the ended room is not advertised (idempotent).
  await remove(ref(database, roomIndexPath(code)));
  return result.committed;
}

// Lets a remaining participant take over as host when the original host has
// vanished (their player node was removed on disconnect). Rules permit this
// only when the current host is no longer a player and the caller is one.
export async function claimHost(
  code: string,
  uid: string,
  d?: Database,
): Promise<boolean> {
  const result = await runTransaction(
    ref(db(d), roomPath(code)),
    (current: Room | null) => {
      if (!current) return current;
      const players = current.players ?? {};
      // Only claim when the current host has actually left the player list.
      if (players[current.host]) return current;
      if (!players[uid]) return current;
      current.host = uid;
      return current;
    },
  );
  return result.committed;
}

export async function deleteRoom(code: string, d?: Database): Promise<void> {
  const database = db(d);
  await remove(ref(database, roomPath(code)));
  await remove(ref(database, roomIndexPath(code)));
}

export async function setTrick(
  code: string,
  hostUid: string,
  trickId: string,
  seed: number,
  d?: Database,
): Promise<void> {
  const database = db(d);
  await runTransaction(ref(database, roomPath(code)), (current: Room | null) => {
    if (!current) return current;
    if (current.host !== hostUid) return;
    if (current.state !== "lobby") return;
    current.trickId = trickId;
    current.seed = seed;
    return current;
  });
  // Keep the advertised trick fresh (aborts if the room is not advertised).
  await runTransaction(
    ref(database, `${roomIndexPath(code)}/trickId`),
    (current: string | null) => {
      if (current === null || current === undefined) return undefined;
      return trickId;
    },
  );
}

export async function setVisibility(
  code: string,
  hostUid: string,
  visibility: RoomVisibility,
  d?: Database,
): Promise<void> {
  const database = db(d);
  await runTransaction(ref(database, roomPath(code)), (current: Room | null) => {
    if (!current) return current;
    if (current.host !== hostUid) return;
    current.visibility = visibility;
    return current;
  });
  // Reconcile the public index with the new visibility.
  const snap = await get(ref(database, roomPath(code)));
  const room = snap.val() as Room | null;
  if (!room) return;
  if (isAdvertisable(room)) {
    await set(ref(database, roomIndexPath(code)), {
      trickId: room.trickId,
      host: room.host,
      playerCount: playerCount(room),
      createdAt: serverTimestamp() as unknown as number,
    });
  } else {
    await remove(ref(database, roomIndexPath(code)));
  }
}

export async function resetRoom(
  code: string,
  hostUid: string,
  seed: number,
  d?: Database,
): Promise<void> {
  const database = db(d);
  const snap = await get(ref(database, roomPath(code)));
  const room = snap.val() as Room | null;
  if (!room) return;
  if (room.host !== hostUid) return;
  const updates: Record<string, unknown> = {
    state: "lobby",
    seed,
    startedAt: null,
    endedAt: null,
    winnerUid: null,
  };
  for (const uid of Object.keys(room.players ?? {})) {
    updates[`players/${uid}/solved`] = 0;
    updates[`players/${uid}/finishedAt`] = null;
  }
  await update(ref(database, roomPath(code)), updates);
  // Back in the lobby: re-advertise public rooms.
  if (room.visibility === "public") {
    await set(ref(database, roomIndexPath(code)), {
      trickId: room.trickId,
      host: room.host,
      playerCount: playerCount(room),
      createdAt: serverTimestamp() as unknown as number,
    });
  }
}

// Sets an onDisconnect trigger removing this client's own player slot, so a
// dropped connection (including the host's) is reflected in the room. Returns a
// cleanup that cancels the trigger for graceful unmounts (normal navigation
// uses leaveRoom instead).
export function setupRaceDisconnect(
  code: string,
  uid: string,
  d?: Database,
): () => void {
  const handle = onDisconnect(ref(db(d), playerPath(code, uid)));
  void handle.remove();
  return () => {
    void handle.cancel();
  };
}

export function subscribeRoom(
  code: string,
  callback: (room: Room | null) => void,
  onError?: (error: Error) => void,
  d?: Database,
): Unsubscribe {
  return onValue(
    ref(db(d), roomPath(code)),
    (snap) => {
      callback(snap.val() as Room | null);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribePublicRooms(
  callback: (rooms: RoomIndexEntry[]) => void,
  onError?: (error: Error) => void,
  d?: Database,
): Unsubscribe {
  const q = query(ref(db(d), "roomIndex"), orderByChild("createdAt"));
  return onValue(
    q,
    (snap) => {
      const out: RoomIndexEntry[] = [];
      snap.forEach((child) => {
        const entry = child.val() as Omit<RoomIndexEntry, "code"> | null;
        if (entry) {
          out.push({ ...entry, code: child.key as string });
        }
        return false;
      });
      out.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      callback(out);
    },
    (error) => {
      onError?.(error);
    },
  );
}
