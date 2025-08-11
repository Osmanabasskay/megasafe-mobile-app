import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const env = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (env && typeof env === "string" && env.length > 0) {
    return env;
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return ""; // relative on web
  }
  // Fallback that won't crash Expo Go; requests will simply fail if called.
  return "http://localhost:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        if (!process.env.EXPO_PUBLIC_RORK_API_BASE_URL && Platform.OS !== "web") {
          console.log("[tRPC] No EXPO_PUBLIC_RORK_API_BASE_URL set. Skipping request on native.");
          return Promise.reject(new Error("Backend not configured"));
        }
        return fetch(url, options);
      },
    }),
  ],
});