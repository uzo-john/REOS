// REOS Centralized Design Tokens (Theme Definition)

export const Colors = {
  light: {
    primary: '#0D9488', // Emerald Teal (Sustainability & Clean Energy)
    secondary: '#F59E0B', // Amber Gold (Solar Energy, Focus, Alerts)
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // Neutrals
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E2E8F0', // Slate 200
    divider: '#F1F5F9', // Slate 100
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    placeholder: '#94A3B8', // Slate 400
  },
  dark: {
    primary: '#0D9488', // Teal stays primary
    secondary: '#F59E0B',
    
    // Semantic Colors
    success: '#10B981',
    successLight: '#064E3B',
    warning: '#F59E0B',
    warningLight: '#78350F',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    info: '#3B82F6',
    infoLight: '#1E3A8A',
    
    // Neutrals
    background: '#09090B', // Zinc 950
    surface: '#18181B', // Zinc 900
    card: '#18181B', // Zinc 900
    border: '#27272A', // Zinc 800
    divider: '#3F3F46', // Zinc 700
    textPrimary: '#FAFAFA', // Zinc 50
    textSecondary: '#A1A1AA', // Zinc 400
    placeholder: '#52525B', // Zinc 600
  }
};

// 8-Point Spacing System
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius Guidelines
export const BorderRadius = {
  xs: 4,
  sm: 8,      // Buttons, inputs
  md: 12,     // Cards
  lg: 16,     // Bottom sheets, dialogs
  full: 9999, // Circular avatars/chips
};

// Typography Font Scale
export const Typography = {
  size: {
    display: 32,
    h1: 24,
    h2: 20,
    h3: 18,
    h4: 16,
    bodyLarge: 16,
    body: 14,
    bodySmall: 12,
    caption: 10,
  },
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  lineHeight: {
    display: 40,
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 22,
    bodyLarge: 24,
    body: 20,
    bodySmall: 16,
    caption: 12,
  }
};

// Shadows
export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    }
  },
  dark: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    }
  }
};
