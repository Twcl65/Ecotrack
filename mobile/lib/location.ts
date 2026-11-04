import { Platform } from "react-native";
import * as Location from "expo-location";

type LocationReadyResult =
  | { location: Location.LocationObject }
  | { error: string };

export async function getCurrentDriverLocation(): Promise<LocationReadyResult> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (!permission.granted) {
    return {
      error: permission.canAskAgain
        ? "Allow location access to start live route tracking."
        : "Location access is blocked. Enable it in your phone settings to track this route.",
    };
  }

  let servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled && Platform.OS === "android") {
    try {
      await Location.enableNetworkProviderAsync();
      servicesEnabled = await Location.hasServicesEnabledAsync();
    } catch {
      return { error: "Turn on device location to start live route tracking." };
    }
  }
  if (!servicesEnabled) {
    return { error: "Turn on device location to start live route tracking." };
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { location };
  } catch (locationError) {
    return {
      error:
        locationError instanceof Error
          ? `Could not get a GPS fix: ${locationError.message}`
          : "Could not get a GPS fix. Check your location settings and try again.",
    };
  }
}
