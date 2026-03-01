import type { CSSProperties } from 'react';

const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const patternUrl = `${publicUrl}/backgroundPattern.png`;
const patternOpacity = 0.4;
const overlayAlpha = 1 - patternOpacity;
const patternFade = `linear-gradient(rgba(255, 167, 206, ${overlayAlpha}), rgba(255, 167, 206, ${overlayAlpha}))`;

export const cardPatternStyle: CSSProperties = {
  backgroundImage: `${patternFade}, url('${patternUrl}')`,
  backgroundRepeat: 'repeat-x, repeat-x',
  backgroundPosition: 'top left, top left',
  backgroundSize: 'auto, auto'
};
