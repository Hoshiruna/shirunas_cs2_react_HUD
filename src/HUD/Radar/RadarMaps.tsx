import { useEffect, useState } from "react";
import "./radar.scss";
import { Match, Veto } from "../../API/types";
import { Map, CSGO, Team } from 'csgogsi';
import Radar from './Radar'
import { getMapDisplayName } from "./mapDisplayNames";

import { useAction, useConfig } from "../../API/contexts/actions";
import { GetInputsFromSection, Sections } from "../../API/contexts/settings";

interface Props { match: Match | null, map: Map, game: CSGO }
interface MapsListProps { match: Match, map: Map }

type DisplaySettings = GetInputsFromSection<Sections["display_settings"]>;

const MAPS_VIEW_MS = 8000;
const TOURNAMENT_VIEW_MS = 4500;

 const RadarMaps = ({ match, map, game }: Props) => {
    const [ radarSize, setRadarSize ] = useState(366);
    const [ showBig, setShowBig ] = useState(false);

    useAction('radarBigger', () => {
        setRadarSize(p => p+10);
    }, []);

    useAction('radarSmaller', () => {
        setRadarSize(p => p-10);
    }, []);

    useAction('toggleRadarView', () => {
        setShowBig(p => !p);
    }, []);

    return (
        <div id={`radar_maps_container`} className={` ${showBig ? 'preview':''}`}>
            {match ? <MapsBar match={match} map={map} game={game} /> : null}
            <Radar radarSize={showBig ? 600: radarSize} game={game} />
        </div>
    );
}

export default RadarMaps;

const MapsBar = ({ match, map }: MapsListProps) => {
    const [showTournamentInfo, setShowTournamentInfo] = useState(false);
    const displaySettings = useConfig("display_settings") as DisplaySettings | undefined;
    const tournamentTitle = displaySettings?.radar_tournament_title?.trim();
    const tournamentStage = displaySettings?.radar_tournament_stage?.trim();
    const hasTournamentInfo = Boolean(tournamentTitle || tournamentStage);
    const hasMaps = match.vetos.length > 0;

    useEffect(() => {
        if (!hasTournamentInfo) {
            setShowTournamentInfo(false);
            return;
        }

        if (!hasMaps) {
            setShowTournamentInfo(true);
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;

        const scheduleNextView = (showInfo: boolean) => {
            timeoutId = setTimeout(() => {
                setShowTournamentInfo(showInfo);
                scheduleNextView(!showInfo);
            }, showInfo ? MAPS_VIEW_MS : TOURNAMENT_VIEW_MS);
        };

        setShowTournamentInfo(false);
        scheduleNextView(true);

        return () => clearTimeout(timeoutId);
    }, [hasMaps, hasTournamentInfo, tournamentStage, tournamentTitle]);

    if (!hasMaps && !hasTournamentInfo) return '';

    return <div id="maps_container">
        {hasMaps ? (
            <div className={`maps_bar_view maps_view ${!showTournamentInfo ? 'visible' : ''}`}>
                <MapsList match={match} map={map} />
            </div>
        ) : null}
        {hasTournamentInfo ? (
            <div className={`maps_bar_view tournament_info ${showTournamentInfo ? 'visible' : ''}`}>
                <div className="tournament_title">{tournamentTitle}</div>
                <div className="tournament_stage">{tournamentStage}</div>
            </div>
        ) : null}
    </div>
}

const MapsList = ({ match, map }: MapsListProps) => {
    const picks = match.vetos.filter(veto => veto.type !== "ban" && veto.mapName);
    if (picks.length > 3) {
        const current = picks.find(veto => map.name.includes(veto.mapName));
        if (!current) return null;
        return <>
            <div className="bestof">Best of {match.matchType.replace("bo", "")}</div>
            {<MapEntry veto={current} map={map} team={current.type === "decider" ? null : map.team_ct.id === current.teamId ? map.team_ct : map.team_t} />}
        </>
    }
    return <>
        <div className="bestof">Best of {match.matchType.replace("bo", "")}</div>
        {match.vetos.filter(veto => veto.type !== "ban").filter(veto => veto.teamId || veto.type === "decider").map(veto => <MapEntry key={veto.mapName} veto={veto} map={map} team={veto.type === "decider" ? null : map.team_ct.id === veto.teamId ? map.team_ct : map.team_t} />)}
    </>
}

const MapEntry = ({ veto, map }: { veto: Veto, map: Map, team: Team | null }) => {
    return <div className="veto_entry">
        <div className={`map_name ${map.name.includes(veto.mapName) ? 'active' : ''}`}>{getMapDisplayName(veto.mapName)}</div>
    </div>
}
