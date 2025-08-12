import { Tabs, useRouter } from 'expo-router';
import { Home as HomeIcon, Users, PiggyBank, User, HandCoins, MessageCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
          router.replace('/');
        }
      } catch (e) {
        console.log('[Tabs] auth guard error', e);
        router.replace('/');
      }
    })();
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFA500',
        tabBarInactiveTintColor: '#7c7c7c',
        tabBarStyle: { backgroundColor: '#ffffff' },
        tabBarLabelStyle: { fontFamily: 'Montserrat' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <Users color={color} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Savings',
          tabBarIcon: ({ color }) => <PiggyBank color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <MessageCircle color={color} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          tabBarIcon: ({ color }) => <HandCoins color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
      {/* Hidden routes accessible via navigation only */}
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="make-payment" options={{ href: null }} />
      <Tabs.Screen name="blockchain" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="reverse-transaction" options={{ href: null }} />
    </Tabs>
  );
}