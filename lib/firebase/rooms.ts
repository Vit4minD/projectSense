import {
  ref,
  get,
  set,
  update,
  remove,
  runTransaction,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
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

function db(d?: Database): Database {
  return d ?? getRtdb();
}

function roomPath(code: string): string {
  return `rooms/${code}`;
}

function playerPath(code: string, uid: string): string {
  return `rooms/${code}/players/${uid}`;
}

export async function createRoom(
  input: CreateRoomInput,
  d?: Database,
): Promise<void> {
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
  await set(ref(db(d), roomPath(input.code)), room);
}

export async function joinRoom(
  input: JoinRoomInput,
  d?: Database,
): Promise<void> {
  const player: RoomPlayer = {
    displayName: input.displayName,
    avatarInitials: input.avatarInitials,
    solved: 0,
    joinedAt: serverTimestamp() as unknown as number,
    finishedAt: null,
  };
  await set(ref(db(d), playerPath(input.code, input.uid)), player);
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
  if (!room) return;
  const players = room.players ?? {};
  const playerEntries = Object.entries(players);
  if (playerEntries.length === 0) {
    await deleteRoom(code, database);
    return;
  }
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
  await runTransaction(ref(db(d), roomPath(code)), (current: Room | null) => {
    if (!current) return current;
    if (current.state !== "lobby") return;
    if (current.host !== hostUid) return;
    current.state = "racing";
    current.startedAt = serverTimestamp() as unknown as number;
    return current;
  });
}

export async function endRace(
  code: string,
  winnerUid: string,
  d?: Database,
): Promise<boolean> {
  const result = await runTransaction(
    ref(db(d), roomPath(code)),
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
  return result.committed;
}

export async function deleteRoom(code: string, d?: Database): Promise<void> {
  await remove(ref(db(d), roomPath(code)));
}

export async function setTrick(
  code: string,
  hostUid: string,
  trickId: string,
  seed: number,
  d?: Database,
): Promise<void> {
  await runTransaction(ref(db(d), roomPath(code)), (current: Room | null) => {
    if (!current) return current;
    if (current.host !== hostUid) return;
    if (current.state !== "lobby") return;
    current.trickId = trickId;
    current.seed = seed;
    return current;
  });
}

export async function setVisibility(
  code: string,
  hostUid: string,
  visibility: RoomVisibility,
  d?: Database,
): Promise<void> {
  await runTransaction(ref(db(d), roomPath(code)), (current: Room | null) => {
    if (!current) return current;
    if (current.host !== hostUid) return;
    current.visibility = visibility;
    return current;
  });
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
}

export function subscribeRoom(
  code: string,
  callback: (room: Room | null) => void,
  d?: Database,
): Unsubscribe {
  return onValue(ref(db(d), roomPath(code)), (snap) => {
    callback(snap.val() as Room | null);
  });
}

export function subscribePublicRooms(
  callback: (rooms: Array<Room & { code: string }>) => void,
  d?: Database,
): Unsubscribe {
  const q = query(
    ref(db(d), "rooms"),
    orderByChild("visibility"),
    equalTo("public"),
  );
  return onValue(q, (snap) => {
    const out: Array<Room & { code: string }> = [];
    snap.forEach((child) => {
      const room = child.val() as Room | null;
      if (room && room.state === "lobby") {
        out.push({ ...room, code: child.key as string });
      }
      return false;
    });
    out.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    callback(out);
  });
}
