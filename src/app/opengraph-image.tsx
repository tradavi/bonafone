import { ImageResponse } from "next/og";
import { STORE } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${STORE.name} — ${STORE.tagline}`;

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 80px",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#0a0a0a",
              border: "2px solid #262626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
              fontWeight: 800,
              fontSize: 50,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 28, color: "#a3a3a3" }}>{STORE.name}</div>
        </div>
        <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
          {STORE.tagline}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#a3a3a3",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Smartphones, tablettes, accessoires et réparation toutes marques.
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#ef4444",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ef4444" }} />
          Devis gratuit en 24h
        </div>
      </div>
    ),
    { ...size },
  );
}
