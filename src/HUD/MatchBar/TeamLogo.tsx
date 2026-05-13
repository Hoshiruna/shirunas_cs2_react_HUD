import { Team } from "csgogsi";
import * as I from "../../API/types";
import { apiUrl } from "./../../API";
import { LogoCT, LogoT } from "../../assets/Icons";

type TeamLogoTeam = Team | I.Team;

const getTeamId = (team: TeamLogoTeam) => {
  if ("_id" in team) return team._id;
  if ("id" in team && team.id) return team.id;
  return "";
};

const getFallbackLogo = (team: TeamLogoTeam) =>
  "side" in team && team.side === "CT" ? LogoCT : LogoT;

const TeamLogo = ({
  team,
  height,
  width,
}: {
  team?: Team | I.Team | null;
  height?: number;
  width?: number;
}) => {
  if (!team) return null;

  const id = getTeamId(team);
  const { logo } = team;
  // ${apiUrl}/teams/${id}/logo - Old way of getting the logo
  return (
    <div className={`logo ${"side" in team ? team.side : ""}`}>
      {logo && id ? (
        <img
          src={`${apiUrl}/teams/logo/${id}`}
          width={width}
          height={height}
          alt={"Team logo"}
        />
      ) : (
        <img
          src={getFallbackLogo(team)}
          width={width}
          height={height}
          alt={"Team logo"}
        />
      )}
    </div>
  );
};

export default TeamLogo;
