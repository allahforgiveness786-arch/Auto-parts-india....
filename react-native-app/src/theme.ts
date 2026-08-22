import { MD3LightTheme, configureFonts } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  isV3: true,
  version: 3,
  colors: {
    ...(MD3LightTheme?.colors || {}),
    primary: '#1565FF',
    secondary: '#0B1220',
    tertiary: '#00D1FF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    outline: '#E2E8F0',
    error: '#EF4444',
  },
};

