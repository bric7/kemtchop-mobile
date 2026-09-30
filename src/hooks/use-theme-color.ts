// app/hooks/use-theme-color.ts
import { useColorScheme } from 'react-native';

// 🎨 Palette de secours intégrée directement pour éviter les crashs d'imports
const localColors = {
  light: {
    text: '#111827',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ecedee',
    background: '#151718',
    tint: '#fff',
    icon: '#9ba1a6',
    tabIconDefault: '#9ba1a6',
    tabIconSelected: '#fff',
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof localColors.light & keyof typeof localColors.dark
) {
  // Récupération directe via le hook natif de React Native
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return localColors[theme][colorName];
  }
}