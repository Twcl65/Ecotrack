import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import type { RouteStopItem } from "@/lib/data/routes";
import type { DriverLocation } from "@/lib/data/tracking";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  stops: RouteStopItem[];
  height?: number;
  driverLocation?: DriverLocation | null;
};

export default function RouteMapView({
  stops,
  height = 240,
  driverLocation,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const { colors } = useTheme();
  const validStops = useMemo(
    () => stops.filter((stop) => isValidCoordinate(stop.latitude, stop.longitude)),
    [stops]
  );
  const validDriverLocation =
    driverLocation &&
    isValidCoordinate(driverLocation.latitude, driverLocation.longitude)
      ? driverLocation
      : null;
  const routeRegion = useMemo(() => {
    const coordinates = validStops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
    if (coordinates.length === 0) return null;
    const bounds = coordinates.reduce(
      (current, coordinate) => ({
        minLat: Math.min(current.minLat, coordinate.latitude),
        maxLat: Math.max(current.maxLat, coordinate.latitude),
        minLng: Math.min(current.minLng, coordinate.longitude),
        maxLng: Math.max(current.maxLng, coordinate.longitude),
      }),
      {
        minLat: Number.POSITIVE_INFINITY,
        maxLat: Number.NEGATIVE_INFINITY,
        minLng: Number.POSITIVE_INFINITY,
        maxLng: Number.NEGATIVE_INFINITY,
      }
    );
    return {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLng + bounds.maxLng) / 2,
      latitudeDelta: Math.min(20, Math.max(0.02, (bounds.maxLat - bounds.minLat) * 1.6)),
      longitudeDelta: Math.min(20, Math.max(0.02, (bounds.maxLng - bounds.minLng) * 1.6)),
    };
  }, [validStops]);
  const initialRegion = useMemo(
    () =>
      routeRegion ?? {
        latitude: validDriverLocation?.latitude ?? 8.6543,
        longitude: validDriverLocation?.longitude ?? 124.755,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
    [routeRegion, validDriverLocation]
  );

  useEffect(() => {
    if (!routeRegion) return;
    mapRef.current?.animateToRegion(routeRegion, 350);
  }, [routeRegion]);

  useEffect(() => {
    if (!validDriverLocation) return;
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: validDriverLocation.latitude,
          longitude: validDriverLocation.longitude,
        },
      },
      { duration: 500 }
    );
  }, [validDriverLocation]);

  const coordinates = validStops.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));
  const progressCoordinates =
    coordinates.length > 0 || validDriverLocation
      ? coordinates
      : [];

  return (
    <View style={[styles.wrap, { height }]}>
      {progressCoordinates.length === 0 && !validDriverLocation ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.textMuted, textAlign: "center" }}>
            Route map is unavailable because no valid location coordinates were provided.
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          scrollEnabled
          zoomEnabled
        >
          {progressCoordinates.length >= 2 ? (
            <Polyline coordinates={progressCoordinates} strokeColor="#056636" strokeWidth={4} />
          ) : null}
          {validStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
              description={stop.description}
            />
          ))}
          {validDriverLocation ? (
            <Marker
              coordinate={{
                latitude: validDriverLocation.latitude,
                longitude: validDriverLocation.longitude,
              }}
              title={`${validDriverLocation.driverName} — Driver`}
              description={
                validDriverLocation.isTracking
                  ? "Live driver location"
                  : `Last update: ${new Date(validDriverLocation.updatedAt).toLocaleTimeString()}`
              }
              pinColor={validDriverLocation.isTracking ? "#2563eb" : "#6b7280"}
            />
          ) : null}
        </MapView>
      )}
    </View>
  );
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});
