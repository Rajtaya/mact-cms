import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/** App icon (favicon / Android) — generated at build, no image file needed. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3949ab',
          color: '#ffffff',
          fontSize: 320,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          borderRadius: 96,
        }}
      >
        M
      </div>
    ),
    size,
  );
}
