import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl, 
  Image, 
  Dimensions, 
  SafeAreaView, 
  StatusBar, 
  Modal, 
  Linking, 
  Alert,
  Animated,
  Easing
} from "react-native";
import { 
  Searchbar, 
  Text, 
  Chip, 
  Card, 
  FAB, 
  Badge, 
  IconButton, 
  useTheme, 
  ActivityIndicator,
  Button,
  Divider,
  Surface
} from 'react-native-paper';
import { getFirebaseFirestore } from '../services/firebase';
import { useFavorites } from '../services/favorites';
import { getCurrentLocation, reverseGeocodeOSM } from '../services/location';
import BrandLogo from '../components/BrandLogo';
import { INITIAL_SPARE_PARTS } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { UpdateDialogModal } from '../components/UpdateDialogModal';
import { InAppNotification, InAppNotificationData } from '../components/InAppNotification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated Card Component with smooth scale & fade-in entrance
function AnimatedPartCard({ item, index, navigation, styles }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index * 60, 400),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: Math.min(index * 60, 400),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => navigation.navigate('ProductDetail', { part: item })}
      >
        <Card style={styles.card} elevation={2}>
          <View style={styles.imageContainer}>
            <Card.Cover 
              source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400' }} 
              style={styles.cardImage} 
            />
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.partTitle}>
              {item.title}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={styles.partModel}>
              {item.carBrand} {item.carModel}
            </Text>
            <Text variant="bodySmall" style={styles.locationText}>
              📍 {item.location || 'India'}
            </Text>
            <View style={styles.priceRow}>
              <Text variant="titleMedium" style={styles.price}>
                ₹{item.price?.toLocaleString('en-IN')}
              </Text>
              <Chip compact style={styles.conditionChip} textStyle={{ fontSize: 10 }}>
                {item.condition || 'Used'}
              </Chip>
            </View>

            {/* Quick Contact Buttons */}
            <View style={styles.cardQuickActions}>
              <TouchableOpacity
                style={styles.waPill}
                onPress={(e) => {
                  e.stopPropagation?.();
                  const phoneClean = (item.contactPhone || '').replace(/[^0-9]/g, '');
                  const waUrl = phoneClean
                    ? `https://wa.me/91${phoneClean.slice(-10)}?text=Hi, I am interested in your listing: ${encodeURIComponent(item.title)} on Auto Parts India.`
                    : `https://wa.me/?text=Hi, I am interested in your listing: ${encodeURIComponent(item.title)}`;
                  Linking.openURL(waUrl).catch(() => Alert.alert('Notice', 'Unable to open WhatsApp'));
                }}
              >
                <IconButton icon="whatsapp" size={14} iconColor="#15803D" style={{ margin: 0, padding: 0 }} />
                <Text style={styles.waPillText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callPill}
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (item.contactPhone) {
                    Linking.openURL(`tel:${item.contactPhone}`);
                  } else {
                    Alert.alert('Notice', 'Phone number not available for this listing.');
                  }
                }}
              >
                <IconButton icon="phone" size={14} iconColor="#1565FF" style={{ margin: 0, padding: 0 }} />
                <Text style={styles.callPillText}>Call</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation, user }: any) {
  const { favorites, toggleFavorite } = useFavorites();
  const [firestoreBanners, setFirestoreBanners] = useState<any[]>([]);
  const [taxonomyCategories, setTaxonomyCategories] = useState<string[]>([]);
  const [taxonomyBrands, setTaxonomyBrands] = useState<string[]>([]);
  const theme = useTheme();
  const { t, translateDynamic, language } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All India');
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [inAppNotification, setInAppNotification] = useState<InAppNotificationData | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateConfig, setUpdateConfig] = useState<any>(null);

  // Entrance Animations for sections
  const headerFade = useRef(new Animated.Value(0)).current;
  const searchSlide = useRef(new Animated.Value(-15)).current;
  const bannersFade = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(searchSlide, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(bannersFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const displayCategories = taxonomyCategories.length > 0 
    ? ['All', ...taxonomyCategories].map(cat => ({ id: cat, name: cat, icon: 'tag-outline', count: parts.filter(p => p.category === cat).length, color: '#1565FF', bg: '#EFF6FF' })) 
    : [

    { id: 'All', name: 'All Parts', icon: 'view-grid-outline', count: parts.length, color: '#1565FF', bg: '#EFF6FF' },
    { id: 'Engine & Mechanical', name: 'Engine & Mechanical', icon: 'engine-outline', count: parts.filter(p => p.category === 'Engine & Mechanical').length, color: '#D97706', bg: '#FEF3C7' },
    { id: 'Body & Exterior', name: 'Body & Exterior', icon: 'car-door', count: parts.filter(p => p.category === 'Body & Exterior').length, color: '#4F46E5', bg: '#EEF2FF' },
    { id: 'Lights & Electricals', name: 'Lights & Electricals', icon: 'car-light-high', count: parts.filter(p => p.category === 'Lights & Electricals').length, color: '#EAB308', bg: '#FEF9C3' },
    { id: 'Suspension & Brakes', name: 'Suspension & Brakes', icon: 'car-brake-alert', count: parts.filter(p => p.category === 'Suspension & Brakes').length, color: '#E11D48', bg: '#FFE4E6' },
    { id: 'Interior & Wheels', name: 'Interior & Wheels', icon: 'steering', count: parts.filter(p => p.category === 'Interior & Wheels').length, color: '#059669', bg: '#D1FAE5' },
    { id: 'Wiring & Harnesses', name: 'Wiring & Harnesses', icon: 'lightning-bolt-outline', count: parts.filter(p => p.category === 'Wiring & Harnesses').length, color: '#0891B2', bg: '#CFFAFE' },
  ];

  const displayBrands = taxonomyBrands.length > 0
    ? ['All', ...taxonomyBrands].map(b => ({ name: b, icon: 'car-side' }))
    : [

    { name: 'All', icon: 'car-multiple' },
    { name: 'Maruti Suzuki', icon: 'car-sports' },
    { name: 'Hyundai', icon: 'car' },
    { name: 'Tata', icon: 'car-estate' },
    { name: 'Mahindra', icon: 'truck-pickup' },
    { name: 'Toyota', icon: 'car-side' },
    { name: 'Honda', icon: 'car-convertible' },
    { name: 'Kia', icon: 'car-hatchback' },
  ];

  const cities = [
    'All India', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Chennai', 
    'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur'
  ];

  const banners = [
    {
      id: '1',
      title: '0% Marketplace Commission',
      subtitle: 'Sell auto spare parts directly to verified buyers',
      tag: 'DIRECT DEAL',
      color: '#0F172A',
      accentColor: '#1565FF'
    },
    {
      id: '2',
      title: '100% Genuine Certified Parts',
      subtitle: 'Browse OEM & verified aftermarket spares across India',
      tag: 'VERIFIED',
      color: '#1E293B',
      accentColor: '#10B981'
    }
  ];

  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};
    try {
      const db = getFirebaseFirestore();
      if (!db || typeof db.collection !== 'function') {
        setParts(INITIAL_SPARE_PARTS);
        setLoading(false);
        return;
      }
      const q = db.collection('spareParts').orderBy('createdAt', 'desc');

      unsubscribe = q.onSnapshot((snapshot: any) => {
        const list: any[] = [];
        snapshot.forEach((doc: any) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        // Use real Firestore listings, or initial catalog if database is fresh
        setParts(list.length > 0 ? list : INITIAL_SPARE_PARTS);
        setLoading(false);
        setRefreshing(false);
      }, (err: any) => {
        console.warn('Notice from parts listener:', err);
        setParts((current) => current.length > 0 ? current : INITIAL_SPARE_PARTS);
        setLoading(false);
        setRefreshing(false);
      });
    } catch (queryErr) {
      console.warn('Failed to query spareParts:', queryErr);
      setParts((current) => current.length > 0 ? current : INITIAL_SPARE_PARTS);
      setLoading(false);
      setRefreshing(false);
    }

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, []);

  const filteredParts = parts.filter((part) => {
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      part.title?.toLowerCase().includes(queryLower) ||
      part.carBrand?.toLowerCase().includes(queryLower) ||
      part.carModel?.toLowerCase().includes(queryLower) ||
      part.category?.toLowerCase().includes(queryLower) ||
      part.partNumber?.toLowerCase().includes(queryLower);

    const matchesCategory = selectedCategory === 'All' || part.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || part.carBrand === selectedBrand;
    const matchesCity = selectedCity === 'All India' || !part.location || part.location.includes(selectedCity);

    return matchesSearch && matchesCategory && matchesBrand && matchesCity;
  });

  const renderPartItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.card} 
      onPress={() => navigation.navigate('ProductDetail', { part: item })}
      elevation={2}
    >
      <View style={styles.imageContainer}>
        <Card.Cover 
          source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400' }} 
          style={styles.cardImage} 
        />
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" numberOfLines={1} style={styles.partTitle}>
          {item.title}
        </Text>
        <Text variant="bodySmall" numberOfLines={1} style={styles.partModel}>
          {item.carBrand} {item.carModel}
        </Text>
        <Text variant="bodySmall" style={styles.locationText}>
          📍 {item.location || 'India'}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="titleMedium" style={styles.price}>
            ₹{item.price?.toLocaleString('en-IN')}
          </Text>
          <Chip compact style={styles.conditionChip} textStyle={{ fontSize: 10 }}>
            {item.condition || 'Used'}
          </Chip>
        </View>

        {/* Quick Contact Buttons */}
        <View style={styles.cardQuickActions}>
          <TouchableOpacity
            style={styles.waPill}
            onPress={(e) => {
              e.stopPropagation?.();
              const phoneClean = (item.contactPhone || '').replace(/[^0-9]/g, '');
              const waUrl = phoneClean
                ? `https://wa.me/91${phoneClean.slice(-10)}?text=Hi, I am interested in your listing: ${encodeURIComponent(item.title)} on Auto Parts India.`
                : `https://wa.me/?text=Hi, I am interested in your listing: ${encodeURIComponent(item.title)}`;
              Linking.openURL(waUrl).catch(() => Alert.alert('Notice', 'Unable to open WhatsApp'));
            }}
          >
            <IconButton icon="whatsapp" size={14} iconColor="#15803D" style={{ margin: 0, padding: 0 }} />
            <Text style={styles.waPillText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callPill}
            onPress={(e) => {
              e.stopPropagation?.();
              if (item.contactPhone) {
                Linking.openURL(`tel:${item.contactPhone}`);
              } else {
                Alert.alert('Notice', 'Phone number not available for this listing.');
              }
            }}
          >
            <IconButton icon="phone" size={14} iconColor="#1565FF" style={{ margin: 0, padding: 0 }} />
            <Text style={styles.callPillText}>Call</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      
      {/* Native Header */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={38} style={styles.logoImage} />
          <View>
            <Text variant="titleMedium" style={styles.headerTitle}>Auto Parts India</Text>
            <TouchableOpacity 
              style={styles.locationSelector} 
              onPress={() => setShowLocationModal(true)}
            >
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                📍 {selectedCity} ▾
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => setShowLanguageModal(true)}
          >
            <IconButton icon="translate" iconColor="#F1F5F9" size={20} style={{ margin: 0 }} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => navigation.navigate('Search')}
          >
            <IconButton icon="magnify" iconColor="#FFFFFF" size={20} style={{ margin: 0 }} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => navigation.navigate('Notifications')}
          >
            <IconButton icon="bell-outline" iconColor="#FFFFFF" size={20} style={{ margin: 0 }} />
            <Badge size={8} style={styles.badge} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search Bar & Filter Button with Slide Animation */}
      <Animated.View style={[styles.searchContainer, { transform: [{ translateY: searchSlide }] }]}>
        <Searchbar
          placeholder="Search parts, brands, models..."
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              navigation.navigate('Search', { initialQuery: searchQuery });
            }
          }}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 14 }}
          elevation={1}
        />
        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={() => setShowFilterModal(true)}
        >
          <IconButton icon="tune-variant" iconColor="#FFFFFF" size={20} style={{ margin: 0 }} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Promotional Banner Carousel */}
        <Animated.View style={{ opacity: bannersFade }}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false} 
            style={styles.bannerContainer}
          >
            {banners.map((b) => (
              <Surface key={b.id} style={[styles.bannerCard, { backgroundColor: b.color }]} elevation={2}>
                <View style={[styles.bannerTag, { backgroundColor: b.accentColor }]}>
                  <Text style={styles.bannerTagText}>{b.tag}</Text>
                </View>
                <Text variant="titleMedium" style={styles.bannerTitle}>{b.title}</Text>
                <Text variant="bodySmall" style={styles.bannerSubtitle}>{b.subtitle}</Text>
              </Surface>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Top Car Brands */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Popular Car Brands</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandList}>
          {displayBrands.map((b) => (
            <TouchableOpacity 
              key={b.name}
              style={[
                styles.brandChip,
                selectedBrand === b.name ? styles.selectedBrandChip : undefined
              ]}
              onPress={() => setSelectedBrand(b.name)}
            >
              <Text 
                style={[
                  styles.brandText,
                  selectedBrand === b.name ? styles.selectedBrandText : undefined
                ]}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Categories Visual Cards */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Top Categories</Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity onPress={() => setSelectedCategory('All')}>
              <Text style={{ fontSize: 12, color: '#1565FF', fontWeight: 'bold' }}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryCardList}>
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(isSelected ? 'All' : cat.id)}
                style={[
                  styles.categoryCard,
                  isSelected ? styles.categoryCardSelected : { backgroundColor: '#FFFFFF' }
                ]}
              >
                <View 
                  style={[
                    styles.categoryIconWrap, 
                    { backgroundColor: isSelected ? '#1565FF' : cat.bg }
                  ]}
                >
                  <IconButton
                    icon={cat.icon}
                    iconColor={isSelected ? '#FFFFFF' : cat.color}
                    size={22}
                    style={{ margin: 0 }}
                  />
                </View>
                <Text 
                  numberOfLines={2} 
                  style={[
                    styles.categoryCardTitle,
                    isSelected && styles.categoryCardTitleSelected
                  ]}
                >
                  {cat.name}
                </Text>
                <View 
                  style={[
                    styles.categoryBadge,
                    isSelected ? styles.categoryBadgeSelected : { backgroundColor: cat.bg }
                  ]}
                >
                  <Text 
                    style={[
                      styles.categoryBadgeText,
                      isSelected ? { color: '#FFFFFF' } : { color: cat.color }
                    ]}
                  >
                    {cat.count} {cat.count === 1 ? 'part' : 'parts'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Main Content Feed */}
        <View style={styles.feedHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Spare Parts {selectedCategory !== 'All' ? `• ${selectedCategory}` : ''}
          </Text>
          <Text variant="bodySmall" style={{ color: '#64748B' }}>
            {filteredParts.length} items found
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1565FF" />
          </View>
        ) : filteredParts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleSmall" style={{ color: '#475569', fontWeight: 'bold' }}>
              No spare parts found
            </Text>
            <Text variant="bodySmall" style={{ color: '#64748B', marginTop: 4, textAlign: 'center' }}>
              Try resetting your search query, brand, or location filter.
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedBrand('All');
                setSelectedCity('All India');
              }}
              style={{ marginTop: 12 }}
            >
              Reset All Filters
            </Button>
          </View>
        ) : (
          <View style={styles.partsGrid}>
            {filteredParts.map((item, idx) => (
              <View key={item.id} style={styles.gridItem}>
                <AnimatedPartCard 
                  item={item} 
                  index={idx} 
                  navigation={navigation} 
                  styles={styles} 
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Sellers with Animated Bounce */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <FAB
          icon="plus"
          label="Sell Part"
          style={styles.fab}
          color="#FFFFFF"
          onPress={() => {
            if (!user) {
              navigation.navigate('Auth');
            } else {
              navigation.navigate('SellPart');
            }
          }}
        />
      </Animated.View>

      {/* Location Selector Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>Select Location</Text>
            <Divider style={{ marginVertical: 12 }} />
            
            <TouchableOpacity 
              style={[styles.locationItem, { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, marginBottom: 8 }]}
              onPress={async () => {
                const coords = await getCurrentLocation();
                if (coords) {
                  const geo = await reverseGeocodeOSM(coords.latitude, coords.longitude);
                  if (geo?.city) {
                    setSelectedCity(geo.city);
                  }
                }
                setShowLocationModal(false);
              }}
            >
              <Text style={[styles.locationTextModal, { color: '#1565FF', fontWeight: 'bold' }]}>
                🎯 Detect Current Location (GPS)
              </Text>
            </TouchableOpacity>

            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.locationItem}
                onPress={() => {
                  setSelectedCity(city);
                  setShowLocationModal(false);
                }}
              >
                <Text style={[styles.locationTextModal, selectedCity === city ? { color: '#1565FF', fontWeight: 'bold' } : undefined]}>
                  {city}
                </Text>
                {selectedCity === city && <Text style={{ color: '#1565FF' }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <Button mode="contained" buttonColor="#0F172A" onPress={() => setShowLocationModal(false)} style={{ marginTop: 16 }}>
              Close
            </Button>
          </View>
        </View>
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>Filter Spare Parts</Text>
            <Divider style={{ marginVertical: 12 }} />

            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>Car Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {displayBrands.map((b) => (
                <Chip
                  key={b.name}
                  selected={selectedBrand === b.name}
                  onPress={() => setSelectedBrand(b.name)}
                  style={{ marginRight: 6 }}
                >
                  {b.name}
                </Chip>
              ))}
            </ScrollView>

            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {displayCategories.map((c) => (
                <Chip
                  key={c.id}
                  selected={selectedCategory === c.id}
                  onPress={() => setSelectedCategory(c.id)}
                  style={{ marginRight: 6 }}
                >
                  {c.name}
                </Chip>
              ))}
            </ScrollView>

            <Button mode="contained" buttonColor="#1565FF" onPress={() => setShowFilterModal(false)} style={{ marginTop: 16 }}>
              Apply Filters
            </Button>
          </View>
        </View>
      </Modal>

      {/* Trilingual Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onDismiss={() => setShowLanguageModal(false)}
      />

      {/* In-App Notification Overlay */}
      <InAppNotification
        notification={inAppNotification}
        onClose={() => setInAppNotification(null)}
        onPress={(notif) => {
          navigation.navigate('Chats');
        }}
      />

      {/* Version Update Check Modal */}
      {updateConfig && (
        <UpdateDialogModal
          visible={showUpdateDialog}
          versionConfig={updateConfig}
          isForceUpdate={updateConfig.forceUpdate}
          onDismiss={() => setShowUpdateDialog(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
  },
  locationSelector: {
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -12,
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#1565FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    marginTop: 16,
    paddingLeft: 16,
  },
  bannerCard: {
    width: 280,
    marginRight: 12,
    padding: 16,
    borderRadius: 16,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  brandList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  selectedBrandChip: {
    backgroundColor: '#1565FF',
  },
  brandText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedBrandText: {
    color: '#FFFFFF',
  },
  categoryCardList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  categoryCard: {
    width: 115,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 125,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  categoryCardSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#1565FF',
    borderWidth: 2,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },
  categoryCardTitleSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  categoryBadgeSelected: {
    backgroundColor: '#1565FF',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 80,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    height: 110,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  partTitle: {
    fontWeight: 'bold',
    color: '#0B1220',
    fontSize: 13,
  },
  partModel: {
    color: '#64748B',
    fontSize: 11,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 10,
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    color: '#1565FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  conditionChip: {
    height: 22,
  },
  cardQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  waPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  waPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    marginLeft: 2,
  },
  callPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  callPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1565FF',
    marginLeft: 2,
  },
  loaderContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    backgroundColor: '#1565FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationTextModal: {
    color: '#0F172A',
    fontSize: 15,
  },
});
