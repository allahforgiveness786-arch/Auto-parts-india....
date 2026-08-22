import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface BrandLogoProps {
  size?: number;
  style?: ViewStyle;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 48, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('../assets/logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        resizeMode="contain"
      />
    </View>
  );
};

export default BrandLogo;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

