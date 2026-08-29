import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface BrandLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'horizontal' | 'full' | 'compact';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
  style?: ViewStyle;
  className?: string;
}

export const GearSpeedLogoIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#0284C7',
}) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
      }}
    >
      <MaterialCommunityIcons name="car-cog" size={size * 0.62} color={color} />
    </View>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 48,
  variant = 'icon',
  theme = 'dark',
  showTagline = false,
  style,
}) => {
  let numSize = 48;
  if (typeof size === 'number') {
    numSize = size;
  } else if (size === 'sm') {
    numSize = 32;
  } else if (size === 'md') {
    numSize = 44;
  } else if (size === 'lg') {
    numSize = 56;
  } else if (size === 'xl') {
    numSize = 72;
  } else if (size === '2xl') {
    numSize = 96;
  }

  const isLight = theme === 'light';
  const textColor = isLight ? '#0F172A' : '#F8FAFC';
  const accentColor = '#0284C7';
  const subTextColor = isLight ? '#64748B' : '#94A3B8';

  if (variant === 'icon') {
    return (
      <View style={[styles.container, style]}>
        <GearSpeedLogoIcon size={numSize} color={accentColor} />
      </View>
    );
  }

  if (variant === 'horizontal') {
    return (
      <View style={[styles.horizontalContainer, style]}>
        <GearSpeedLogoIcon size={numSize} color={accentColor} />
        <View style={styles.textColumn}>
          <Text style={[styles.brandTitle, { color: textColor, fontSize: numSize * 0.4 }]}>
            Auto<Text style={{ color: accentColor }}>Parts</Text>
          </Text>
          {showTagline && (
            <Text style={[styles.tagline, { color: subTextColor, fontSize: numSize * 0.22 }]}>
              INDIA MARKETPLACE
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Full / Default variant
  return (
    <View style={[styles.fullContainer, style]}>
      <GearSpeedLogoIcon size={numSize} color={accentColor} />
      <Text style={[styles.brandTitleFull, { color: textColor, fontSize: numSize * 0.32 }]}>
        Auto<Text style={{ color: accentColor }}>Parts</Text> India
      </Text>
      {showTagline && (
        <Text style={[styles.tagline, { color: subTextColor, fontSize: numSize * 0.18 }]}>
          Verified Genuine Auto Spares & Parts
        </Text>
      )}
    </View>
  );
};

export default BrandLogo;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  fullContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  brandTitleFull: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
