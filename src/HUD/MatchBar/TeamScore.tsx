import * as I from "csgogsi";
import { Timer } from "./MatchBar";
import TeamLogo from "./TeamLogo";
import PlantDefuse from "../Timers/PlantDefuse";
import { ONGSI } from "../../API/contexts/actions";
import WinAnnouncement from "./WinIndicator";
import { CSSProperties, useState } from "react";

interface IProps {
  orientation: "left" | "right";
  timer: Timer | null;
  team: I.Team;
}

type GradientStyle = CSSProperties & {
  "--matchbar-logo-gradient-from": string;
  "--matchbar-logo-gradient-to": string;
};

type TeamWithExtra = I.Team & {
  extra?: Record<string, string | undefined>;
};

const gradientFallbacks: Record<I.Team["side"], Pick<GradientStyle, "--matchbar-logo-gradient-from" | "--matchbar-logo-gradient-to">> = {
  CT: {
    "--matchbar-logo-gradient-from": "rgba(40, 171, 255, 0.45)",
    "--matchbar-logo-gradient-to": "rgba(40, 171, 255, 0)",
  },
  T: {
    "--matchbar-logo-gradient-from": "rgba(255, 198, 0, 0.45)",
    "--matchbar-logo-gradient-to": "rgba(255, 198, 0, 0)",
  },
};

const getExtraColor = (
  extra: TeamWithExtra["extra"],
  keys: string[]
): string | undefined => {
  const color = keys.map((key) => extra?.[key]).find(Boolean);

  if (!color) return undefined;
  if (window.CSS?.supports("color", color)) return color;

  return undefined;
};

const getLogoGradientStyle = (team: I.Team): GradientStyle => {
  const teamWithExtra = team as TeamWithExtra;
  const fallback = gradientFallbacks[team.side];

  return {
    "--matchbar-logo-gradient-from":
      getExtraColor(teamWithExtra.extra, [
        "matchbarLogoGradientFrom",
        "matchbar_gradient_from",
      ]) || fallback["--matchbar-logo-gradient-from"],
    "--matchbar-logo-gradient-to":
      getExtraColor(teamWithExtra.extra, [
        "matchbarLogoGradientTo",
        "matchbar_gradient_to",
      ]) || fallback["--matchbar-logo-gradient-to"],
  };
};

const TeamScore = ({ orientation, timer, team }: IProps) => {
  const [show, setShow] = useState(false);

  ONGSI(
    "roundEnd",
    (result) => {
      if (result.winner.orientation !== orientation) return;
      setShow(true);

      setTimeout(() => {
        setShow(false);
      }, 5000);
    },
    [orientation]
  );

  return (
    <>
      <div className={`team ${orientation}`} style={getLogoGradientStyle(team)}>
        <div className="team-name">
          <div className={`series-dots ${team.side}`}>
            {new Array(2).fill(0).map((_, i) => (
              <span
                key={i}
                className={team.matches_won_this_series > i ? "won" : ""}
              />
            ))}
          </div>
          <span>{team?.name || null}</span>
        </div>
        <TeamLogo team={team} />
      </div>
      <PlantDefuse timer={timer} side={orientation} />
      <WinAnnouncement team={team} show={show} />
    </>
  );
};

export default TeamScore;
