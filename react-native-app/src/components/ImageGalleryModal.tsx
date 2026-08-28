import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { SparePart } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageGalleryModalProps {
  visible: boolean;
  part: SparePart | null;
  initialIndex?: number;
  onDismiss: () => void;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  visible,
  part,
  initialIndex = 0,
  onDismiss,
}) => {
  const images: string[] = [];
  if (part) {
    if (part.imageUrls && part.imageUrls.length > 0) {
      part.imageUrls.forEach((url) => {
        if (url && !images.includes(url)) images.push(url);
      });
    } else if (part.imageUrl) {
      images.push(part.imageUrl);
    }
  }

  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80');
  }

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = React.useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  const selectThumbnail = (idx: number) => {
    setActiveIndex(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Top Overlay Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
            <IconButton icon="close" size={24} iconColor="#FFFFFF" style={{ margin: 0 }} />
          </TouchableOpacity>

          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {activeIndex + 1} / {images.length}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Main Swiper FlatList */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(_, index) => `gallery-img-${index}`}
          initialScrollIndex={initialIndex < images.length ? initialIndex : 0}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={styles.slideItem}>
              <Image
                source={{ uri: item }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {/* Part Title and Price Footer */}
        {part && (
          <View style={styles.footerOverlay}>
            <View style={styles.partInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partTitle} numberOfLines={1}>
                  {part.title}
                </Text>
                <Text style={styles.partSub}>
                  {part.carBrand} {part.carModel} • {part.condition}
                </Text>
              </View>
              <Text style={styles.partPrice}>
                ₹{Number(part.price || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbScroll}
              >
                {images.map((imgUrl, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <TouchableOpacity
                      key={`thumb-${idx}`}
                      onPress={() => selectThumbnail(idx)}
                      style={[
                        styles.thumbBox,
                        isCurrent && styles.thumbBoxActive,
                      ]}
                    >
                      <Image source={{ uri: imgUrl }} style={styles.thumbImage} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  slideItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  partInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  partSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  partPrice: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  thumbScroll: {
    gap: 8,
    marginTop: 12,
    paddingVertical: 2,
  },
  thumbBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbBoxActive: {
    borderColor: '#1565FF',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
