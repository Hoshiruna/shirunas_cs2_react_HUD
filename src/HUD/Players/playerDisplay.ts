import { Player } from "csgogsi";

export type DisplayPlayer = Player & {
  displayName?: string;
  displayAvatar?: string;
  displayTeamId?: string | null;
  displaySide?: "CT" | "T";
  displayOrientation?: "left" | "right";
  displayObserverSlot?: number;
};

export const getDisplayName = (player: Player) =>
  (player as DisplayPlayer).displayName || player.name;

export const getDisplayAvatar = (player: Player) =>
  (player as DisplayPlayer).displayAvatar || player.avatar;

export const getDisplayTeamId = (player: Player) =>
  (player as DisplayPlayer).displayTeamId || player.team.id;

export const getDisplaySide = (player: Player) =>
  (player as DisplayPlayer).displaySide || player.team.side;

export const getDisplayOrientation = (player: Player) =>
  (player as DisplayPlayer).displayOrientation || player.team.orientation;

export const getDisplayObserverSlot = (player: Player) =>
  (player as DisplayPlayer).displayObserverSlot ?? player.observer_slot;
