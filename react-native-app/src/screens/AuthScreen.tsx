import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import BrandLogo from '../components/BrandLogo';
import { signInWithGoogleNative } from '../services/googleAuth';

export default function AuthScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogleNative();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      console.warn('[AuthScreen] Google Sign-In failed:', err);
      const msg = err?.message || 'Failed to sign in with Google. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Google Sign-In', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B192C" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.headerBox}>
          <BrandLogo size={75} style={styles.logo} />
          <Text variant="headlineSmall" style={styles.brandTitle}>
            AUTO PARTS <Text style={styles.accentText}>INDIA</Text>
          </Text>
          <Text variant="bodySmall" style={styles.brandSub}>
            Automotive Spare Parts Marketplace
          </Text>
          <Text style={styles.tagline}>
            India's premier automotive marketplace.{"\n"}Buy and sell genuine spare parts across India.
          </Text>
        </View>

        {/* Main Glass Card */}
        <View style={styles.card}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Sign in to Auto Parts India
          </Text>
          <Text variant="bodyMedium" style={styles.cardSubtitle}>
            Connect directly with verified mechanics, dealers, and sellers across India.
          </Text>

          {/* Error Message if any */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Icon source="alert-circle-outline" size={18} color="#F87171" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color="#0F172A" size="small" />
                <Text style={styles.googleBtnText}>Signing in...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Icon source="google" size={22} color="#EA4335" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Feature Highlights / Trust Badges */}
          <View style={styles.trustBadgesBox}>
            <View style={styles.badgeRow}>
              <Icon source="shield-check" size={16} color="#38BDF8" />
              <Text style={styles.badgeText}>Verified Sellers & Buyers</Text>
            </View>
            <View style={styles.badgeRow}>
              <Icon source="message-text-outline" size={16} color="#38BDF8" />
              <Text style={styles.badgeText}>Direct End-to-End Chat</Text>
            </View>
            <View style={styles.badgeRow}>
              <Icon source="lock-check-outline" size={16} color="#38BDF8" />
              <Text style={styles.badgeText}>Secure Google Authentication</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerBox}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Secure Note */}
          <View style={styles.secureNoteRow}>
            <Icon source="shield-check-outline" size={16} color="#10B981" />
            <Text style={styles.secureNoteText}>100% Secure authentication via Google Play Services</Text>
          </View>
        </View>

        {/* Footer Legal Terms */}
        <View style={styles.footerLegal}>
          <Text style={styles.legalNotice}>
            By continuing, you agree to Auto Parts India's
          </Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity onPress={() => setLegalModal('terms')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>•</Text>
            <TouchableOpacity onPress={() => setLegalModal('privacy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Terms / Privacy Modal */}
      <Modal
        visible={legalModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLegalModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </Text>
              <TouchableOpacity onPress={() => setLegalModal(null)} style={styles.closeBtn}>
                <Icon source="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                {legalModal === 'terms' ? (
                  `Welcome to Auto Parts India.\n\n1. Acceptance of Terms: By accessing or using this app, you agree to be bound by these terms.\n\n2. Marketplace Platform: Auto Parts India connects buyers and sellers of automotive components. We do not manufacture or inspect the parts listed by third-party sellers.\n\n3. User Conduct: Users must list only genuine parts with accurate descriptions and pricing. Fraudulent listings or harassment will result in account termination.\n\n4. Transactions: All financial deals and shipping arrangements are between buyer and seller directly.`
                ) : (
                  `Auto Parts India Privacy Policy\n\n1. Information We Collect: We collect your name, email address, and profile details provided via Google Sign-In.\n\n2. How We Use Information: To facilitate communication between buyers and sellers, provide notifications, and maintain account security.\n\n3. Data Security: Your information is stored securely via Firebase Cloud Firestore. We do not sell your personal data to any third parties.`
                )}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B192C',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    marginBottom: 10,
  },
  brandTitle: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  accentText: {
    color: '#38BDF8',
  },
  brandSub: {
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  tagline: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#0F223D',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 20,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  trustBadgesBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  guestBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  footerLegal: {
    alignItems: 'center',
    marginTop: 20,
  },
  legalNotice: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  legalLink: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  legalDot: {
    color: '#475569',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F223D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
});
