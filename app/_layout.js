import 'react-native-gesture-handler';
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.log('[ErrorBoundary] error', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: '#6b7280', textAlign: 'center' }}>{String(this.state.error || 'Unknown error')}</Text>
        </View>
      );
    }
    return this.props.children;
  }
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
      }
    })();
  }, []);

  const onRootLayout = () => {
    if (ready) {
      try { SplashScreen.hideAsync(); } catch (e) { console.log('[Splash] hide error', e); }
    }
  };

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onRootLayout}>
          <ErrorBoundary>
            <View style={{ flex: 1 }}>
              <RootLayoutNav />
            </View>
          </ErrorBoundary>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
