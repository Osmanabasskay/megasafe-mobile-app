import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import { View, Text, Platform } from "react-native";

try { SplashScreen.preventAutoHideAsync(); } catch (e) { console.log("[Splash] preventAutoHideAsync error", e); }

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (Text && !Text.defaultProps) Text.defaultProps = {};
          if (Text) {
            Text.defaultProps.style = [{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial', color: '#111827' }, Text.defaultProps.style];
          }
        }
      } catch (e) {
        console.log("[Init] error", e);
      } finally {
        setReady(true);
        try { SplashScreen.hideAsync(); } catch {}
      }
    })();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <RootLayoutNav />
          </View>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
