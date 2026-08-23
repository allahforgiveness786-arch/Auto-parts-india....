import * as RNScreens from 'react-native-screens';
if (RNScreens) {
  try {
    if (!RNScreens.compatibilityFlags) {
      (RNScreens as any).compatibilityFlags = {};
    }
    if (!RNScreens.ScreenStackItem && (RNScreens as any).Screen) {
      (RNScreens as any).ScreenStackItem = (RNScreens as any).Screen;
    }
  } catch (_) {}
}

import React from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SellPartScreen from '../screens/SellPartScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ user }: { user: any }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 6) : insets.bottom;
  const tabHeight = 56 + bottomPadding;

  return (
    <Tab.Navigator id="MainTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565FF',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" color={color} size={size || 22} />
          )
        }}
      >
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="ChatsTab" 
        options={{ 
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Icon source="message-text" color={color} size={size || 22} />
          )
        }}
      >
        {(props) => <ChatsScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="SellTab" 
        options={{ 
          title: 'Sell',
          tabBarIcon: ({ color, size }) => (
            <Icon source="plus-circle" color={color} size={size || 24} />
          )
        }}
      >
        {(props) => <SellPartScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="MyAdsTab" 
        options={{ 
          title: 'My Ads',
          tabBarIcon: ({ color, size }) => (
            <Icon source="package-variant-closed" color={color} size={size || 22} />
          )
        }}
      >
        {(props) => <ProfileScreen {...props} user={user} initialTab="my_listings" />}
      </Tab.Screen>

      <Tab.Screen 
        name="ProfileTab" 
        options={{ 
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account" color={color} size={size || 22} />
          )
        }}
      >
        {(props) => <ProfileScreen {...props} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user }: { user: any }) {
  return (
    <Stack.Navigator id="MainStack"
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1220' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="Auth" 
        component={AuthScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="MainTabs" 
        options={{ headerShown: false }}
      >
        {(props) => <TabNavigator {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="Home" 
        options={{ headerShown: false }}
      >
        {(props) => <TabNavigator {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="Chats" 
        options={{ headerShown: false }}
      >
        {(props) => <TabNavigator {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="Sell" 
        options={{ headerShown: false }}
      >
        {(props) => <TabNavigator {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="SellPart" 
        options={{ title: 'Sell Spare Part' }}
      >
        {(props) => <SellPartScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="Profile" 
        options={{ headerShown: false }}
      >
        {(props) => <TabNavigator {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="ProductDetail" 
        options={{ title: 'Part Details' }}
      >
        {(props) => <ProductDetailScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="ChatRoom" 
        options={{ title: 'Conversation' }}
      >
        {(props) => <ChatRoomScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="SellerProfile" 
        component={SellerProfileScreen}
        options={{ title: 'Seller Profile' }}
      />

      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{ title: 'Admin Moderation' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    margin: 0,
    padding: 0,
  },
});
