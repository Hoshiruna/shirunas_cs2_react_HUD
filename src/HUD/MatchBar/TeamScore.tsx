import * as I from "csgogsi";
import TeamLogo from "./TeamLogo";

interface IProps {
  orientation: "left" | "right";
  seriesWinsNeeded: number;
  team: I.Team;
}

const TeamScore = ({ orientation, seriesWinsNeeded, team }: IProps) => {
  return (
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
  );
};

export default TeamScore;
