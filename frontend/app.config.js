export default {
  expo: {
    name: "Zenca",
    slug: "zenca",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.zenca.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.zenca.app",
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            googleServicesFile: "./google-services.json"
          },
          ios: {
            googleServicesFile: "./GoogleService-Info.plist"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "2eac6f53-97bd-42c4-a2ce-94043f908656"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      supabaseEdgeFunctionUrl: process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_URL
    }
  }
};