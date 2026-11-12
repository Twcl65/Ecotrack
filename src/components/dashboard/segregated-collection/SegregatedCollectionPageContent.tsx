"use client";

import { FileSpreadsheet, FileText, LoaderCircle, Plus, Search, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
  getMonthlyCollectionReports,
  saveMonthlyCollectionReport,
  type MonthlyCollectionReport,
} from "@/lib/segregated-collection/monthly-data";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Props = {
  reportYear: number;
  initialReports: MonthlyCollectionReport[];
};

function formatKg(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function escapeCsv(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function SegregatedCollectionPageContent({
  reportYear: initialReportYear,
  initialReports,
}: Props) {
  const [reportYear, setReportYear] = useState(initialReportYear);
  const [reports, setReports] = useState(initialReports);
  const [monthSearch, setMonthSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("1");
  const [selectedDay, setSelectedDay] = useState("1");
  const [kilograms, setKilograms] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingYear, startLoadingYear] = useTransition();
  const [yearError, setYearError] = useState("");
  const [exportError, setExportError] = useState("");

  const reportsByDate = useMemo(
    () =>
      new Map(
        reports.map((report) => [
          `${report.monthNumber}-${report.dayNumber}`,
          report,
        ])
      ),
    [reports]
  );
  const visibleMonths = useMemo(() => {
    const query = monthSearch.trim().toLowerCase();
    return MONTHS.map((month, index) => ({ month, monthNumber: index + 1 }))
      .filter(({ month }) => month.toLowerCase().includes(query));
  }, [monthSearch]);
  const totalKg = useMemo(
    () =>
      visibleMonths.reduce(
        (total, { monthNumber }) =>
          total +
          reports
            .filter((report) => report.monthNumber === monthNumber)
            .reduce((monthTotal, report) => monthTotal + report.totalKg, 0),
        0
      ),
    [reports, visibleMonths]
  );

  function getExportRows() {
    const dailyTotals = Array.from({ length: 31 }, (_, index) => {
      const day = index + 1;
      let dayTotal = 0;
      const monthValues = visibleMonths.map(({ monthNumber }) => {
        const maxDay = new Date(Date.UTC(reportYear, monthNumber, 0)).getUTCDate();
        const amount =
          day <= maxDay
            ? reportsByDate.get(`${monthNumber}-${day}`)?.totalKg ?? null
            : null;
        if (amount !== null) dayTotal += amount;
        return amount;
      });
      return [String(day), ...monthValues.map((amount) => amount === null ? "" : String(amount)), String(dayTotal)];
    });
    const monthTotals = visibleMonths.map(({ monthNumber }) =>
      reports
        .filter((report) => report.monthNumber === monthNumber)
        .reduce((total, report) => total + report.totalKg, 0)
    );
    return {
      headers: ["Date", ...visibleMonths.map(({ month }) => month), "Total (kg)"],
      rows: [
        ...dailyTotals,
        ["Total (kg)", ...monthTotals.map(String), String(totalKg)],
      ],
    };
  }

  function exportExcel() {
    setExportError("");
    const table = getExportRows();
    const csvRows = [
      [`Collection Report - ${reportYear}`],
      [`Months: ${visibleMonths.map(({ month }) => month).join(", ") || "None"}`],
      [],
      table.headers,
      ...table.rows,
    ];
    const csv = csvRows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `collection-report-${reportYear}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportPdf() {
    setExportError("");
    const popup = window.open("", "_blank");
    if (!popup) {
      setExportError("Allow pop-ups to open the PDF export.");
      return;
    }

    const table = getExportRows();
    const headers = table.headers
      .map((header) => `<th>${escapeHtml(header)}</th>`)
      .join("");
    const rows = table.rows
      .map((row, rowIndex) => {
        const isTotalsRow = rowIndex === table.rows.length - 1;
        return `<tr class="${isTotalsRow ? "totals" : ""}">${row
          .map((value, valueIndex) => {
            if (valueIndex === 0 || !value) {
              return `<td>${escapeHtml(value)}</td>`;
            }
            if (!isTotalsRow && valueIndex === row.length - 1 && Number(value) === 0) {
              return "<td></td>";
            }
            return `<td>${escapeHtml(`${formatKg(Number(value))} kg`)}</td>`;
          })
          .join("")}</tr>`;
      })
      .join("");

    popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Collection Report - ${reportYear}</title>
<style>
body { font: 12px Arial, sans-serif; color: #17211b; margin: 24px; }
h1 { font-size: 20px; margin: 0 0 6px; }
p { color: #59665e; margin: 0 0 16px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #d6ded9; padding: 6px; text-align: right; white-space: nowrap; }
th:first-child, td:first-child { text-align: left; }
th { background: #edf3ef; }
.totals { font-weight: bold; background: #f0f7f3; }
@media print { body { margin: 10mm; } }
</style></head>
<body>
<h1>Collection Report</h1>
<p>Daily garbage collected in kilograms · ${reportYear}</p>
<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
<script>window.addEventListener("load", () => window.print());</script>
</body></html>`);
    popup.document.close();
  }
  const selectedMonthNumber = Number(selectedMonth);
  const selectedDayNumber = Number(selectedDay);
  const existingReport = reportsByDate.get(
    `${selectedMonthNumber}-${selectedDayNumber}`
  );
  const daysInSelectedMonth = new Date(
    Date.UTC(reportYear, selectedMonthNumber, 0)
  ).getUTCDate();

  function changeYear(value: string) {
    if (isLoadingYear) return;
    const nextYear = Number(value);
    if (!Number.isInteger(nextYear) || nextYear < 2000 || nextYear > 9999) {
      setYearError("Enter a year between 2000 and 9999.");
      return;
    }

    setYearError("");
    if (nextYear === reportYear) return;

    startLoadingYear(async () => {
      try {
        const nextReports = await getMonthlyCollectionReports(nextYear);
        setReports(nextReports);
        setReportYear(nextYear);
      } catch (error) {
        setYearError(
          error instanceof Error ? error.message : "Could not load reports for that year."
        );
      }
    });
  }

  const yearOptions = Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, index) => new Date().getFullYear() - index
  );

  function openDialog() {
    let monthNumber = 1;
    let dayNumber = 1;
    let foundAvailableDate = false;
    for (let month = 1; month <= 12 && !foundAvailableDate; month += 1) {
      const daysInMonth = new Date(Date.UTC(reportYear, month, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        if (!reportsByDate.has(`${month}-${day}`)) {
          monthNumber = month;
          dayNumber = day;
          foundAvailableDate = true;
          break;
        }
      }
    }

    const existing = reportsByDate.get(`${monthNumber}-${dayNumber}`);
    setSelectedMonth(String(monthNumber));
    setSelectedDay(String(dayNumber));
    setKilograms(existing ? String(existing.totalKg) : "");
    setErrorMessage("");
    setDialogOpen(true);
  }

  function changeMonth(value: string) {
    const nextMonth = Number(value);
    const maxDay = new Date(Date.UTC(reportYear, nextMonth, 0)).getUTCDate();
    const day = Math.min(selectedDayNumber, maxDay);
    setSelectedMonth(value);
    setSelectedDay(String(day));
    setKilograms(reportsByDate.get(`${nextMonth}-${day}`)?.totalKg.toString() ?? "");
    setErrorMessage("");
  }

  function changeDay(value: string) {
    setSelectedDay(value);
    setKilograms(
      reportsByDate
        .get(`${selectedMonthNumber}-${Number(value)}`)
        ?.totalKg.toString() ?? ""
    );
    setErrorMessage("");
  }

  async function saveReport() {
    const value = Number(kilograms);
    if (!kilograms.trim() || !Number.isFinite(value) || value < 0) {
      setErrorMessage("Enter a valid collected amount in kilograms.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const saved = await saveMonthlyCollectionReport({
        reportYear,
        monthNumber: selectedMonthNumber,
        dayNumber: selectedDayNumber,
        totalKg: value,
      });
      setReports((current) => [
        ...current.filter(
          (report) =>
            report.monthNumber !== saved.monthNumber ||
            report.dayNumber !== saved.dayNumber
        ),
        saved,
      ].sort(
        (a, b) =>
          a.monthNumber - b.monthNumber || a.dayNumber - b.dayNumber
      ));
      setDialogOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save the collection report."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Collection Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monthly collected garbage totals for {reportYear}.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-eco-primary px-3 py-2 text-sm font-semibold text-eco-primary hover:bg-eco-light"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-eco-primary px-3 py-2 text-sm font-semibold text-eco-primary hover:bg-eco-light"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={openDialog}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-eco-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-dark"
          >
            <Plus className="h-4 w-4" />
            Add a report
          </button>
        </div>
      </div>
      {yearError && (
        <p role="alert" className="shrink-0 text-sm text-red-600">
          {yearError}
        </p>
      )}
      {exportError && (
        <p role="alert" className="shrink-0 text-sm text-red-600">
          {exportError}
        </p>
      )}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="font-semibold text-gray-900">Daily garbage collected</h2>
            <p className="text-xs text-gray-500">
              Daily amounts are shown in kilograms for {reportYear}.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
            <label className="relative block min-w-[180px] flex-1 sm:w-[240px] sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={monthSearch}
                onChange={(event) => setMonthSearch(event.target.value)}
                placeholder="Search months"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                aria-label="Search months"
              />
            </label>
            <label className="relative block w-[120px] shrink-0">
              <select
                value={reportYear}
                onChange={(event) => changeYear(event.target.value)}
                disabled={isLoadingYear}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20 disabled:opacity-60"
                aria-label="Filter report by year"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {isLoadingYear && (
                <LoaderCircle className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-eco-primary" />
              )}
            </label>
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-auto ${isLoadingYear ? "opacity-50" : ""}`}>
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="sticky left-0 z-20 border-b border-r border-gray-200 bg-gray-50 px-3 py-3 text-center">
                  Date
                </th>
                {visibleMonths.map(({ month }) => (
                  <th
                    key={month}
                    className="border-b border-r border-gray-200 px-3 py-3 text-right"
                  >
                    {month}
                  </th>
                ))}
                <th className="border-b border-gray-200 bg-emerald-50 px-3 py-3 text-right text-emerald-800">
                  Total (kg)
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <tr key={day} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <th className="sticky left-0 border-r border-gray-100 bg-white px-3 py-3 text-center font-medium tabular-nums text-gray-700">
                    {day}
                  </th>
                  {(() => {
                    let dayTotal = 0;
                    const monthCells = visibleMonths.map(({ monthNumber }) => {
                      const maxDay = new Date(Date.UTC(reportYear, monthNumber, 0)).getUTCDate();
                      const report = day <= maxDay
                        ? reportsByDate.get(`${monthNumber}-${day}`)
                        : undefined;
                      if (report) dayTotal += report.totalKg;
                      return (
                        <td
                          key={monthNumber}
                          className="whitespace-nowrap border-r border-gray-100 px-3 py-3 text-right tabular-nums text-gray-800"
                        >
                          {day > maxDay ? "—" : report ? `${formatKg(report.totalKg)} kg` : ""}
                        </td>
                      );
                    });
                    return (
                      <>
                        {monthCells}
                        <td className="bg-emerald-50/40 px-3 py-3 text-right tabular-nums font-medium text-emerald-800">
                          {dayTotal ? `${formatKg(dayTotal)} kg` : ""}
                        </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <th className="sticky left-0 border-r border-gray-200 bg-gray-50 px-3 py-3 text-left text-gray-800">
                  Total (kg)
                </th>
                {visibleMonths.map(({ monthNumber }) => {
                  const monthTotal = reports
                    .filter((report) => report.monthNumber === monthNumber)
                    .reduce((total, report) => total + report.totalKg, 0);
                  return (
                    <td
                      key={monthNumber}
                      className="border-r border-gray-200 px-3 py-3 text-right tabular-nums text-gray-800"
                    >
                      {formatKg(monthTotal)} kg
                    </td>
                  );
                })}
                <td className="bg-emerald-50 px-3 py-3 text-right tabular-nums text-emerald-800">
                  {formatKg(totalKg)} kg
                </td>
              </tr>
            </tbody>
          </table>
          {!visibleMonths.length && (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No months match “{monthSearch}”.
            </p>
          )}
        </div>
      </section>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setDialogOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="monthly-report-title"
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="monthly-report-title" className="text-lg font-bold text-gray-900">
                  Add a collection report
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the collected amount for a month in {reportYear}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Month
                </span>
                <select
                  value={selectedMonth}
                  onChange={(event) => changeMonth(event.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date
                </span>
                <select
                  value={selectedDay}
                  onChange={(event) => changeDay(event.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                >
                  {Array.from({ length: daysInSelectedMonth }, (_, index) => index + 1).map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Garbage collected (kg)
                </span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={kilograms}
                    onChange={(event) => setKilograms(event.target.value)}
                    disabled={saving}
                    placeholder="Enter kilograms"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-12 text-sm text-gray-800 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    kg
                  </span>
                </div>
                {existingReport && (
                  <span className="mt-1.5 block text-xs text-gray-500">
                    A report already exists for {MONTHS[selectedMonthNumber - 1]} {selectedDayNumber}. Saving updates it.
                  </span>
                )}
              </label>
            </div>

            {errorMessage && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveReport()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {existingReport ? "Update report" : "Save report"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
