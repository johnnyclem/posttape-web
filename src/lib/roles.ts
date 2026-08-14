import type { Collaborator, CollaboratorRole, Song } from "./types";

export const ROLE_LABEL: Record<CollaboratorRole, string> = {
  owner: "Owner",
  maintainer: "Maintainer",
  contributor: "Contributor",
  listener: "Listener",
};

const RANK: Record<CollaboratorRole, number> = {
  listener: 1,
  contributor: 2,
  maintainer: 3,
  owner: 4,
};

export function roleOnSong(song: Song, userId: string | null | undefined): CollaboratorRole | null {
  if (!userId) return null;
  const row = song.collaborators.find((c) => c.userId === userId);
  if (row) return row.role;
  if (song.ownerId === userId) return "owner";
  return null;
}

export function canAccessSong(song: Song, userId: string | null | undefined): boolean {
  if (song.takedownAt) {
    const role = roleOnSong(song, userId);
    return role === "owner" || role === "maintainer";
  }
  if (song.visibility === "public") return true;
  return roleOnSong(song, userId) != null;
}

export function can(song: Song, userId: string | null | undefined, need: CollaboratorRole): boolean {
  const have = roleOnSong(song, userId);
  if (!have) return false;
  return RANK[have] >= RANK[need];
}

export function canDownloadProject(song: Song, userId: string | null | undefined): boolean {
  return can(song, userId, "contributor");
}

export function canPush(song: Song, userId: string | null | undefined): boolean {
  return can(song, userId, "contributor");
}

export function canManage(song: Song, userId: string | null | undefined): boolean {
  return can(song, userId, "maintainer");
}

export function migrateRole(role: string): CollaboratorRole {
  if (role === "owner" || role === "maintainer" || role === "contributor" || role === "listener") {
    return role;
  }
  if (role === "viewer") return "listener";
  return "contributor";
}

export function normalizeCollaborators(rows: Collaborator[]): Collaborator[] {
  return rows.map((c) => ({ ...c, role: migrateRole(c.role) }));
}
