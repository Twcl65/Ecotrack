"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CollectionMonitoringFilters from "./CollectionMonitoringFilters";
import CollectionMonitoringKpiCards from "./CollectionMonitoringKpiCards";
import CollectionProgressPanel from "./CollectionProgressPanel";
import CollectionSchedulePanel from "./CollectionSchedulePanel";
import CollectionTrackingMap from "./CollectionTrackingMap";
import { createClient } from "@/lib/supabase/client";
import {
  buildRecentActivity,
  buildRouteOverlays,
  computeMonitoringKpis,
  computeProgress,
  filterSchedules,
} from "@/lib/collection/aggregate";
import { todayIso } from "@/lib/date";
import type {
  CollectionMonitoringData,
  CollectionTruckLocation,
} from "@/types/collection-monitoring";

type Tab = "today" | "calendar";

type Props = CollectionMonitoringData;

const LOCATION_MAX_AGE_MS = 30_000;

export default function CollectionMonitoringPageContent({
  schedules,
  routes,
  routesCount,
  barangayOptions,
  driverOptions,
}: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [truckLocations, setTruckLocations] = useState<
    Map<string, CollectionTruckLocation>
  >(() => new Map());
  const [locationError, setLocationError] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso);
  const [barangay, setBarangay] = useState("all");
  const [driver, setDriver] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () => filterSchedules(schedules, { date, barangay, driver, status }),
    [schedules, date, barangay, driver, status]
  );

  const scheduleIds = useMemo(
    () => filtered.map((schedule) => schedule.id),
    [filtered]
  );
  const scheduleIdsKey = scheduleIds.join(",");
  const supabase = useMemo(() => createClient(), []);

  const refreshTruckLocations = useCallback(async () => {
    if (scheduleIds.length === 0) {
      setTruckLocations(new Map());
      setLocationError(null);
      return;
    }

    const { data, error } = await supabase
      .from("driver_locations")
      .select("schedule_id, driver_name, latitude, longitude, updated_at, is_tracking")
      .in("schedule_id", scheduleIds)
      .eq("is_tracking", true);

    if (error) {
      setLocationError(`Could not load live truck locations: ${error.message}`);
      return;
    }

    const now = Date.now();
    const nextLocations = new Map<string, CollectionTruckLocation>();
    for (const location of data ?? []) {
      const updatedAt = new Date(location.updated_at).getTime();
      const latitude = Number(location.latitude);
      const longitude = Number(location.longitude);
      if (
        !Number.isFinite(updatedAt) ||
        now - updatedAt > LOCATION_MAX_AGE_MS ||
        updatedAt > now + 60_000 ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        (latitude === 0 && longitude === 0)
      ) {
        continue;
      }

      nextLocations.set(location.schedule_id, {
        driverName: location.driver_name,
        latitude,
        longitude,
        updatedAt: location.updated_at,
      });
    }

    setTruckLocations(nextLocations);
    setLocationError(null);
  }, [scheduleIds, supabase]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void refreshTruckLocations().catch((error: unknown) => {
        if (active) {
          setLocationError(
            error instanceof Error
              ? `Could not load live truck locations: ${error.message}`
              : "Could not load live truck locations."
          );
        }
      });
    };

    refresh();
    const channel = supabase
      .channel(`collection-monitoring-truck-locations-${scheduleIdsKey || "none"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        refresh
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLocationError("Live map updates are unavailable. Retrying automatically.");
        }
      });
    const fallbackRefresh = window.setInterval(refresh, 10_000);

    return () => {
      active = false;
      window.clearInterval(fallbackRefresh);
      void supabase.removeChannel(channel);
    };
  }, [refreshTruckLocations, scheduleIdsKey, supabase]);

  const kpis = useMemo(
    () => computeMonitoringKpis(schedules, routesCount),
    [schedules, routesCount]
  );

  const { slices, overallPercent } = useMemo(
    () => computeProgress(filtered),
    [filtered]
  );

  const activities = useMemo(
    () => buildRecentActivity(schedules, date),
    [schedules, date]
  );

  const routeOverlays = useMemo(
    () => buildRouteOverlays(filtered, routes, truckLocations),
    [filtered, routes, truckLocations]
  );

  return (
    <div className="collection-monitoring-page">
      <CollectionMonitoringKpiCards kpis={kpis} />

      <CollectionMonitoringFilters
        barangayOptions={barangayOptions}
        driverOptions={driverOptions}
        barangay={barangay}
        driver={driver}
        status={status}
        date={date}
        onBarangayChange={setBarangay}
        onDriverChange={setDriver}
        onStatusChange={setStatus}
        onDateChange={setDate}
      />

      <div className="collection-monitoring-grid">
        <CollectionSchedulePanel
          tab={tab}
          onTabChange={setTab}
          date={date}
          schedules={filtered}
          allSchedules={schedules}
        />
        <CollectionTrackingMap
          overlays={routeOverlays}
          hideLegend={activityDialogOpen}
          locationError={locationError}
        />
        <CollectionProgressPanel
          slices={slices}
          overallPercent={overallPercent}
          activities={activities}
          activityDialogOpen={activityDialogOpen}
          onOpenActivityDialog={() => setActivityDialogOpen(true)}
          onCloseActivityDialog={() => setActivityDialogOpen(false)}
        />
      </div>
    </div>
  );
}
