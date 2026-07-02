import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
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
          background: "#09090b",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              color: "#f5f5f5",
              letterSpacing: "-0.02em",
            }}
          >
            Sourcive
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#a78bfa",
            marginTop: 24,
          }}
        >
          AI-powered streaming chat
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
