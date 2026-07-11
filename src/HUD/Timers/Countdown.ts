import { Bomb, Events, Player } from "csgogsi";
import { useEffect, useRef, useState } from "react";
import { GSI } from "../../API/HUD";

export const MAX_TIMER = {
    planting: 3,
    defuse_kit: 5,
    defuse_nokit: 10,
    bomb: 40
}
const findNewTime = (current: number, newTime: number) => Math.abs(current - newTime) > 2 ? newTime : current;

export const useBombTimer = () => {
    const [ player, setPlayerSteamId ] = useState<Player | null>(null);
    const [ bombState, setBombState ] = useState<Bomb["state"] | null>(null);
    const [ site, setBombSite ] = useState<string | null>(null);

    const [ plantTime, setPlantTime ] = useState(0);
    const [ bombTime, setBombTime ] = useState(0);
    const [ defuseTime, setDefuseTime ] = useState(0);

    // Inner loop logic
    const previousTimeRef = useRef(0);
    const rAFRef = useRef<number>();
    const plantingUntilRef = useRef(0);
    const plantingPlayerRef = useRef<Player | null>(null);
    const syntheticPlantingRef = useRef(false);
    const previousBombStateRef = useRef<Bomb["state"] | null>(null);

    useEffect(() => {
        const startPlanting = (plantingPlayer: Player | null, countdown = MAX_TIMER.planting) => {
            plantingUntilRef.current = Date.now() + countdown * 1000;
            plantingPlayerRef.current = plantingPlayer;
            syntheticPlantingRef.current = true;
            setPlayerSteamId(plantingPlayer);
            setBombState("planting");
            setPlantTime(countdown);
        }

        const onData: Events["data"] = data => {
            const { bomb } = data;

            const bombPlayer = bomb?.player || null;
            const state = bomb?.state || null;
            const site = bomb?.site || null;

            const countdown = bomb?.countdown || 0;
            const previousState = previousBombStateRef.current;
            const wasPlanting = previousState === "planting";
            const isSyntheticPlanting =
                syntheticPlantingRef.current &&
                Date.now() < plantingUntilRef.current &&
                state !== "planted" &&
                state !== "defusing" &&
                state !== "defused" &&
                state !== "exploded";
            const effectiveState = isSyntheticPlanting ? "planting" : state;

            if (state === "planting") {
                plantingPlayerRef.current = bombPlayer;
                syntheticPlantingRef.current = false;
                if (countdown > 0) {
                    plantingUntilRef.current = Date.now() + countdown * 1000;
                } else if (!wasPlanting && plantingUntilRef.current <= 0) {
                    plantingUntilRef.current = Date.now() + MAX_TIMER.planting * 1000;
                }
            } else if (
                state === "planted" ||
                state === "defusing" ||
                state === "defused" ||
                state === "exploded" ||
                !isSyntheticPlanting
            ) {
                plantingPlayerRef.current = null;
                syntheticPlantingRef.current = false;
                plantingUntilRef.current = 0;
            }

            setPlayerSteamId(isSyntheticPlanting ? plantingPlayerRef.current : bombPlayer);
            setBombSite(site);

            const plantNewTime =
                effectiveState === "planting"
                    ? countdown || Math.max(0, (plantingUntilRef.current - Date.now()) / 1000)
                    : 0;
            const defuseNewTime = effectiveState === "defusing" ? countdown : 0;


            setPlantTime(curr => effectiveState === "planting" ? findNewTime(curr, plantNewTime) : 0);
            setDefuseTime(curr => findNewTime(curr, defuseNewTime));
            setBombTime(p => {
                if (effectiveState !== "planted") return p;
                if (countdown > 0) return findNewTime(p, countdown);
                return previousState !== "planted" ? MAX_TIMER.bomb : p;
            });
            setBombState(effectiveState);
            previousBombStateRef.current = effectiveState;
        }

        const onBombPlantStart: Events["bombPlantStart"] = player => {
            startPlanting(player);
        }

        GSI.on("data", onData);
        GSI.on("bombPlantStart", onBombPlantStart);

        const animationFrame = (time: number) => {
            if(previousTimeRef.current){
                const deltaTime = time - previousTimeRef.current;
                const dTs = deltaTime/1000;
          
                setPlantTime(p => {
                    if (p <= 0) return 0;

                    const nextTime = p - dTs;
                    return Math.max(0, nextTime);
                });
                setDefuseTime(p => p <= 0 ? 0 : p - dTs);
                setBombTime(p => p <= 0 ? 0 : Math.max(0, p - dTs));
            }
            previousTimeRef.current = time;
            rAFRef.current = requestAnimationFrame(animationFrame);
        }

        rAFRef.current = requestAnimationFrame(animationFrame);

        return () => {
            GSI.off("data", onData);
            GSI.off("bombPlantStart", onBombPlantStart);
            if(rAFRef.current) cancelAnimationFrame(rAFRef.current);
        }


    }, []);


    return ({
        state: bombState,
        player,
        site,
        defuseTime,
        bombTime,
        plantTime
    })
}
