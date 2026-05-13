import * as I from "csgogsi";
import { Match, Veto } from "../API/types";

type Side = "CT" | "T";
type Orientation = "left" | "right";

const oppositeSide = (side: Side): Side => (side === "CT" ? "T" : "CT");

const normalizeMapName = (mapName: string) =>
  mapName.toLowerCase().replace(/^de_/, "");

const getActiveVeto = (match: Match | null, mapName: string) => {
  if (!match) {
    return null;
  }
  const normalizedMapName = normalizeMapName(mapName);
  return (
    match.vetos.find(
      (veto) => normalizeMapName(veto.mapName) === normalizedMapName
    ) || null
  );
};

const getOrientationTeam = (map: I.Map, orientation: Orientation) =>
  map.team_ct.orientation === orientation ? map.team_ct : map.team_t;

const getTeamById = (map: I.Map, teamId?: string | null) => {
  if (!teamId) {
    return null;
  }
  return [map.team_ct, map.team_t].find((team) => team.id === teamId) || null;
};

const getSideTeam = (map: I.Map, side: Side) =>
  side === "CT" ? map.team_ct : map.team_t;

const getVetoLeftSide = (veto: Veto | null): Side | null => {
  if (!veto || !veto.gsiSideOverride) {
    return null;
  }
  if (veto.leftSide) {
    return veto.leftSide;
  }
  if (!veto.gsiLeftSide) {
    return null;
  }
  return veto.hudReverseSide || veto.reverseSide
    ? oppositeSide(veto.gsiLeftSide)
    : veto.gsiLeftSide;
};

const mergeDisplayTeam = (
  identityTeam: I.Team,
  sideTeam: I.Team,
  side: Side,
  orientation: Orientation
): I.Team => ({
  ...sideTeam,
  ...identityTeam,
  score: sideTeam.score,
  consecutive_round_losses: sideTeam.consecutive_round_losses,
  timeouts_remaining: sideTeam.timeouts_remaining,
  side,
  orientation,
});

export const getDisplayTeams = (map: I.Map, match: Match | null) => {
  const activeVeto = getActiveVeto(match, map.name);
  const leftSide = getVetoLeftSide(activeVeto);

  if (match && leftSide) {
    const rightSide = oppositeSide(leftSide);
    const leftIdentity =
      getTeamById(map, match.left.id) || getOrientationTeam(map, "left");
    const rightIdentity =
      getTeamById(map, match.right.id) || getOrientationTeam(map, "right");

    return {
      activeVeto,
      isPinned: true,
      left: mergeDisplayTeam(
        leftIdentity,
        getSideTeam(map, leftSide),
        leftSide,
        "left"
      ),
      right: mergeDisplayTeam(
        rightIdentity,
        getSideTeam(map, rightSide),
        rightSide,
        "right"
      ),
    };
  }

  return {
    activeVeto,
    isPinned: false,
    left: getOrientationTeam(map, "left"),
    right: getOrientationTeam(map, "right"),
  };
};

const getObserverSlotOrder = (player: I.Player) => {
  const slot = player.observer_slot || 0;
  return slot === 0 ? 10 : slot;
};

const assignPlayerTeam = (player: I.Player, team: I.Team): I.Player => ({
  ...player,
  team: {
    ...player.team,
    ...team,
  },
});

export const getDisplayState = (game: I.CSGO, match: Match | null) => {
  const teams = getDisplayTeams(game.map, match);

  if (!teams.isPinned) {
    return {
      ...teams,
      players: game.players,
      leftPlayers: game.players.filter(
        (player) => player.team.side === teams.left.side
      ),
      rightPlayers: game.players.filter(
        (player) => player.team.side === teams.right.side
      ),
      currentPlayer: game.player,
    };
  }

  const sortedPlayers = [...game.players].sort(
    (a, b) => getObserverSlotOrder(a) - getObserverSlotOrder(b)
  );
  const leftPlayers = sortedPlayers
    .slice(0, 5)
    .map((player) => assignPlayerTeam(player, teams.left));
  const rightPlayers = sortedPlayers
    .slice(5, 10)
    .map((player) => assignPlayerTeam(player, teams.right));
  const players = [...leftPlayers, ...rightPlayers];
  const currentPlayer =
    players.find((player) => player.steamid === game.player?.steamid) ||
    game.player;

  return {
    ...teams,
    players,
    leftPlayers,
    rightPlayers,
    currentPlayer,
  };
};
