import { Team } from "csgogsi";

const WinAnnouncement = ({ team }: { team: Team | null }) => {
  if (!team) return null;

  return (
    <div className="win_text">
      {team.name || team.side} won this round
    </div>
  );
};

export default WinAnnouncement;
