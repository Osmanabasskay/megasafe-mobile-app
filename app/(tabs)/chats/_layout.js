import { Stack } from 'expo-router';
import React from 'react';

export default function ChatsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[chatId]"
        options={{
          headerShown: true,
          title: 'Chat',
        }}
      />
    </Stack>
  );
}
