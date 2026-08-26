const appJson = require("./app.json");

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tlavvezevslzjwdtkjaa.supabase.co";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_U-xYb9ZltC6Jn4FUIbyvuQ_g5aOPBWd";

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      supabaseUrl,
      supabaseAnonKey,
    },
    android: {
      ...appJson.expo.android,
      versionCode: 1,
      softwareKeyboardLayoutMode: "resize",
      permissions: [
        "INTERNET",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],
    },
  },
};
