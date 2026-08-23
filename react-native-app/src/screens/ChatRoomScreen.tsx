import React, { useState, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { TextInput, IconButton, Card, Avatar, Text, useTheme } from 'react-native-paper';
import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';

export default function ChatRoomScreen({ route, user: initialUser }: any) {
  const { chatId, part } = route.params || {};
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const user = initialUser || getCurrentUser();

  useEffect(() => {
    if (!chatId) return;

    let unsubscribe = () => {};
    try {
      const db = getFirebaseFirestore();
      if (!db || typeof db.collection !== 'function') return;

      const messagesRef = db.collection('chats').doc(chatId).collection('messages');
      const q = messagesRef.orderBy('createdAt', 'asc');

      unsubscribe = q.onSnapshot((snapshot: any) => {
        const list: any[] = [];
        snapshot.forEach((doc: any) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setMessages(list);
      }, (err: any) => {
        console.warn('Messages snapshot error:', err);
      });
    } catch (e) {
      console.warn('Chat room snapshot error:', e);
    }

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatId || !user) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const db = getFirebaseFirestore();
      if (!db || typeof db.collection !== 'function') return;

      const messagesRef = db.collection('chats').doc(chatId).collection('messages');
      await messagesRef.add({
        senderId: user.uid || user.id,
        senderName: user.displayName || user.email || 'User',
        text: textToSend,
        createdAt: Date.now()
      });

      const chatDocRef = db.collection('chats').doc(chatId);
      await chatDocRef.set({
        id: chatId,
        partTitle: part?.title || part?.partTitle || 'Spare Part',
        lastMessageText: textToSend,
        lastMessageAt: Date.now(),
        lastSenderId: user.uid || user.id,
        participants: [user.uid || user.id, part?.sellerId || 'seller']
      }, { merge: true });
    } catch (err) {
      console.warn('Error sending message:', err);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={isMe ? styles.myText : styles.theirText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          mode="outlined"
          style={styles.input}
        />
        <IconButton
          icon="send"
          iconColor="#1565FF"
          size={28}
          onPress={handleSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1565FF',
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
  },
  myText: {
    color: '#FFFFFF',
  },
  theirText: {
    color: '#0B1220',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
  },
});
