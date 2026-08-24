import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8a6a4b, #6f5439)",
          color: "#f7f1ea",
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
          borderRadius: 7,
        }}
      >
        HB
      </div>
    ),
    { ...size }
  );
}
