import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import WebView, { type WebView as WebViewType } from "react-native-webview";
import type { RouteStopItem } from "@/lib/data/routes";
import type { DriverLocation } from "@/lib/data/tracking";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  stops: RouteStopItem[];
  height?: number;
  driverLocation?: DriverLocation | null;
};

type MapStop = Pick<
  RouteStopItem,
  "id" | "stopOrder" | "name" | "description" | "latitude" | "longitude"
>;

type MapPayload = {
  stops: MapStop[];
  driverLocation: {
    latitude: number;
    longitude: number;
    driverName: string;
    isTracking: boolean;
    updatedAt: string;
  } | null;
};

export default function RouteMapView({
  stops,
  height = 240,
  driverLocation,
}: Props) {
  const mapRef = useRef<WebViewType>(null);
  const webViewLoaded = useRef(false);
  const { colors } = useTheme();
  const payload = useMemo<MapPayload>(() => ({
    stops: stops
      .filter((stop) => isValidCoordinate(stop.latitude, stop.longitude))
      .map(({ id, stopOrder, name, description, latitude, longitude }) => ({
        id,
        stopOrder,
        name,
        description,
        latitude,
        longitude,
      })),
    driverLocation:
      driverLocation &&
      isValidCoordinate(driverLocation.latitude, driverLocation.longitude)
        ? {
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            driverName: driverLocation.driverName,
            isTracking: driverLocation.isTracking,
            updatedAt: driverLocation.updatedAt,
          }
        : null,
  }), [driverLocation, stops]);

  const updateMap = useCallback(() => {
    if (!webViewLoaded.current) return;
    const data = JSON.stringify(payload).replace(/</g, "\\u003c");
    mapRef.current?.injectJavaScript(
      `window.updateEcotrackMap(${data}); true;`
    );
  }, [payload]);

  useEffect(() => {
    updateMap();
  }, [updateMap]);

  const mapHtml = useMemo(
    () => createLeafletHtml(colors.text),
    [colors.text]
  );

  return (
    <View style={[styles.wrap, { height }]}>
      {payload.stops.length === 0 && !payload.driverLocation ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.textMuted, textAlign: "center" }}>
            Route map is unavailable because no valid location coordinates were provided.
          </Text>
        </View>
      ) : (
        <WebView
          ref={mapRef}
          source={{ html: mapHtml, baseUrl: "https://ecotrack.local" }}
          style={styles.webView}
          originWhitelist={["https://*"]}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => {
            webViewLoaded.current = false;
          }}
          onLoadEnd={() => {
            webViewLoaded.current = true;
            updateMap();
          }}
          onError={() => {
            webViewLoaded.current = false;
          }}
          onHttpError={() => {
            webViewLoaded.current = false;
          }}
          accessibilityLabel="Interactive collection route map"
          scrollEnabled={false}
          bounces={false}
        />
      )}
    </View>
  );
}

function createLeafletHtml(textColor: string): string {
  const safeTextColor = /^#[\da-f]{6}$/i.test(textColor) ? textColor : "#1f2937";
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    * { box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; margin: 0; background: #e5e7eb; }
    .stop-icon {
      display: flex; width: 30px; height: 30px; align-items: center; justify-content: center;
      border: 2px solid white; border-radius: 50%; background: #056636; color: white;
      box-shadow: 0 1px 5px #0006; font: 700 13px sans-serif;
    }
    .driver-icon {
      width: 18px; height: 18px; border: 3px solid white; border-radius: 50%;
      background: #2563eb; box-shadow: 0 1px 5px #0007;
    }
    .leaflet-popup-content-wrapper, .leaflet-popup-tip { color: ${safeTextColor}; }
    .leaflet-control-attribution { font-size: 10px !important; }
  </style>
</head>
<body>
  <div id="map" aria-label="Collection route map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([8.6543, 124.755], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const routeLayer = L.layerGroup().addTo(map);
    let hasInitialBounds = false;

    window.updateEcotrackMap = function(data) {
      routeLayer.clearLayers();
      const points = data.stops.map(stop => [stop.latitude, stop.longitude]);

      if (points.length > 1) {
        L.polyline(points, { color: '#056636', weight: 5, opacity: 0.85 }).addTo(routeLayer);
      }

      data.stops.forEach(stop => {
        const icon = L.divIcon({
          className: '',
          html: '<div class="stop-icon">' + escapeHtml(String(stop.stopOrder)) + '</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        L.marker([stop.latitude, stop.longitude], { icon }).bindPopup(
          '<strong>' + escapeHtml(stop.name) + '</strong>' +
          (stop.description ? '<br>' + escapeHtml(stop.description) : '')
        ).addTo(routeLayer);
      });

      if (data.driverLocation) {
        const driver = data.driverLocation;
        const icon = L.divIcon({
          className: '',
          html: '<div class="driver-icon"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        const status = driver.isTracking
          ? 'Live driver location'
          : 'Last update: ' + new Date(driver.updatedAt).toLocaleTimeString();
        L.marker([driver.latitude, driver.longitude], { icon })
          .bindPopup('<strong>' + escapeHtml(driver.driverName) + ' — Driver</strong><br>' + escapeHtml(status))
          .addTo(routeLayer);
      }

      if (!hasInitialBounds) {
        const bounds = points.slice();
        if (data.driverLocation) {
          bounds.push([data.driverLocation.latitude, data.driverLocation.longitude]);
        }
        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        }
        hasInitialBounds = bounds.length > 0;
      }
    };

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[character]);
    }
  </script>
</body>
</html>`;
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
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});
