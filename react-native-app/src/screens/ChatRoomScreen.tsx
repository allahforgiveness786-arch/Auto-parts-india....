import React, { useState, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Image, Alert, ScrollView } from "react-native";
import { TextInput, IconButton, Text, useTheme, Button, Chip } from 'react-native-paper';
import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';
import { promptImageSourceDialog } from '../services/imagePickerService';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';

export default function ChatRoomScreen({ route, user: initialUser }: any) {
  const { chatId, part } = route.params || {};
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const user = initialUser || getCurrentUser();
  const { t, translateDynamic } = useLanguage();

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

  const sendMessage = async (textToSend: string, imageUrl?: string) => {
    if ((!textToSend.trim() && !imageUrl) || !chatId || !user) return;
    setInputText('');

    try {
      const db = getFirebaseFirestore();
      if (!db || typeof db.collection !== 'function') return;

      const messagesRef = db.collection('chats').doc(chatId).collection('messages');
      await messagesRef.add({
        senderId: user.uid || user.id,
        senderName: user.displayName || user.email || 'User',
        text: textToSend,
        imageUrl: imageUrl || null,
        createdAt: Date.now()
      });

      const chatDocRef = db.collection('chats').doc(chatId);
      await chatDocRef.set({
        id: chatId,
        partTitle: part?.title || part?.partTitle || 'Spare Part',
        lastMessageText: imageUrl ? '📷 Image' : textToSend,
        lastMessageAt: Date.now(),
        lastSenderId: user.uid || user.id,
        participants: [user.uid || user.id, part?.sellerId || 'seller']
      }, { merge: true });
    } catch (err) {
      console.warn('Error sending message:', err);
    }
  };

  const handleSend = () => sendMessage(inputText);

    const handlePickImage = async () => {
    try {
      const selectedUri = await promptImageSourceDialog('Upload Image', 'Choose an image to send');
      if (selectedUri) {
        setIsUploading(true);
        try {
          const cloudinaryUrl = await uploadImageToCloudinary(selectedUri, 'chat_images');
          await sendMessage('', cloudinaryUrl);
        } catch (err) {
          console.warn('Chat image upload error', err);
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
        ) : null}
        {item.text ? (
          <Text style={isMe ? styles.myText : styles.theirText}>{item.text}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Product Banner */}
      <View style={styles.productBanner}>
        <Image 
          source={{ uri: part?.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200' }} 
          style={styles.productImage} 
        />
        <View style={styles.productInfo}>
          <Text variant="labelSmall" style={styles.inquiryLabel}>{translateDynamic('INQUIRY ABOUT')}</Text>
          <Text variant="titleSmall" numberOfLines={1} style={styles.productTitle}>
            {part?.title || 'Spare Part'}
          </Text>
          <Text variant="labelMedium" style={styles.productPrice}>
            ₹{part?.price || '0'}
          </Text>
        </View>
        <View style={styles.actionBadge}>
          <Text style={styles.activeChatText}>{translateDynamic('Active Chat')}</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />

      {/* Quick Reply Chips Bar */}
      <View style={styles.quickReplyContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyList}>
          {['Is this available?', 'Is the price negotiable?', 'What is the condition?', 'Can you ship this?'].map((reply, index) => (
            <Chip 
              key={index} 
              style={styles.quickReplyChip}
              textStyle={styles.quickReplyText}
              onPress={() => sendMessage(translateDynamic(reply))}
            >
              {translateDynamic(reply)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <IconButton icon="camera" size={24} iconColor="#64748B" onPress={handlePickImage} />
        <IconButton icon="image" size={24} iconColor="#64748B" onPress={handlePickImage} style={{ marginLeft: -8 }} />
        <TextInput
          placeholder={translateDynamic("Type a message...")}
          value={inputText}
          onChangeText={setInputText}
          mode="outlined"
          style={styles.input}
          outlineColor="transparent"
          activeOutlineColor="transparent"
        />
        <IconButton
          icon="send"
          iconColor="#1565FF"
          size={24}
          onPress={handleSend}
          disabled={!inputText.trim()}
        />
      </View>

      <LanguageSelectorModal 
        visible={showLanguageModal}
        onDismiss={() => setShowLanguageModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  inquiryLabel: {
    color: '#1565FF',
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 2,
  },
  productTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 2,
  },
  actionBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  activeChatText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
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
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
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
  quickReplyContainer: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
  },
  quickReplyList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  quickReplyText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 40,
  },
});
