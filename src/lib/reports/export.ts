import { parseScheduleBarangays } from "@/lib/schedules/format";
import type { Complaint } from "@/types/complaint";
import type { GeneratedReport } from "@/types/reports";
import type { Route } from "@/types/routes";
import type { Schedule } from "@/types/schedules";
import type { VehicleMaintenanceData } from "@/app/dashboard/report/vehicle-actions";
import { getVehicleDriverReportRows } from "@/lib/reports/vehicle-report";

type ReportExportData = {
  schedules: Schedule[];
  complaints: Complaint[];
  routes: Route[];
  vehicleMaintenance: VehicleMaintenanceData[];
};

type ExportTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

function inReportRange(date: string, report: GeneratedReport) {
  return date >= report.fromDate && date <= report.toDate;
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function scheduleMatchesReport(schedule: Schedule, report: GeneratedReport) {
  if (schedule.archivedAt || !inReportRange(schedule.date, report)) return false;
  return (
    !report.barangayFilter ||
    parseScheduleBarangays(schedule.barangay).includes(report.barangayFilter)
  );
}

function getReportTable(report: GeneratedReport, data: ReportExportData): ExportTable {
  const schedules = data.schedules.filter((schedule) =>
    scheduleMatchesReport(schedule, report)
  );
  const routesById = new Map(data.routes.map((route) => [route.id, route]));

  switch (report.reportType) {
    case "route": {
      const byRoute = new Map<string, Schedule[]>();
      schedules.forEach((schedule) => {
        if (!schedule.routeId) return;
        const list = byRoute.get(schedule.routeId) ?? [];
        list.push(schedule);
        byRoute.set(schedule.routeId, list);
      });
      return {
        title: "Route Report",
        headers: ["Route", "Route name", "Barangay", "Driver", "Distance (km)", "Schedules", "Completed", "Status"],
        rows: data.routes
          .filter((route) => !route.archivedAt)
          .filter((route) =>
            !report.barangayFilter ||
            route.barangay.split(",").map((name) => name.trim()).includes(report.barangayFilter!)
          )
          .map((route) => {
            const routeSchedules = byRoute.get(route.id) ?? [];
            return [
              route.routeCode,
              route.name,
              route.barangay,
              route.driverName || "—",
              route.distanceKm.toFixed(1),
              String(routeSchedules.length),
              String(routeSchedules.filter((schedule) => schedule.status === "completed").length),
              route.status,
            ];
          }),
      };
    }

    case "collection":
      return {
        title: "Collection Report",
        headers: ["Date", "Route", "Driver", "Barangay", "Status"],
        rows: schedules.map((schedule) => [
          schedule.date,
          schedule.routeLabel || (schedule.routeId ? routesById.get(schedule.routeId)?.name ?? "—" : "—"),
          schedule.driver || "—",
          schedule.barangay,
          schedule.status.replace("_", " "),
        ]),
      };

    case "complaint": {
      const complaints = data.complaints.filter((complaint) => {
        const filedDate = complaint.filedAt.slice(0, 10);
        return (
          !complaint.archivedAt &&
          inReportRange(filedDate, report) &&
          (!report.barangayFilter || complaint.barangay === report.barangayFilter)
        );
      });
      return {
        title: "Complaint Report",
        headers: ["Complaint ID", "Date filed", "Complainant", "Barangay", "Issue", "Status"],
        rows: complaints.map((complaint) => [
          complaint.complaintCode,
          complaint.filedAt,
          complaint.complainantName,
          complaint.barangay,
          complaint.issue,
          complaint.status.replace("_", " "),
        ]),
      };
    }

    case "driver": {
      const byDriver = new Map<string, Schedule[]>();
      schedules.forEach((schedule) => {
        const name = schedule.driver?.trim();
        if (!name) return;
        const list = byDriver.get(name) ?? [];
        list.push(schedule);
        byDriver.set(name, list);
      });
      return {
        title: "Driver Performance Report",
        headers: ["Driver", "Schedules", "Completed", "In progress", "Canceled", "Estimated distance (km)"],
        rows: [...byDriver.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([driver, driverSchedules]) => {
            const completed = driverSchedules.filter((schedule) => schedule.status === "completed");
            const distance = completed.reduce(
              (total, schedule) =>
                total + (schedule.routeId ? routesById.get(schedule.routeId)?.distanceKm ?? 0 : 0),
              0
            );
            return [
              driver,
              String(driverSchedules.length),
              String(completed.length),
              String(driverSchedules.filter((schedule) => schedule.status === "ongoing" || schedule.status === "pending").length),
              String(driverSchedules.filter((schedule) => schedule.status === "canceled").length),
              distance.toFixed(1),
            ];
          }),
      };
    }

    case "barangay": {
      const byBarangay = new Map<string, Schedule[]>();
      schedules.forEach((schedule) => {
        parseScheduleBarangays(schedule.barangay).forEach((barangay) => {
          const list = byBarangay.get(barangay) ?? [];
          list.push(schedule);
          byBarangay.set(barangay, list);
        });
      });
      return {
        title: "Barangay Collection Report",
        headers: ["Barangay", "Schedules", "Completed", "In progress", "Canceled"],
        rows: [...byBarangay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([barangay, barangaySchedules]) => [
            barangay,
            String(barangaySchedules.length),
            String(barangaySchedules.filter((schedule) => schedule.status === "completed").length),
            String(barangaySchedules.filter((schedule) => schedule.status === "ongoing" || schedule.status === "pending").length),
            String(barangaySchedules.filter((schedule) => schedule.status === "canceled").length),
          ]),
      };
    }

    case "vehicle": {
      const driverRows = getVehicleDriverReportRows(
        data.routes,
        schedules,
        data.vehicleMaintenance,
        {
          fromDate: report.fromDate,
          toDate: report.toDate,
          barangay: report.barangayFilter ?? "all",
        }
      );
      return {
        title: "Vehicle Report",
        headers: [
          "Driver",
          "Completed schedules",
          "Estimated kilometers (km)",
          "Total travel time",
          "Maintenance schedule",
          "Last maintenance",
          "Next maintenance",
          "Maintenance history",
        ],
        rows: driverRows.map((row) => [
          row.driver,
          String(row.completedRuns),
          row.estimatedKilometers.toFixed(1),
          formatDuration(row.totalTravelMinutes),
          row.maintenanceSchedules.join("; ") || "Not set",
          row.lastMaintenanceDate || "—",
          row.nextMaintenanceDate || "—",
          row.history.map((record) => `${record.serviceDate}: ${record.description}`).join("; ") || "No history",
        ]),
      };
    }

    default:
      return { title: report.reportName, headers: [], rows: [] };
  }
}

function escapeCsv(value: string) {
  let safeValue = value;
  if (/^[=+\-@\t\r]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilename(report: GeneratedReport) {
  return report.reportName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

export function exportReportExcel(report: GeneratedReport, data: ReportExportData) {
  const table = getReportTable(report, data);
  const rows = [
    [table.title],
    [`Period: ${report.periodLabel}`],
    [`Barangay: ${report.barangayFilter || "All"}`],
    [],
    table.headers,
    ...table.rows,
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  downloadBlob(`${safeFilename(report)}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function exportReportPdf(report: GeneratedReport, data: ReportExportData) {
  const table = getReportTable(report, data);
  const headers = table.headers.map((value) => `<th>${escapeHtml(value)}</th>`).join("");
  const rows = table.rows
    .map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`)
    .join("");
  const popup = window.open("", "_blank");
  if (!popup) {
    throw new Error("Allow pop-ups to open the report print view.");
  }

  popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(table.title)}</title>
<style>
body { font: 12px Arial, sans-serif; color: #17211b; margin: 28px; }
h1 { font-size: 20px; margin: 0 0 8px; }
.meta { color: #59665e; margin: 0 0 18px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #d6ded9; padding: 7px; text-align: left; vertical-align: top; }
th { background: #edf3ef; }
@media print { body { margin: 10mm; } }
</style></head>
<body>
<h1>${escapeHtml(table.title)}</h1>
<p class="meta">${escapeHtml(report.periodLabel)} · Generated by ${escapeHtml(report.generatedBy)} · ${escapeHtml(report.dateLabel)} ${escapeHtml(report.timeLabel)}${report.barangayFilter ? ` · ${escapeHtml(report.barangayFilter)}` : ""}</p>
<table><thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="${table.headers.length}">No records match this report.</td></tr>`}</tbody></table>
<script>window.addEventListener("load", () => window.print());</script>
</body></html>`);
  popup.document.close();
}
