import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import type { RouteStopItem } from "@/lib/data/routes";
import type { DriverLocation } from "@/lib/data/tracking";

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
  const region = useMemo(() => {
    if (stops.length === 0 && !driverLocation) {
      return {
        latitude: 8.6543,
        longitude: 124.755,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    const lats = stops.map((s) => s.latitude);
    const lngs = stops.map((s) => s.longitude);
    if (driverLocation) {
      lats.push(driverLocation.latitude);
      lngs.push(driverLocation.longitude);
    }
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.6),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.6),
    };
  }, [driverLocation, stops]);

  useEffect(() => {
    if (!driverLocation) return;
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
        },
      },
      { duration: 500 }
    );
  }, [driverLocation]);

  const coordinates = stops.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        scrollEnabled
        zoomEnabled
      >
        {coordinates.length >= 2 ? (
          <Polyline coordinates={coordinates} strokeColor="#056636" strokeWidth={4} />
        ) : null}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
            description={stop.description}
          />
        ))}
        {driverLocation ? (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title={`${driverLocation.driverName} — Driver`}
            description={
              driverLocation.isTracking
                ? "Live driver location"
                : `Last update: ${new Date(driverLocation.updatedAt).toLocaleTimeString()}`
            }
            pinColor={driverLocation.isTracking ? "#2563eb" : "#6b7280"}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
});
