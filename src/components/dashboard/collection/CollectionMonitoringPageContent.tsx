"use client";

import { useMemo, useState } from "react";
import CollectionMonitoringFilters from "./CollectionMonitoringFilters";
import CollectionMonitoringKpiCards from "./CollectionMonitoringKpiCards";
import CollectionProgressPanel from "./CollectionProgressPanel";
import CollectionSchedulePanel from "./CollectionSchedulePanel";
import CollectionTrackingMap from "./CollectionTrackingMap";
import {
  buildRecentActivity,
  buildRouteOverlays,
  computeMonitoringKpis,
  computeProgress,
  filterSchedules,
} from "@/lib/collection/aggregate";
import { todayIso } from "@/lib/date";
import type { CollectionMonitoringData } from "@/types/collection-monitoring";

type Tab = "today" | "calendar";

type Props = CollectionMonitoringData;

export default function CollectionMonitoringPageContent({
  schedules,
  routes,
  routesCount,
  barangayOptions,
  driverOptions,
}: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [date, setDate] = useState(todayIso);
  const [barangay, setBarangay] = useState("all");
  const [driver, setDriver] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () => filterSchedules(schedules, { date, barangay, driver, status }),
    [schedules, date, barangay, driver, status]
  );

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
        <CollectionTrackingMap
          overlays={routeOverlays}
          hideLegend={activityDialogOpen}
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
