import * as I from "csgogsi";
import TeamLogo from "./TeamLogo";
import { ONGSI } from "../../API/contexts/actions";
import WinAnnouncement from "./WinIndicator";
import { useState } from "react";

interface IProps {
  orientation: "left" | "right";
  seriesWinsNeeded: number;
  team: I.Team;
}

const TeamScore = ({ orientation, seriesWinsNeeded, team }: IProps) => {
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
      <div className={`team ${orientation} ${team.side}`}>
        <div className="team-name">
          <div className={`series-dots ${team.side}`}>
            {new Array(seriesWinsNeeded).fill(0).map((_, i) => (
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
      <WinAnnouncement team={team} show={show} />
    </>
  );
};

export default TeamScore;
