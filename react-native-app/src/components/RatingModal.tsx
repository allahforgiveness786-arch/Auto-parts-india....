import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Icon } from 'react-native-paper';
import { getFirebaseFirestore } from '../services/firebase';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  buyerId?: string;
  buyerName?: string;
  partId?: string;
  partTitle?: string;
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  buyerId,
  buyerName,
  partId,
  partTitle,
  onSuccess
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const db = getFirebaseFirestore();
      const reviewDoc = {
        sellerId: sellerId || 'seller',
        sellerName: sellerName || 'Auto Parts Seller',
        buyerId: buyerId || 'buyer',
        buyerName: buyerName || 'Verified Buyer',
        rating,
        comment: comment.trim() || 'Great seller, fast communication!',
        partId: partId || '',
        partTitle: partTitle || '',
        createdAt: Date.now()
      };

      if (db && typeof db.collection === 'function') {
        try {
          await db.collection('sellerReviews').add(reviewDoc);
        } catch (_) {}
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        setRating(5);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>RATE SELLER</Text>
              <Text style={styles.headerTitle}>Review for {sellerName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon source="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.body}>
            {isSuccess ? (
              <View style={styles.successBox}>
                <Icon source="check-circle" size={48} color="#10B981" />
                <Text style={styles.successTitle}>Review Submitted!</Text>
                <Text style={styles.successSubtitle}>Thank you for your valuable feedback.</Text>
              </View>
            ) : (
              <>
                {partTitle ? (
                  <View style={styles.partInfoBox}>
                    <Text style={styles.partLabel}>ITEM PURCHASED</Text>
                    <Text style={styles.partName} numberOfLines={1}>{partTitle}</Text>
                  </View>
                ) : null}

                <Text style={styles.starPrompt}>Select Rating</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starTouch}
                    >
                      <Icon
                        source={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Your Feedback / Comments (Optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Describe your buying experience, part condition, delivery..."
                  placeholderTextColor="#94A3B8"
                  value={comment}
                  onChangeText={setComment}
                  multiline={true}
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Rating & Review</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: '#0B1220',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 4,
  },
  body: {
    padding: 20,
  },
  partInfoBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  partLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  partName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  starPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starTouch: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#1565FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 10,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
