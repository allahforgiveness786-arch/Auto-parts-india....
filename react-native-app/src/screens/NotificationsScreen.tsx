import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function NotificationsScreen({ navigation }: any) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = auth().currentUser;

  const fetchNotifications = () => {
    try {
      const unsub = firestore()
        .collection('announcements')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(
          (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            setAnnouncements(list);
            setLoading(false);
            setRefreshing(false);
          },
          (err) => {
            console.warn('[NotificationsScreen] Snapshot error:', err);
            setLoading(false);
            setRefreshing(false);
          }
        );
      return unsub;
    } catch (e) {
      console.warn('[NotificationsScreen] Fetch error:', e);
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  };

  useEffect(() => {
    const unsub = fetchNotifications();
    return () => {
      try {
        unsub();
      } catch (_) {}
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getIconAndColor = (type?: string) => {
    switch (type) {
      case 'alert':
        return { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'update':
        return { icon: 'cellphone-arrow-down', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'broadcast':
      default:
        return { icon: 'bullhorn-variant', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    }
  };

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const { icon, color, bg } = getIconAndColor(item.type);

    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: bg }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text variant="titleSmall" style={styles.annTitle} numberOfLines={1}>
                {item.title || 'Platform Announcement'}
              </Text>
              <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.authorText}>
              {item.authorEmail ? `By ${item.authorEmail.split('@')[0]}` : 'Auto Parts India Official'}
            </Text>
          </View>
        </View>

        <Text style={styles.annText}>{item.text || item.message || ''}</Text>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#38BDF8" size="large" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <MaterialCommunityIcons name="bell-off-outline" size={48} color="#64748B" />
          </View>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Notifications Yet
          </Text>
          <Text style={styles.emptySubtitle}>
            Platform announcements, updates, and notices will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38BDF8"
              colors={['#38BDF8']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#0F1E36',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  annTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
  },
  authorText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  annText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 13,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
