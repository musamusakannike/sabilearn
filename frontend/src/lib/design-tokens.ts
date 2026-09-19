/**
 * SabiLearn Design System Tokens
 * Extracted from Taste Engine Brand Extraction: https://engine.tastelabs.com/public/3cc42a2a-3b65-4a6e-8daf-70a389cd7812
 */

export const DESIGN_TOKENS = {
  brand: {
    name: 'SabiLearn',
    tagline: 'Make your study workflow faster and smarter',
    targetAudience: 'Nigerian university students and lifelong learners',
    voice: ['Friendly', 'Encouraging', 'Accessible', 'Modern', 'Energetic'],
    signature: 'Warm canvas (#FAF9F7) with Golden Amber (#F8BE43), AI Violet (#5B4FE8), and Heavy Dark Ink (#0E0E1A) typography.',
  },

  colors: {
    primary: {
      gold: '#F8BE43',
      goldDark: '#F2A900',
      goldHover: '#D89400',
      goldLight: '#FBDDB0',
    },
    ai: {
      violet: '#5B4FE8',
      violetDark: '#4A3FD1',
      violetLight: '#E7E3FB',
    },
    ink: {
      900: '#0E0E1A', // Primary display headings, heavy structural borders, dark footer
      700: '#35354A', // Standard body text, navigation links
      500: '#6B6B80', // Secondary descriptions, subtitles
      300: '#A9A9BC', // Muted text, footer secondary links
      100: '#DEDAD0', // Subtle warm borders & dividers
    },
    surfaces: {
      canvas: '#FAF9F7', // Main page background
      card: '#FFFFFF',   // Elevated card & modal background
      sunken: '#ECE8DF', // Inputs, badges, sunken panels
      inverse: '#0E0E1A',// Dark inverted sections & footer
    },
    lines: {
      subtle: '#DEDAD0', // 1px light divider
      strong: '#0E0E1A', // 2px heavy structural border
      muted: '#E5E0D5',
    },
    feedback: {
      success: '#10B981',
      successBg: '#D1FAE5',
      danger: '#E5484D',
      dangerBg: '#FEE2E2',
      warning: '#E8890C',
      warningBg: '#FEF3C7',
    },
  },

  typography: {
    fonts: {
      display: '"Space Grotesk", system-ui, -apple-system, sans-serif',
      body: '"Space Grotesk", system-ui, -apple-system, sans-serif',
      mono: '"Space Mono", "Space Grotesk", monospace',
    },
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      md: '18px',
      lg: '20px',
      xl: '24px',
      '2xl': '30px',
      '3xl': '42px',
      '4xl': '48px',
      '5xl': '62px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeights: {
      tight: 1.08,
      snug: 1.15,
      normal: 1.4,
      relaxed: 1.65,
    },
    tracking: {
      tighter: '-0.03em',
      tight: '-0.02em',
      normal: '0em',
      wide: '0.04em',
    },
  },

  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '28px',
    full: '9999px',
  },

  shadows: {
    xs: '0 1px 2px rgba(14, 14, 26, 0.06)',
    sm: '0 2px 8px rgba(14, 14, 26, 0.08)',
    md: '0 8px 24px rgba(14, 14, 26, 0.10)',
    lg: '0 16px 40px rgba(14, 14, 26, 0.14)',
    xl: '0 24px 60px rgba(14, 14, 26, 0.18)',
  },

  borders: {
    structural: '2px solid #0E0E1A',
    divider: '1px solid #DEDAD0',
  },

  layout: {
    containerMax: '1240px',
    gridDesktop: 12,
    gridTablet: 8,
    gridMobile: 1,
    gutter: '32px',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
