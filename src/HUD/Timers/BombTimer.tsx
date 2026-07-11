import { MAX_TIMER } from "./Countdown";

interface IProps {
  time: number;
  active: boolean;
  side?: "left" | "right";
  type: "c4" | "defuse";
  maxTime?: number;
  progressMode?: "fill" | "drain";
}

const BombTimer = ({
  time,
  active,
  side,
  type,
  maxTime,
  progressMode = "drain",
}: IProps) => {
  const timerMax = maxTime || MAX_TIMER.bomb;
  const progress =
    progressMode === "fill"
      ? ((timerMax - time) * 100) / timerMax
      : (time * 100) / timerMax;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const progressStyle = {
    transform: `scaleX(${clampedProgress / 100})`,
  };

  return (
    <div
      className={`objective_timer ${type} ${active ? "show" : "hide"} ${
        side || ""
      }`}
    >
      <div className="objective_track">
        <div className="objective_progress" style={progressStyle} />
      </div>
    </div>
  );
};

export default BombTimer;
