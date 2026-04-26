import axios from "../../config/axiosInstance";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck, UserX, Clock, ChevronDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

import {
  AdminLayout,
  scheduleStatusColor,
} from "../ui";

const TIME_FRAMES = ["Daily", "Weekly", "Monthly", "Yearly", "Overall"];

// Statuses we care about for chart + stat cards
const TRACKED_STATUSES = ["Scheduled", "Confirmed", "Cancelled", "Done"];

function DepartmentDropdown({ value, onChange, departments }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = value === "all"
    ? "All Departments"
    : departments.find((d) => String(d.departmentId) === String(value))?.departmentName ?? "All Departments";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
      >
        {label}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-auto bg-white rounded-xl shadow-card border border-gray-100 py-1 z-50">
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
              ${value === "all"
                ? "text-primary font-semibold bg-primary/5"
                : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Departments
          </button>
          {departments.map((d) => (
            <button
              key={d.departmentId}
              onClick={() => { onChange(String(d.departmentId)); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${String(value) === String(d.departmentId)
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
            >
              {d.departmentName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-card h-32">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6 h-[420px]">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-full bg-gray-100 rounded" />
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const [activeTimeFrame, setActiveTimeFrame] = useState("Daily");
  const [deptFilter,      setDeptFilter]      = useState("all");
  const [departments,     setDepartments]     = useState([]);
  const [stats,           setStats]           = useState({ confirmed: 0, cancelled: 0, scheduled: 0 });
  const [chartData,       setChartData]       = useState([]);
  const [chartDate,       setChartDate]       = useState("");
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    if (departments.length > 0 || deptFilter === "all") fetchDashboardData();
  }, [activeTimeFrame, deptFilter, departments]);

  function getAuthHeader() {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }

  // Safely parse a LocalDateTime that may arrive as an array [y,mo,d,h,m] or a string
  function parseDT(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) {
      const [y, mo, d, h = 0, mi = 0] = raw;
      return new Date(y, mo - 1, d, h, mi);
    }
    const str = String(raw).replace(" ", "T").split(".")[0];
    const dt  = new Date(str);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function toDateStr(raw) {
    const d = parseDT(raw);
    if (!d) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function isStatus(s, status) {
    return (s.scheduleStatus ?? "").toLowerCase() === status.toLowerCase();
  }

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const headers  = getAuthHeader();
      const filter   = activeTimeFrame.toLowerCase();
      const deptName = deptFilter === "all"
        ? undefined
        : departments.find((d) => String(d.departmentId) === String(deptFilter))?.departmentName;

      // Fetch all schedules for ALL tracked statuses (backend hasStatus() defaults to
      // Scheduled when null, so we must fetch each status separately and merge).
      const statusResults = await Promise.all(
        TRACKED_STATUSES.map((status) =>
          axios.get("/api/getSchedules", {
            headers,
            params: {
              page: 0,
              size: 2000,
              scheduleStatus: status,
              ...(deptName && { departmentName: deptName }),
            },
          })
        )
      );
      const allSched = statusResults.flatMap((res) => res.data?.content ?? []);

      // counts is still used for the Overall chart point — fetch it too
      const countsRes = await axios.get("/api/dashboard/counts", {
        headers,
        params: { filter, ...(deptName && { department: deptName }) },
      });
      const counts = countsRes.data;

      const now = new Date();

      // ── Pre-filter allSched to the active time window ───────────────────────
      // This ensures chart and boxes only count records within the selected period.
      function getWindowBounds() {
        if (activeTimeFrame === "Daily") {
          return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) };
        }
        if (activeTimeFrame === "Weekly") {
          const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
          return { start: monday, end: sunday };
        }
        if (activeTimeFrame === "Monthly") {
          return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
        }
        if (activeTimeFrame === "Yearly") {
          return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999) };
        }
        return null; // Overall — no bounds
      }

      const bounds      = getWindowBounds();
      const windowSched = bounds
        ? allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= bounds.start && d <= bounds.end; })
        : allSched;

      function countByWindow(schedules) {
        return {
          confirmed: schedules.filter((s) => isStatus(s, "Confirmed")).length,
          cancelled: schedules.filter((s) => isStatus(s, "Cancelled")).length,
          scheduled: schedules.filter((s) => isStatus(s, "Scheduled")).length,
        };
      }

      function countByDate(schedules, dateStr) {
        return countByWindow(schedules.filter((s) => toDateStr(s.startDateTime) === dateStr));
      }

      // ── Build chart series (always from windowSched) ───────────────────────
      let series     = [];
      let rangeLabel = "";

      if (activeTimeFrame === "Daily") {
        for (let h = 6; h <= 22; h++) {
          const hourSched = windowSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d.getHours() === h; });
          const period = h < 12 ? "AM" : "PM";
          const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
          series.push({ label: `${h12}${period}`, ...countByWindow(hourSched) });
        }
        rangeLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

      } else if (activeTimeFrame === "Weekly") {
        const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        for (let i = 0; i < 7; i++) {
          const d   = new Date(monday); d.setDate(monday.getDate() + i);
          series.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), ...countByDate(windowSched, toDateStr(d)) });
        }
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const fmt    = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        rangeLabel   = `${fmt(monday)} – ${fmt(sunday)}`;

      } else if (activeTimeFrame === "Monthly") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        let weekNum = 1, cursor = new Date(firstDay);
        while (cursor <= lastDay) {
          const wStart = new Date(cursor);
          const wEnd   = new Date(cursor); wEnd.setDate(wEnd.getDate() + 6);
          if (wEnd > lastDay) wEnd.setTime(lastDay.getTime());
          series.push({ label: `Week ${weekNum}`, ...countByWindow(windowSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= wStart && d <= wEnd; })) });
          cursor.setDate(cursor.getDate() + 7); weekNum++;
        }
        rangeLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      } else if (activeTimeFrame === "Yearly") {
        const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        for (let m = 0; m < 12; m++) {
          series.push({ label: MONTHS[m], ...countByWindow(windowSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d.getMonth() === m; })) });
        }
        rangeLabel = String(now.getFullYear());

      } else {
        // Overall — all records, no window filter
        series = [{ label: "Overall", ...countByWindow(windowSched) }];
        rangeLabel = "All Time";
      }

      // ── Stat cards — sum directly from series so boxes always match the chart ──
      const totals = series.reduce(
        (acc, pt) => ({
          confirmed: acc.confirmed + (pt.confirmed ?? 0),
          cancelled: acc.cancelled + (pt.cancelled ?? 0),
          scheduled: acc.scheduled + (pt.scheduled ?? 0),
        }),
        { confirmed: 0, cancelled: 0, scheduled: 0 }
      );
      setStats(totals);

      setChartData(series);
      setChartDate(rangeLabel);

      // Recent schedules — Scheduled first, then by date ascending (matches schedule page)
      const STATUS_PRIORITY = { Scheduled: 0, Confirmed: 1, Cancelled: 2, Done: 3 };
      const sorted = [...allSched].sort((a, b) => {
        const pa = STATUS_PRIORITY[a.scheduleStatus] ?? 99;
        const pb = STATUS_PRIORITY[b.scheduleStatus] ?? 99;
        if (pa !== pb) return pa - pb;
        const da = parseDT(a.startDateTime), db = parseDT(b.startDateTime);
        return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
      });
      setRecentSchedules(sorted.slice(0, 5));

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
      const res  = await axios.get("/api/departmentsDropdown", { headers: getAuthHeader() });
      const data = res.data;
      setDepartments(Array.isArray(data) ? data : data?.content ?? []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }

  function formatDate(raw) {
    const d = parseDT(raw);
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  }

  function formatTimeRange(startRaw, endRaw) {
    const s = parseDT(startRaw), e = parseDT(endRaw);
    if (!s) return "—";
    const fmt = (dt) => dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${fmt(s)}${e ? ` - ${fmt(e)}` : ""}`;
  }

  // Helper to parse LocalDateTime for use in JSX (above)
  function parseDT(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) {
      const [y, mo, d, h = 0, mi = 0] = raw;
      return new Date(y, mo - 1, d, h, mi);
    }
    const str = String(raw).replace(" ", "T").split(".")[0];
    const dt  = new Date(str);
    return isNaN(dt.getTime()) ? null : dt;
  }

  const statsCards = [
    { icon: UserCheck, label: "Confirmed", value: stats.confirmed, color: "text-green-500"  },
    { icon: UserX,     label: "Cancelled", value: stats.cancelled, color: "text-accent"     },
    { icon: Clock,     label: "Scheduled", value: stats.scheduled, color: "text-yellow-500" },
  ];

  return (
    <AdminLayout
      pageTitle={
        <span className="flex items-center gap-3">
          Admin Dashboard
          <DepartmentDropdown
            value={deptFilter}
            onChange={setDeptFilter}
            departments={departments}
          />
        </span>
      }
      pageSubtitle="Overview And Analysis"
    >
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {statsCards.map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className="text-sm font-semibold text-gray-600">{label}</p>
                </div>
                <p className="text-4xl font-bold text-primary">{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
            <h2 className="text-lg font-bold text-primary mb-4 font-montserrat">
              Status Chart
            </h2>

            <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto overflow-y-hidden">
              {TIME_FRAMES.map((label) => (
                <button
                  key={label}
                  onClick={() => setActiveTimeFrame(label)}
                  className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px whitespace-nowrap cursor-pointer
                    ${activeTimeFrame === label
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4 sm:gap-6 mb-4 flex-wrap">
              {[
                { color: "bg-green-500",  label: "Confirmed" },
                { color: "bg-accent",     label: "Cancelled" },
                { color: "bg-yellow-500", label: "Scheduled" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${color} rounded-sm`} />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>

            {chartDate && (
              <p className="text-center text-sm font-semibold text-primary mb-4">{chartDate}</p>
            )}

            <div className="w-full h-[300px] sm:h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
                    <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" allowDecimals={false} domain={[0, (dataMax) => Math.max(dataMax + 1, 5)]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line type="monotone" dataKey="confirmed" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="cancelled" stroke="#C0392B" strokeWidth={2} dot={{ fill: "#C0392B", r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="scheduled" stroke="#EAB308" strokeWidth={2} dot={{ fill: "#EAB308", r: 4 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Schedules */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-primary font-montserrat">Recent Schedules</h3>
              <Link
                to="/admin/schedules"
                className="text-sm font-semibold text-primary hover:text-primary-light transition-colors"
              >
                See all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary">
                    {["Name", "Date", "Time", "Status"].map((col) => (
                      <th key={col} className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSchedules.length > 0 ? (
                    recentSchedules.map((s, i) => (
                      <tr key={s.scheduleId ?? i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.patientName}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{formatDate(s.startDateTime)}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{formatTimeRange(s.startDateTime, s.endDateTime)}</td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <span className={`text-sm font-semibold ${scheduleStatusColor(s.scheduleStatus)}`}>
                            {s.scheduleStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 sm:px-6 py-8 text-center text-sm text-gray-400">
                        No recent schedules found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}