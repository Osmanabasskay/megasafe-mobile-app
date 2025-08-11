import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import React, { useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function BackFab() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const hideOn = useMemo(() => {
    const tabRoots = [
      "/(tabs)",
      "/(tabs)/index",
      "/(tabs)/groups",
      "/(tabs)/savings",
      "/(tabs)/chats",
      "/(tabs)/loans",
      "/(tabs)/profile",
      "/index",
      "/",
    ];
    return new Set(tabRoots);
  }, []);

  const canGoBack = useMemo(() => {
    try {
      const base = router.canGoBack?.() || false;
      if (!base) return false;
      if (pathname && hideOn.has(pathname)) return false;
      return true;
    } catch {
      return false;
    }
  }, [router, pathname, hideOn]);

  if (!canGoBack) return null;

  const dynamicWrap = [
    styles.backFabWrap,
    { top: Math.max((Platform.OS === "ios" ? 0 : 0) + insets.top + 8, Platform.select({ ios: 8, android: 8, default: 8 })) },
  ];

  return (
    <View pointerEvents="box-none" style={dynamicWrap}>
      <TouchableOpacity
        accessibilityRole="button"
        testID="globalBackButton"
        onPress={() => {
          try {
            if (router.canGoBack?.()) router.back();
          } catch (e) {
            console.log("[BackFab] back failed", e);
          }
        }}
        activeOpacity={0.85}
        style={styles.backFab}
      >
        <ArrowLeft color="#00157f" size={22} />
      </TouchableOpacity>
    </View>
  );
}

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
        await Font.loadAsync({
          Inter: { uri: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2" },
          Montserrat: { uri: "https://fonts.gstatic.com/s/montserrat/v26/JTURjIg1_i6t8kCHKm45_bZF.woff2" },
          "Montserrat-Bold": { uri: "https://fonts.gstatic.com/s/montserrat/v26/JTURjIg1_i6t8kCHKm45_epG3gnD-w.woff2" },
        });
      } catch (e) {
        console.log("[Fonts] load error", e);
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    })();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, fontFamily: ready ? "Inter" : undefined }}>
          <View style={{ flex: 1 }}>
            <RootLayoutNav />
            <BackFab />
          </View>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  backFabWrap: { position: "absolute", left: 16, right: undefined, bottom: undefined, zIndex: 50 },
  backFab: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5, borderWidth: 1, borderColor: "#EEF2FF" },
});