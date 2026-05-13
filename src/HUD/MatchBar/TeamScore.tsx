import * as I from "csgogsi";
import { Timer } from "./MatchBar";
import TeamLogo from "./TeamLogo";
import PlantDefuse from "../Timers/PlantDefuse";
import { ONGSI, useConfig } from "../../API/contexts/actions";
import WinAnnouncement from "./WinIndicator";
import { CSSProperties, useState } from "react";
import { GetInputsFromSection, Sections } from "../../API/contexts/settings";

interface IProps {
  orientation: "left" | "right";
  timer: Timer | null;
  team: I.Team;
}

type GradientStyle = CSSProperties & {
  "--matchbar-logo-tint-color"?: string;
};

type DisplaySettings = GetInputsFromSection<Sections["display_settings"]> & {
  matchbar_logo_background?: string;
};

const getConfigColor = (color?: string): string | undefined => {
  const trimmedColor = color?.trim();

  if (!trimmedColor) return undefined;
  if (window.CSS?.supports("color", trimmedColor)) return trimmedColor;

  return undefined;
};

const getLogoBackgroundColor = (
  orientation: I.Team["orientation"],
  displaySettings?: DisplaySettings
) => {
  const backgroundColor =
    orientation === "left"
      ? displaySettings?.matchbar_left_logo_background_color
      : displaySettings?.matchbar_right_logo_background_color;

  return getConfigColor(
    backgroundColor || displaySettings?.matchbar_logo_background
  );
};

const getLogoGradientStyle = (
  orientation: I.Team["orientation"],
  displaySettings?: DisplaySettings
): GradientStyle => {
  const tintColor = getLogoBackgroundColor(orientation, displaySettings);

  return {
    ...(tintColor && {
      "--matchbar-logo-tint-color": tintColor,
    }),
  };
};

const TeamScore = ({ orientation, timer, team }: IProps) => {
  const [show, setShow] = useState(false);
  const displaySettings = useConfig("display_settings") as
    | DisplaySettings
    | undefined;

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
      <div
        className={`team ${orientation} ${team.side}`}
        style={getLogoGradientStyle(orientation, displaySettings)}
      >
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
