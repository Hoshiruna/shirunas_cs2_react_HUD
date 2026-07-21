import { useState } from "react";
import TeamBox from "./../Players/TeamBox";
import MatchBar from "../MatchBar/MatchBar";
import Observed from "./../Players/Observed";
import RadarMaps from "./../Radar/RadarMaps";
import Trivia from "../Trivia/Trivia";
import SideBox from "../SideBoxes/SideBox";
import MoneyBox from "../SideBoxes/Money";
import UtilityLevel from "../SideBoxes/UtilityLevel";
import Killfeed from "../Killfeed/Killfeed";
import MapSeries from "../MapSeries/MapSeries";
// import Overview from "../Overview/Overview";
// import Tournament from "../Tournament/Tournament";
import Pause from "../PauseTimeout/Pause";
import Timeout from "../PauseTimeout/Timeout";
import { CSGO } from "csgogsi";
import { Match } from "../../API/types";
import { useAction } from "../../API/contexts/actions";
import { getDisplayState } from "../displayState";
import UpperRightRotation from "../UpperRightRotation/UpperRightRotation";
interface Props {
  game: CSGO;
  match: Match | null;
}
/*
interface State {
  winner: Team | null,
  showWin: boolean,
  forceHide: boolean
}*/

const Layout = ({ game, match }: Props) => {
  const [forceHide, setForceHide] = useState(false);

  useAction("boxesState", (state) => {
    console.log("UPDATE STATE UMC", state);
    if (state === "show") {
      setForceHide(false);
    } else if (state === "hide") {
      setForceHide(true);
    }
  });

  const { left, right, leftPlayers, rightPlayers, players, currentPlayer } =
    getDisplayState(game, match);
  const isFreezetime =
    (game.round && game.round.phase === "freezetime") ||
    game.phase_countdowns.phase === "freezetime";
  return (
    <div className="layout">
      <UpperRightRotation />
      <Killfeed />
      {/* <Overview match={match} map={game.map} players={game.players || []} /> */}
      <RadarMaps match={match} map={game.map} game={game} />
      <MatchBar
        map={game.map}
        phase={game.phase_countdowns}
        bomb={game.bomb}
        match={match}
      />
      <Pause phase={game.phase_countdowns} />
      <Timeout map={game.map} phase={game.phase_countdowns} />
      {/* <Tournament /> */}

      <Observed player={currentPlayer} />

      <TeamBox
        team={left}
        players={leftPlayers}
        side="left"
        current={currentPlayer}
      />
      <TeamBox
        team={right}
        players={rightPlayers}
        side="right"
        current={currentPlayer}
      />

      <Trivia />
      {/* <Scout left={left.side} right={right.side} /> */}
      <MapSeries
        teams={[left, right]}
        match={match}
        isFreezetime={isFreezetime}
        map={game.map}
      />
      <div className={"boxes left"}>
        <UtilityLevel
          side={left.side}
          players={players}
          show={isFreezetime && !forceHide}
        />
        <SideBox side="left" hide={forceHide} />
        <MoneyBox
          team={left.side}
          side="left"
          loss={Math.min(left.consecutive_round_losses * 500 + 1400, 3400)}
          equipment={leftPlayers
            .map((player) => player.state.equip_value)
            .reduce((pre, now) => pre + now, 0)}
          money={leftPlayers
            .map((player) => player.state.money)
            .reduce((pre, now) => pre + now, 0)}
          show={isFreezetime && !forceHide}
        />
      </div>
      <div className={"boxes right"}>
        <UtilityLevel
          side={right.side}
          players={players}
          show={isFreezetime && !forceHide}
        />
        <SideBox side="right" hide={forceHide} />
        <MoneyBox
          team={right.side}
          side="right"
          loss={Math.min(right.consecutive_round_losses * 500 + 1400, 3400)}
          equipment={rightPlayers
            .map((player) => player.state.equip_value)
            .reduce((pre, now) => pre + now, 0)}
          money={rightPlayers
            .map((player) => player.state.money)
            .reduce((pre, now) => pre + now, 0)}
          show={isFreezetime && !forceHide}
        />
      </div>
    </div>
  );
};
export default Layout;
