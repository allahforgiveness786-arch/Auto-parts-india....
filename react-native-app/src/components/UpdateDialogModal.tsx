import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Text, IconButton, Surface, Button } from 'react-native-paper';
import { AppVersionConfig } from '../types';

interface UpdateDialogModalProps {
  visible: boolean;
  versionConfig: AppVersionConfig;
  currentVersion?: string;
  isForceUpdate?: boolean;
  onDismiss?: () => void;
}

export const UpdateDialogModal: React.FC<UpdateDialogModalProps> = ({
  visible,
  versionConfig,
  currentVersion = '1.0.0',
  isForceUpdate = false,
  onDismiss,
}) => {
  const handleUpdate = () => {
    const targetUrl = versionConfig.apkDownloadUrl || versionConfig.playStoreUrl;
    if (targetUrl) {
      Linking.openURL(targetUrl).catch((err) => {
        console.warn('[UpdateDialogModal] Failed to open URL:', err);
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isForceUpdate ? undefined : onDismiss}
    >
      <View style={styles.backdrop}>
        <Surface style={styles.card} elevation={5}>
          {/* Header Banner */}
          <View
            style={[
              styles.headerBanner,
              isForceUpdate ? styles.headerBannerRed : styles.headerBannerBlue,
            ]}
          >
            <View style={styles.bannerIconContainer}>
              <IconButton
                icon={isForceUpdate ? 'shield-alert' : 'sparkles'}
                iconColor="#FDE047"
                size={26}
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTag}>
                {isForceUpdate ? 'CRITICAL UPDATE REQUIRED' : 'NEW VERSION AVAILABLE'}
              </Text>
              <Text style={styles.bannerTitle}>
                Auto Parts India v{versionConfig.latestVersion}
              </Text>
            </View>
            {!isForceUpdate && onDismiss && (
              <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
                <IconButton icon="close" size={18} iconColor="#FFFFFF" style={{ margin: 0 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* Body Content */}
          <View style={styles.body}>
            {/* Version compare card */}
            <View style={styles.versionCompareRow}>
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>CURRENT VERSION</Text>
                <Text style={styles.compareVal}>v{currentVersion}</Text>
              </View>
              <View style={styles.compareDivider} />
              <View style={styles.compareCol}>
                <Text style={[styles.compareLabel, { color: '#6366F1' }]}>LATEST VERSION</Text>
                <Text style={[styles.compareVal, { color: '#818CF8' }]}>
                  v{versionConfig.latestVersion}
                </Text>
              </View>
            </View>

            {/* Release Date */}
            {versionConfig.releaseDate ? (
              <View style={styles.dateRow}>
                <IconButton icon="calendar-clock" size={16} iconColor="#94A3B8" style={{ margin: 0 }} />
                <Text style={styles.dateText}>Release Date: {versionConfig.releaseDate}</Text>
              </View>
            ) : null}

            {/* Release Notes */}
            <Text style={styles.notesHeader}>WHAT'S NEW</Text>
            <ScrollView style={styles.notesContainer}>
              <Text style={styles.notesText}>
                {versionConfig.releaseNotes ||
                  '• Performance enhancements & speed improvements\n• Live GPS auto-detection updates\n• Bug fixes and stability patches.'}
              </Text>
            </ScrollView>

            {isForceUpdate && (
              <View style={styles.criticalNotice}>
                <IconButton icon="alert-circle-outline" size={16} iconColor="#EF4444" style={{ margin: 0 }} />
                <Text style={styles.criticalNoticeText}>
                  This update is required to continue accessing marketplace data securely.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {!isForceUpdate && onDismiss && (
                <Button
                  mode="outlined"
                  onPress={onDismiss}
                  style={styles.laterBtn}
                  labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
                >
                  Later
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleUpdate}
                style={[
                  styles.updateBtn,
                  isForceUpdate ? styles.updateBtnRed : styles.updateBtnBlue,
                ]}
                labelStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                icon="download"
              >
                Update Now
              </Button>
            </View>
          </View>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerBanner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBannerBlue: {
    backgroundColor: '#2563EB',
  },
  headerBannerRed: {
    backgroundColor: '#DC2626',
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTag: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 18,
  },
  versionCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compareCol: {
    flex: 1,
    alignItems: 'center',
  },
  compareDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
  },
  compareLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  compareVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: 'monospace',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  notesHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  notesContainer: {
    maxHeight: 120,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  criticalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  criticalNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#FCA5A5',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  laterBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#475569',
  },
  updateBtn: {
    flex: 1.5,
    borderRadius: 12,
  },
  updateBtnBlue: {
    backgroundColor: '#1565FF',
  },
  updateBtnRed: {
    backgroundColor: '#DC2626',
  },
});
