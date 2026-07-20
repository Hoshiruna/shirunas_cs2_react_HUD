import { io } from "socket.io-client";
import { configs } from "./contexts/actions";

const PROTOCOL_VERSION = 1;
const CONFIGURATOR_URL = "http://127.0.0.1:1350/ournotes-config";
const DISPLAY_SETTING_KEYS = [
  "radar_tournament_title",
  "radar_tournament_stage",
  "matchbar_left_logo_background_color",
  "matchbar_right_logo_background_color",
] as const;

type StandaloneDisplaySettings = Record<(typeof DISPLAY_SETTING_KEYS)[number], string>;

interface ConfigEnvelope {
  protocolVersion: number;
  revision: number;
  config: {
    display_settings: StandaloneDisplaySettings;
  };
}

const readStandaloneSettings = (envelope: unknown): StandaloneDisplaySettings | null => {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) return null;
  const candidate = envelope as Partial<ConfigEnvelope>;
  if (
    candidate.protocolVersion !== PROTOCOL_VERSION ||
    typeof candidate.revision !== "number" ||
    !candidate.config ||
    typeof candidate.config !== "object" ||
    !candidate.config.display_settings ||
    typeof candidate.config.display_settings !== "object" ||
    Array.isArray(candidate.config.display_settings) ||
    !Number.isInteger(candidate.revision) ||
    candidate.revision < 0
  ) {
    return null;
  }

  const displaySettings = candidate.config.display_settings as Record<string, unknown>;
  if (!DISPLAY_SETTING_KEYS.every((key) => typeof displaySettings[key] === "string")) {
    return null;
  }

  const title = (displaySettings.radar_tournament_title as string).trim();
  const stage = (displaySettings.radar_tournament_stage as string).trim();
  const leftColor = (displaySettings.matchbar_left_logo_background_color as string)
    .trim()
    .toUpperCase();
  const rightColor = (displaySettings.matchbar_right_logo_background_color as string)
    .trim()
    .toUpperCase();
  const colorPattern = /^#[0-9A-F]{6}$/;

  if (
    title.length > 120 ||
    stage.length > 120 ||
    (leftColor !== "" && !colorPattern.test(leftColor)) ||
    (rightColor !== "" && !colorPattern.test(rightColor))
  ) {
    return null;
  }

  return {
    radar_tournament_title: title,
    radar_tournament_stage: stage,
    matchbar_left_logo_background_color: leftColor,
    matchbar_right_logo_background_color: rightColor,
  };
};

export const standaloneConfigSocket = io(CONFIGURATOR_URL, {
  reconnection: true,
  timeout: 2000,
});

let lastRevision = -1;

standaloneConfigSocket.on("connect", () => {
  lastRevision = -1;
  standaloneConfigSocket.emit("client:register", {
    kind: "hud",
    protocolVersion: PROTOCOL_VERSION,
  });
});

standaloneConfigSocket.on("config:state", (envelope: unknown) => {
  const candidate = envelope as Partial<ConfigEnvelope> | null;
  const displaySettings = readStandaloneSettings(envelope);
  if (!displaySettings || typeof candidate?.revision !== "number") return;
  if (candidate.revision < lastRevision) return;

  lastRevision = candidate.revision;
  configs.saveStandalone(displaySettings);
});
