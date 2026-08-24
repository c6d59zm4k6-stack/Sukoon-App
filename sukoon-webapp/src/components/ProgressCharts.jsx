// Two small, single-series visualizations for Track's "Your Progress"
// section — the feasible substitute for the harder photo-overlay
// before/after idea, built entirely from data already logged (no photo
// upload, no image-generation API, no new privacy surface). Both use one
// hue (the app's existing indigo/lavender family) since each is a
// magnitude/change-over-time encoding, not a categorical one — no legend
// needed beyond the sequential "Less/More" key on the heatmap.
import { todayKey, habitCompletionPercent } from "../data/habits.js";
import "./ProgressCharts.css";

function heatLevel(percent) {
  if (percent <= 0) return 0;
  if (percent <= 0.25) return 1;
  if (percent <= 0.5) return 2;
  if (percent <= 0.75) return 3;
  return 4;
}

export function HabitHeatmap({ habitLog, days }) {
  return (
    <div className="progress-heatmap-wrap">
      <div className="progress-heatmap" role="img" aria-label="Habit consistency over the last 30 days">
        {days.map((d) => {
          const key = todayKey(d);
          const percent = habitCompletionPercent(habitLog[key]);
          const level = heatLevel(percent);
          return (
            <span
              key={key}
              className={`progress-heatmap__cell progress-heatmap__cell--l${level}`}
              title={`${key}: ${Math.round(percent * 100)}% of habits done`}
            />
          );
        })}
      </div>
      <div className="progress-heatmap__legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`progress-heatmap__cell progress-heatmap__cell--l${level}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function WeightTrend({ weightLog }) {
  if (weightLog.length < 2) return null;

  const width = 280;
  const height = 64;
  const pad = 6;
  const kgs = weightLog.map((w) => w.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const range = max - min || 1;

  const points = weightLog.map((w, i) => {
    const x = pad + (i / (weightLog.length - 1)) * (width - pad * 2);
    const y = height - pad - ((w.kg - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const last = points[points.length - 1];
  const areaPath = `${linePath} L${last[0]},${height - pad} L${points[0][0]},${height - pad} Z`;

  const first = weightLog[0];
  const latest = weightLog[weightLog.length - 1];

  return (
    <div className="progress-weight-trend">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`Weight trend from ${first.kg} kilograms on ${first.date} to ${latest.kg} kilograms on ${latest.date}`}
      >
        <path d={areaPath} fill="var(--lavender)" opacity="0.18" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--indigo-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="4" fill="var(--indigo-mid)" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <div className="progress-weight-trend__labels">
        <span>{first.date} · {first.kg} kg</span>
        <span>{latest.date} · {latest.kg} kg</span>
      </div>
    </div>
  );
}
