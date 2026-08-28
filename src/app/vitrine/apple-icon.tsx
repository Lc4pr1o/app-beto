import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #A9563C, #8E4530)",
          color: "#FBF3EE",
          fontSize: 92,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
        }}
      >
        HB
      </div>
    ),
    { ...size }
  );
}
