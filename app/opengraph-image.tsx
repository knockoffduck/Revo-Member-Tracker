import { ImageResponse } from "next/og";

export const alt = "Revo Tracker: live gym crowd levels for every Revo Fitness gym";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 40, background: "#22c55e", borderRadius: 4 }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            Revo Tracker
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Track the crowd, so you can focus on your gains
          </div>
          <div style={{ fontSize: 32, color: "#a1a1aa", maxWidth: 820, lineHeight: 1.4 }}>
            Live member counts, peak times and squat rack availability for every
            Revo Fitness gym.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 26, color: "#71717a" }}>
          <div>revotracker.dvcklab.com</div>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#3f3f46" }} />
          <div>83 locations, updated every 5 minutes</div>
        </div>
      </div>
    ),
    size,
  );
}
