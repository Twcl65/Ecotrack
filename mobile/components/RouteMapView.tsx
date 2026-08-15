import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import type { RouteStopItem } from "@/lib/data/routes";

type Props = {
  stops: RouteStopItem[];
  height?: number;
};

export default function RouteMapView({ stops, height = 240 }: Props) {
  const region = useMemo(() => {
    if (stops.length === 0) {
      return {
        latitude: 8.6543,
        longitude: 124.755,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    const lats = stops.map((s) => s.latitude);
    const lngs = stops.map((s) => s.longitude);
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
  }, [stops]);

  const coordinates = stops.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
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
