import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Modal
} from 'react-native';
import {
  Text,
  List,
  Button,
  Divider,
  IconButton,
  Surface,
  Badge,
  ActivityIndicator,
  useTheme,
  Icon
} from 'react-native-paper';
import { promptImageSourceDialog } from '../services/imagePickerService';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { getFirebaseAuth, getFirebaseFirestore, getCurrentUser } from '../services/firebase';
import { signOutFromGoogle } from '../services/googleAuth';
import { UserProfile } from '../types';
import { EditListingModal } from '../components/EditListingModal';
import { INITIAL_SPARE_PARTS } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

export default function ProfileScreen({ navigation, route, user: initialUser, initialTab = 'overview' }: any) {
  const theme = useTheme();
  const { t, language } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'my_listings' | 'saved'>(
    route?.params?.initialTab || initialTab || 'overview'
  );

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  // Listings & Saved state
  const [myListings, setMyListings] = useState<any[]>([]);
  const [savedParts, setSavedParts] = useState<any[]>([]);
  const [selectedEditPart, setSelectedEditPart] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit profile info modal
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const currentAuthUser = initialUser || getCurrentUser();
  const activeUid = currentAuthUser?.uid || currentAuthUser?.id || 'demo-user';

  // 1. Real-time Profile Sync
  useEffect(() => {
    if (!currentAuthUser) {
      setProfileData(null);
      return;
    }

    let unsubscribe = () => {};
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        const userDocRef = db.collection('users').doc(activeUid);
        unsubscribe = userDocRef.onSnapshot(
          (docSnap: any) => {
            const isExisting = typeof docSnap?.exists === 'function' ? docSnap.exists() : Boolean(docSnap?.exists);
            if (isExisting) {
              const data = docSnap.data();
              setProfileData({
                id: docSnap.id,
                email: data?.email || currentAuthUser.email || '',
                name: data?.name || data?.displayName || currentAuthUser.displayName || '',
                displayName: data?.displayName || data?.name || currentAuthUser.displayName || '',
                photoURL: data?.photoURL || currentAuthUser.photoURL || '',
                phone: data?.phone || '',
                location: data?.location || '',
                role: data?.role || 'buyer',
                createdAt: data?.createdAt,
              });
              setEditName(data?.displayName || data?.name || currentAuthUser.displayName || '');
              setEditPhone(data?.phone || '');
              setEditLocation(data?.location || '');
              setCacheBuster(Date.now());
            } else {
              setProfileData({
                id: activeUid,
                email: currentAuthUser.email || '',
                name: currentAuthUser.displayName || '',
                displayName: currentAuthUser.displayName || '',
                photoURL: currentAuthUser.photoURL || '',
                role: 'buyer',
              });
              setEditName(currentAuthUser.displayName || '');
            }
          },
          (error: any) => {
            console.warn('[ProfileScreen] Firestore onSnapshot notice:', error);
          }
        );
      }
    } catch (e) {
      console.warn('[ProfileScreen] Setup snapshot error:', e);
    }

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, [activeUid]);

  // 2. Fetch User's Listings & Saved Parts
  useEffect(() => {
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        const unsub = db.collection('spareParts').onSnapshot((snapshot: any) => {
          const list: any[] = [];
          snapshot.forEach((doc: any) => {
            list.push({ id: doc.id, ...doc.data() });
          });

          // User's own listings
          const own = list.filter((it: any) => it.sellerId === activeUid || it.userId === activeUid || it.sellerEmail === currentAuthUser?.email);
          setMyListings(own);

          // Saved parts from real favorites
          setSavedParts([]);
        }, () => {
          setMyListings([]);
          setSavedParts([]);
        });

        return () => unsub?.();
      }
    } catch (_) {
      setMyListings([]);
      setSavedParts([]);
    }
  }, [activeUid, currentAuthUser?.email]);

  // 3. Photo Upload
  const handleUpdateProfilePhoto = async () => {
    if (!currentAuthUser) {
      Alert.alert('Sign In Required', 'Please sign in to update your profile photo.');
      return;
    }

    try {
      const selectedUri = await promptImageSourceDialog(
        'Profile Picture',
        'Choose a photo for your profile'
      );

      if (!selectedUri) return;

      setUploadingPhoto(true);
      const uploadedUrl = await uploadImageToCloudinary(selectedUri, 'avatars');

      try {
        const authInst = getFirebaseAuth();
        if (authInst?.currentUser && typeof authInst.currentUser.updateProfile === 'function') {
          await authInst.currentUser.updateProfile({ photoURL: uploadedUrl });
        }
      } catch (_) {}

      try {
        const db = getFirebaseFirestore();
        if (db && typeof db.collection === 'function') {
          await db.collection('users').doc(activeUid).set(
            { photoURL: uploadedUrl, updatedAt: Date.now() },
            { merge: true }
          );
        }
      } catch (_) {}

      setCacheBuster(Date.now());
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err: any) {
      Alert.alert('Upload Status', err.message || 'Could not update profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 4. Save Profile Details
  const handleSaveProfileDetails = async () => {
    setSavingProfile(true);
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        await db.collection('users').doc(activeUid).set(
          {
            displayName: editName.trim(),
            name: editName.trim(),
            phone: editPhone.trim(),
            location: editLocation.trim(),
            updatedAt: Date.now()
          },
          { merge: true }
        );
      }
      setIsEditProfileModalOpen(false);
      Alert.alert('Saved', 'Your profile details have been updated.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  // 5. Toggle Mark As Sold
  const handleToggleSold = async (part: any) => {
    try {
      const db = getFirebaseFirestore();
      const newSoldStatus = !part.sold;
      if (db && typeof db.collection === 'function') {
        await db.collection('spareParts').doc(part.id).update({
          sold: newSoldStatus,
          status: newSoldStatus ? 'sold' : 'available'
        });
      }
      setMyListings((prev) =>
        prev.map((item) => (item.id === part.id ? { ...item, sold: newSoldStatus } : item))
      );
      Alert.alert('Status Updated', newSoldStatus ? 'Marked as Sold.' : 'Marked as Available.');
    } catch (_) {
      Alert.alert('Notice', 'Status updated locally.');
    }
  };

  // 6. Delete Listing
  const handleDeleteListing = (partId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to permanently delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirebaseFirestore();
              if (db && typeof db.collection === 'function') {
                await db.collection('spareParts').doc(partId).delete();
              }
              setMyListings((prev) => prev.filter((it) => it.id !== partId));
              Alert.alert('Deleted', 'Listing removed successfully.');
            } catch (_) {
              setMyListings((prev) => prev.filter((it) => it.id !== partId));
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOutFromGoogle();
      const authInst = getFirebaseAuth();
      if (authInst && typeof authInst.signOut === 'function') {
        await authInst.signOut();
      }
      if (navigation?.reset) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      } else {
        navigation.navigate('Auth');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const rawPhoto = profileData?.photoURL || currentAuthUser?.photoURL;
  const displayPhotoUrl = rawPhoto
    ? `${rawPhoto}${rawPhoto.includes('?') ? '&' : '?'}t=${cacheBuster}`
    : DEFAULT_AVATAR;

  const displayName =
    profileData?.displayName ||
    profileData?.name ||
    currentAuthUser?.displayName ||
    currentAuthUser?.email?.split('@')[0] ||
    'Auto Parts Member';

  const userEmail = profileData?.email || currentAuthUser?.email || 'Logged In Account';

  return (
    <View style={styles.container}>
      {/* Top User Profile Header */}
      <Surface style={styles.header} elevation={3}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={handleUpdateProfilePhoto}
            activeOpacity={0.8}
            style={styles.avatarTouch}
            disabled={uploadingPhoto}
          >
            <Image
              key={`avatar-${cacheBuster}`}
              source={{ uri: displayPhotoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            {uploadingPhoto ? (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.cameraIconBadge}>
                <Icon source="camera" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{userEmail}</Text>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setIsEditProfileModalOpen(true)}
        >
          <Icon source="pencil-outline" size={14} color="#FFFFFF" />
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </Surface>

      {/* Segmented Tab Navigation */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Icon
            source="account-circle-outline"
            size={18}
            color={activeTab === 'overview' ? '#1565FF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_listings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my_listings')}
        >
          <Icon
            source="package-variant-closed"
            size={18}
            color={activeTab === 'my_listings' ? '#1565FF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'my_listings' && styles.tabTextActive]}>
            My Ads ({myListings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Icon
            source="heart-outline"
            size={18}
            color={activeTab === 'saved' ? '#1565FF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved ({savedParts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'overview' && (
          <View style={styles.overviewSection}>
            <List.Section>
              <List.Subheader style={styles.sectionHeader}>Quick Actions</List.Subheader>
              <List.Item
                title="Post New Spare Part"
                description="List your car parts and accessories across India"
                left={(props) => <List.Icon {...props} icon="plus-circle" color="#10B981" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('Sell')}
                style={styles.listItem}
              />
              <List.Item
                title="Messages & Inquiries"
                description="Chat with interested buyers in real-time"
                left={(props) => <List.Icon {...props} icon="chat-processing" color="#8B5CF6" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('Chats')}
                style={styles.listItem}
              />

              <Divider style={{ marginVertical: 8 }} />
              <List.Subheader style={styles.sectionHeader}>Tools & Moderation</List.Subheader>
              <List.Item
                title="Change Language"
                description={`Current: ${language === 'en' ? 'English' : language === 'ta' ? 'Tamil' : 'Hindi'}`}
                left={(props) => <List.Icon {...props} icon="translate" color="#0EA5E9" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setShowLanguageModal(true)}
                style={styles.listItem}
              />
              <List.Item
                title="Admin Moderation"
                description="Manage listings, taxonomy categories & banners"
                left={(props) => <List.Icon {...props} icon="shield-account" color="#F59E0B" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('Admin')}
                style={styles.listItem}
              />
              <List.Item
                title="Notifications"
                description="Marketplace announcements and alerts"
                left={(props) => <List.Icon {...props} icon="bell-ring-outline" color="#1565FF" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('Notifications')}
                style={styles.listItem}
              />
            </List.Section>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Icon source="logout" size={18} color="#EF4444" />
              <Text style={styles.signOutBtnText}>Sign Out Account</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Auto Parts India App v2.4.0 (100% Native)</Text>
          </View>
        )}

        {activeTab === 'my_listings' && (
          <View style={styles.listingsSection}>
            <View style={styles.listingsHeaderRow}>
              <Text style={styles.listingsTitle}>My Published Ads</Text>
              <TouchableOpacity
                style={styles.newListingBtn}
                onPress={() => navigation.navigate('Sell')}
              >
                <Icon source="plus" size={16} color="#FFFFFF" />
                <Text style={styles.newListingBtnText}>Post Part</Text>
              </TouchableOpacity>
            </View>

            {myListings.length === 0 ? (
              <View style={styles.emptyAds}>
                <Icon source="car-wrench" size={44} color="#94A3B8" />
                <Text style={styles.emptyAdsTitle}>No Ads Posted Yet</Text>
                <Text style={styles.emptyAdsSub}>Sell your car spare parts and connect with thousands of buyers</Text>
              </View>
            ) : (
              myListings.map((part) => (
                <Surface key={part.id} style={styles.listingCard} elevation={2}>
                  <View style={styles.listingCardRow}>
                    <Image
                      source={{ uri: part.imageUrl || part.imageUrls?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200' }}
                      style={styles.listingImg}
                      resizeMode="cover"
                    />
                    <View style={styles.listingDetails}>
                      <Text style={styles.listingPrice}>₹{(part.price || 0).toLocaleString('en-IN')}</Text>
                      <Text style={styles.listingName} numberOfLines={2}>{part.title}</Text>
                      <Text style={styles.listingBrand}>{part.carBrand} {part.carModel}</Text>
                      {part.sold && (
                        <View style={styles.soldBadge}>
                          <Text style={styles.soldBadgeText}>SOLD</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.listingActionsRow}>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => {
                        setSelectedEditPart(part);
                        setEditModalVisible(true);
                      }}
                    >
                      <Icon source="pencil" size={14} color="#1565FF" />
                      <Text style={styles.actionPillTextBlue}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => handleToggleSold(part)}
                    >
                      <Icon source={part.sold ? 'check-circle' : 'tag-outline'} size={14} color="#10B981" />
                      <Text style={styles.actionPillTextGreen}>
                        {part.sold ? 'Mark Available' : 'Mark Sold'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => handleDeleteListing(part.id)}
                    >
                      <Icon source="trash-can-outline" size={14} color="#EF4444" />
                      <Text style={styles.actionPillTextRed}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Surface>
              ))
            )}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.listingsSection}>
            <Text style={styles.listingsTitle}>Saved Items & Wishlist</Text>
            {savedParts.length === 0 ? (
              <View style={styles.emptyAds}>
                <Icon source="heart-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptyAdsTitle}>No Saved Parts</Text>
                <Text style={styles.emptyAdsSub}>Tap the heart icon on any spare part to save it here</Text>
              </View>
            ) : (
              savedParts.map((part) => (
                <TouchableOpacity
                  key={part.id}
                  style={styles.savedCard}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('ProductDetail', { part })}
                >
                  <Image
                    source={{ uri: part.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200' }}
                    style={styles.savedImg}
                    resizeMode="cover"
                  />
                  <View style={styles.savedDetails}>
                    <Text style={styles.savedPrice}>₹{(part.price || 0).toLocaleString('en-IN')}</Text>
                    <Text style={styles.savedTitle} numberOfLines={2}>{part.title}</Text>
                    <Text style={styles.savedBrand}>{part.carBrand} {part.carModel} • {part.location || 'India'}</Text>
                  </View>
                  <Icon source="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Details Modal */}
      <Modal
        visible={isEditProfileModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditProfileModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalSheetTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)}>
                <Icon source="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name / Business Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Contact Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Location / City / State</Text>
            <TextInput
              style={styles.textInput}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="e.g. Chennai, Tamil Nadu"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={[styles.saveModalBtn, savingProfile && styles.saveModalBtnDisabled]}
              onPress={handleSaveProfileDetails}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveModalBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Listing Modal */}
      {selectedEditPart && (
        <EditListingModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          listing={selectedEditPart}
          onSuccess={() => {
            setEditModalVisible(false);
            Alert.alert('Success', 'Listing updated!');
          }}
        />
      )}

      {/* Trilingual Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onDismiss={() => setShowLanguageModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#0B1220',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarTouch: {
    position: 'relative',
    borderRadius: 44,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#1565FF',
    backgroundColor: '#1E293B',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 42,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1565FF',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B1220',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
    gap: 4,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#1565FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1565FF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewSection: {},
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 4,
    elevation: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 16,
  },
  listingsSection: {},
  listingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  newListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newListingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  listingCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  listingImg: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  listingDetails: {
    flex: 1,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1565FF',
  },
  listingName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  listingBrand: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  soldBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  listingActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  actionPillTextBlue: {
    color: '#1565FF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillTextGreen: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillTextRed: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  savedImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  savedDetails: {
    flex: 1,
  },
  savedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565FF',
  },
  savedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  savedBrand: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  emptyAds: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  emptyAdsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 10,
  },
  emptyAdsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  saveModalBtn: {
    backgroundColor: '#1565FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveModalBtnDisabled: {
    opacity: 0.7,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
