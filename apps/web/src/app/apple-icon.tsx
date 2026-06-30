import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Apple touch icon — this is what iOS uses for the home-screen icon.
 *  No rounded corners: iOS masks the square itself. */
export default function AppleIcon() {
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
          fontSize: 116,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        M
      </div>
    ),
    size,
  );
}
