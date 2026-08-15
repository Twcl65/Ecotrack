import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { useAuth } from "@/context/AuthContext";

export function useLogout() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const error = await signOut();
      if (error) {
        const message = error ?? "Could not sign out. Please try again.";
        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Logout failed", message);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [loading, signOut]);

  return { logout, loading };
}
