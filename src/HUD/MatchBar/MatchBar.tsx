import * as I from "csgogsi";
import "./styles/index.scss";
import TeamScore from "./TeamScore";
import WinAnnouncement from "./WinIndicator";
import BombTimer from "./../Timers/BombTimer";
import { MAX_TIMER, useBombTimer } from "./../Timers/Countdown";
import { C4 } from "../../assets/Icons";
import { Match } from "./../../API/types";
import { getDisplayTeams } from "../displayState";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { ONGSI, useConfig } from "../../API/contexts/actions";
import { GetInputsFromSection, Sections } from "../../API/contexts/settings";

function stringToClock(time: string | number, pad = true) {
  if (typeof time === "string") {
    time = parseFloat(time);
  }
  const countdown = Math.abs(Math.ceil(time));
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown - minutes * 60;
  if (pad && seconds < 10) {
    return `${minutes}:0${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

interface IProps {
  match: Match | null;
  map: I.Map;
  phase: I.CSGO["phase_countdowns"];
  bomb: I.Bomb | null;
}

type DisplaySettings = GetInputsFromSection<Sections["display_settings"]> & {
  matchbar_logo_background?: string;
};

type MatchbarStyle = CSSProperties & {
  "--matchbar-left-tint-color"?: string;
  "--matchbar-right-tint-color"?: string;
};

const getConfigColor = (color?: string): string | undefined => {
  const trimmedColor = color?.trim();

  if (!trimmedColor) return undefined;
  if (window.CSS?.supports("color", trimmedColor)) return trimmedColor;

  return undefined;
};

const getMatchbarStyle = (
  displaySettings?: DisplaySettings
): MatchbarStyle => {
  const sharedColor = displaySettings?.matchbar_logo_background;
  const leftTint = getConfigColor(
    displaySettings?.matchbar_left_logo_background_color || sharedColor
  );
  const rightTint = getConfigColor(
    displaySettings?.matchbar_right_logo_background_color || sharedColor
  );

  return {
    ...(leftTint && { "--matchbar-left-tint-color": leftTint }),
    ...(rightTint && { "--matchbar-right-tint-color": rightTint }),
  };
};

export interface Timer {
  time: number;
  active: boolean;
  side: "left" | "right";
  type: "defusing" | "planting";
  player: I.Player | null;
}
const getRoundLabel = (mapRound: number) => {
  const round = mapRound + 1;
  if (round <= 24) {
    return `Round ${round}`;
  }
  const additionalRounds = round - 24;
  const OT = Math.ceil(additionalRounds / 6);
  return `OT ${OT} (${additionalRounds - (OT - 1) * 6}/6)`;
};

const getSeriesWinsNeeded = (match: Match | null) => {
  const maps = (match && Number(match.matchType.replace("bo", ""))) || 3;
  return Math.floor(maps / 2) + 1;
};

const Matchbar = (props: IProps) => {
  const { bomb, match, map, phase } = props;
  const [roundWinner, setRoundWinner] = useState<"left" | "right" | null>(null);
  const roundWinnerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const time = stringToClock(phase.phase_ends_in);
  const { left, right } = getDisplayTeams(map, match);
  const displaySettings = useConfig("display_settings") as
    | DisplaySettings
    | undefined;
  const bo = (match && Number(match.matchType.substr(-1))) || 0;
  const seriesWinsNeeded = getSeriesWinsNeeded(match);

  ONGSI(
    "roundEnd",
    (result) => {
      setRoundWinner(result.winner.orientation);

      if (roundWinnerTimeout.current) {
        clearTimeout(roundWinnerTimeout.current);
      }

      roundWinnerTimeout.current = setTimeout(() => {
        setRoundWinner(null);
      }, 5000);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (roundWinnerTimeout.current) {
        clearTimeout(roundWinnerTimeout.current);
      }
    };
  }, []);

  const bombData = useBombTimer();
  const isPlanting = bombData.state === "planting";
  const isC4Active =
    isPlanting ||
    bombData.state === "planted" ||
    bombData.state === "defusing";
  const defuseTimer: Timer | null =
    bombData.state === "defusing"
      ? {
          time: bombData.defuseTime,
          active: true,
          side: bombData.player?.team.orientation || "left",
          player: bombData.player,
          type: "defusing",
        }
      : null;
  const c4Timer: Timer | null =
    isPlanting
      ? {
          time: bombData.plantTime,
          active: true,
          side: bombData.player?.team.orientation || "right",
          player: bombData.player,
          type: "planting",
        }
      : bombData.state === "planted" || bombData.state === "defusing"
      ? {
          time: bombData.bombTime,
          active: true,
          side: bombData.player?.team.orientation || "right",
          player: bombData.player,
          type: "planting",
        }
      : null;
  const c4MaxTime =
    isPlanting ? MAX_TIMER.planting : MAX_TIMER.bomb;
  const c4ProgressMode = isPlanting ? "fill" : "drain";
  const c4Side = left.side === "T" ? "left" : "right";
  const defuseSide = left.side === "CT" ? "left" : "right";
  const defuseMaxTime = defuseTimer?.player?.state.defusekit
    ? MAX_TIMER.defuse_kit
    : MAX_TIMER.defuse_nokit;

  return (
    <>
      <div id={`matchbar`} style={getMatchbarStyle(displaySettings)}>
        <TeamScore
          team={left}
          orientation={"left"}
          seriesWinsNeeded={seriesWinsNeeded}
        />
          <div className={`score left ${left.side}`}>{left.score}</div>
        <div id="timer" className={bo === 0 ? "no-bo" : ""}>
          <div
            className={`timer_c4_icon ${isC4Active ? "show" : "hide"}`}
          >
            <C4 />
          </div>
          <div id={`round_timer_text`} className={isC4Active ? "hide" : ""}>
            {time}
          </div>
          <div id="round_now" className={isC4Active ? "hide" : ""}>
            {getRoundLabel(map.round)}
          </div>
        </div>
        <div className={`score right ${right.side}`}>{right.score}</div>
        <TeamScore
          team={right}
          orientation={"right"}
          seriesWinsNeeded={seriesWinsNeeded}
        />
      </div>
      <BombTimer
        time={c4Timer?.time || 0}
        active={Boolean(c4Timer?.active)}
        side={c4Side}
        type="c4"
        maxTime={c4MaxTime}
        progressMode={c4ProgressMode}
      />
      <BombTimer
        time={defuseTimer?.time || 0}
        active={Boolean(defuseTimer?.active)}
        side={defuseSide}
        type="defuse"
        maxTime={defuseMaxTime}
      />
      {roundWinner && (
        <div className={`round-winner-popup ${roundWinner}`}>
          <WinAnnouncement team={roundWinner === "left" ? left : right} />
        </div>
      )}
    </>
  );
};

export default Matchbar;
