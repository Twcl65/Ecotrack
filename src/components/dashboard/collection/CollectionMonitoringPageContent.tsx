"use client";

import { useMemo, useState } from "react";
import CollectionMonitoringFilters from "./CollectionMonitoringFilters";
import CollectionMonitoringKpiCards from "./CollectionMonitoringKpiCards";
import CollectionProgressPanel from "./CollectionProgressPanel";
import CollectionSchedulePanel from "./CollectionSchedulePanel";
import CollectionSummaryBar from "./CollectionSummaryBar";
import CollectionTrackingMap from "./CollectionTrackingMap";
import {
  buildRecentActivity,
  buildRouteOverlays,
  computeMonitoringKpis,
  computeProgress,
  computeSummary,
  filterSchedules,
} from "@/lib/collection/aggregate";
import type { CollectionMonitoringData } from "@/types/collection-monitoring";

type Tab = "today" | "calendar";

type Props = CollectionMonitoringData;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CollectionMonitoringPageContent({
  schedules,
  routes,
  routesCount,
  wasteCollectedKg,
  barangayOptions,
  driverOptions,
}: Props) {
  const defaultDate = useMemo(() => {
    const today = todayIso();
    const hasToday = schedules.some((s) => s.date === today);
    if (hasToday) return today;
    const upcoming = schedules.find((s) => s.date >= today);
    return upcoming?.date ?? schedules[schedules.length - 1]?.date ?? today;
  }, [schedules]);

  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState(defaultDate);
  const [barangay, setBarangay] = useState("all");
  const [driver, setDriver] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () => filterSchedules(schedules, { date, barangay, driver, status }),
    [schedules, date, barangay, driver, status]
  );

  const kpis = useMemo(
    () => computeMonitoringKpis(schedules, date, routesCount),
    [schedules, date, routesCount]
  );

  const { slices, overallPercent } = useMemo(
    () => computeProgress(filtered),
    [filtered]
  );

  const summary = useMemo(
    () => computeSummary(filtered, wasteCollectedKg),
    [filtered, wasteCollectedKg]
  );

  const activities = useMemo(
    () => buildRecentActivity(schedules, date),
    [schedules, date]
  );

  const routeOverlays = useMemo(
    () => buildRouteOverlays(filtered, routes),
    [filtered, routes]
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
        <CollectionTrackingMap overlays={routeOverlays} />
        <CollectionProgressPanel
          slices={slices}
          overallPercent={overallPercent}
          activities={activities}
        />
      </div>

      <CollectionSummaryBar summary={summary} />
    </div>
  );
}
