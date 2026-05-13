import React, { useEffect, useState } from "react";
import { CSGO } from "csgogsi";
import Layout from "./HUD/Layout/Layout";
import "./App.css";
import { Match } from "./API/types";
import { socket } from "./API/socket";
import api from "./API";
import { GSI } from "./API/HUD";
import { ONGSI } from "./API/contexts/actions";

const App = () => {
  const [game, setGame] = useState<CSGO | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  useEffect(() => {
    const onMatchPing = () => {
      api.matches
        .getCurrent()
        .then((match) => {
          if (!match) {
            GSI.teams.left = null;
            GSI.teams.right = null;
            setCurrentMatch(null);
            return;
          }
          setCurrentMatch(match);
          if (match.left.id) {
            api.teams.getTeam(match.left.id).then((left) => {
              const gsiTeamData = {
                id: left._id,
                name: left.name,
                country: left.country,
                logo: left.logo,
                map_score: match.left.wins,
                extra: left.extra,
              };

              GSI.teams.left = gsiTeamData;
            });
          }
          if (match.right.id) {
            api.teams.getTeam(match.right.id).then((right) => {
              const gsiTeamData = {
                id: right._id,
                name: right.name,
                country: right.country,
                logo: right.logo,
                map_score: match.right.wins,
                extra: right.extra,
              };
              GSI.teams.right = gsiTeamData;
            });
          }
        })
        .catch(() => {
          GSI.teams.left = null;
          GSI.teams.right = null;
          setCurrentMatch(null);
        });
    };
    socket.on("match", onMatchPing);
    onMatchPing();

    return () => {
      socket.off("match", onMatchPing);
    };
  }, []);

  ONGSI(
    "data",
    (game) => {
      setGame(game);
    },
    []
  );

  if (!game) return null;

  return <Layout game={game} match={currentMatch} />;
};

export default App;
