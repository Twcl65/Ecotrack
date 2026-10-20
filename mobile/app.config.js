const appJson = require("./app.json");

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tlavvezevslzjwdtkjaa.supabase.co";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYXZ2ZXpldnNsemp3ZHRramFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MzAyNjIsImV4cCI6MjEwMjAwNjI2Mn0.U9guoO6U53HQubM7Gcb4L8zOoqpAcDHTfIcEUZbqeqc";

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
