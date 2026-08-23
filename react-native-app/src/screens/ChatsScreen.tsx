import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { List, Avatar, Text, Badge, Divider, useTheme, Button } from 'react-native-paper';
import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';

export default function ChatsScreen({ navigation, user: initialUser }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const activeUser = initialUser || getCurrentUser();

  useEffect(() => {
    const activeUid = activeUser?.uid || activeUser?.id;
    if (!activeUid) return;

    let unsubscribe = () => {};
    try {
      const db = getFirebaseFirestore();
      if (!db || typeof db.collection !== 'function') return;

      const q = db.collection('chats').where('participants', 'array-contains', activeUid);

      unsubscribe = q.onSnapshot((snapshot: any) => {
        const list: any[] = [];
        snapshot.forEach((doc: any) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setChats(list);
      }, (err: any) => {
        console.warn('Chats snapshot error:', err);
      });
    } catch (e) {
      console.warn('Chats query error:', e);
    }

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, [activeUser?.uid, activeUser?.id]);

  if (!activeUser) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="titleMedium" style={styles.text}>Sign in to view your conversations</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Auth')} style={{ marginTop: 16 }}>
          Sign In
        </Button>
      </View>
    );
  }

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, part: { title: item.partTitle } })}
    >
      <List.Item
        title={item.partTitle || 'Spare Part Discussion'}
        description={item.lastMessageText || 'Tap to open chat'}
        left={(props) => (
          <Avatar.Image 
            {...props} 
            source={{ uri: item.partImageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=100' }} 
          />
        )}
        right={(props) => (
          <View style={styles.rightContainer}>
            <Text variant="bodySmall" style={styles.timeText}>
              {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
        )}
      />
      <Divider />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text variant="bodyMedium" style={styles.text}>No active chat conversations yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#64748B',
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    color: '#94A3B8',
  },
});
