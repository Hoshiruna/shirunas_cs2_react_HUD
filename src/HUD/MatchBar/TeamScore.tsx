import * as I from "csgogsi";
import { Timer } from "./MatchBar";
import TeamLogo from "./TeamLogo";
import PlantDefuse from "../Timers/PlantDefuse";
import { ONGSI } from "../../API/contexts/actions";
import WinAnnouncement from "./WinIndicator";
import { useState } from "react";

interface IProps {
  orientation: "left" | "right";
  timer: Timer | null;
  team: I.Team;
}

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
      <div className={`team ${orientation}`}>
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
