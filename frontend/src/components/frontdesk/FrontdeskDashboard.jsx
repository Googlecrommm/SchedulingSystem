import axios from "../../config/axiosInstance";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck, UserX, Clock, AlertCircle, FileDown, ChevronDown,CheckCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AdminLayout, scheduleStatusColor } from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";

const TIME_FRAMES = ["Daily", "Weekly", "Monthly", "Yearly", "Overall"];

const STATUS_LINES = [
  { key: "scheduled", color: "#EAB308", label: "Scheduled" },
  { key: "confirmed", color: "#22C55E", label: "Confirmed" },
  { key: "cancelled", color: "#C0392B", label: "Cancelled" },
  { key: "done",      color: "#3B82F6", label: "Done"      },
];

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

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

function fmtDate(raw) {
  const d = parseDT(raw);
  if (!d) return "—";
  return d.toLocaleDateString("en-CA", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function fmtTime(raw) {
  const d = parseDT(raw);
  if (!d) return "";
  return d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true });
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-card h-32">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6 h-[500px]">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-full bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">Error Loading Dashboard</h3>
          <p className="text-sm text-red-600 mb-3">{message}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalityDropdown({ modalities, selectedModality, onChange }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = selectedModality || "All Modalities";

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
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
              ${!selectedModality ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Modalities
          </button>
          {modalities.map((m) => (
            <button
              key={m.modalityId}
              onClick={() => { onChange(m.modalityName); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${selectedModality === m.modalityName ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
            >
              {m.modalityName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// FIXED: Yearly reads per-status per-month from new backend shape
// { "January": { "Scheduled": N, "Confirmed": N, "Cancelled": N, "Done": N }, ... }
function buildChartSeries(activeTimeFrame, counts, monthlyBreakdown) {
  const now = new Date();

  if (activeTimeFrame === "Yearly") {
    const MONTHS = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    const SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return MONTHS.map((m, i) => ({
      label:     SHORT[i],
      scheduled: monthlyBreakdown[m]?.Scheduled ?? 0,
      confirmed: monthlyBreakdown[m]?.Confirmed ?? 0,
      cancelled: monthlyBreakdown[m]?.Cancelled ?? 0,
      done:      monthlyBreakdown[m]?.Done      ?? 0,
    }));
  }

  if (activeTimeFrame === "Daily") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const isToday = i === 6;
      return {
        label:     d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
        scheduled: isToday ? (counts.Scheduled ?? 0) : 0,
        confirmed: isToday ? (counts.Confirmed ?? 0) : 0,
        cancelled: isToday ? (counts.Cancelled ?? 0) : 0,
        done:      isToday ? (counts.Done      ?? 0) : 0,
      };
    });
  }

  if (activeTimeFrame === "Weekly") {
    const days     = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const todayDow = (now.getDay() + 6) % 7;
    return days.map((label, i) => ({
      label,
      scheduled: i === todayDow ? (counts.Scheduled ?? 0) : 0,
      confirmed: i === todayDow ? (counts.Confirmed ?? 0) : 0,
      cancelled: i === todayDow ? (counts.Cancelled ?? 0) : 0,
      done:      i === todayDow ? (counts.Done      ?? 0) : 0,
    }));
  }

  if (activeTimeFrame === "Monthly") {
    return ["Week 1","Week 2","Week 3","Week 4"].map((label, i) => {
      const currentWeek = Math.floor((now.getDate() - 1) / 7);
      return {
        label,
        scheduled: i === currentWeek ? (counts.Scheduled ?? 0) : 0,
        confirmed: i === currentWeek ? (counts.Confirmed ?? 0) : 0,
        cancelled: i === currentWeek ? (counts.Cancelled ?? 0) : 0,
        done:      i === currentWeek ? (counts.Done      ?? 0) : 0,
      };
    });
  }

  return [{
    label:     "All Time",
    scheduled: counts.Scheduled ?? 0,
    confirmed: counts.Confirmed ?? 0,
    cancelled: counts.Cancelled ?? 0,
    done:      counts.Done      ?? 0,
  }];
}

function buildRangeLabel(activeTimeFrame) {
  const now = new Date();
  switch (activeTimeFrame) {
    case "Daily":
      return now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    case "Weekly": {
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (d) => d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
      return `${fmt(monday)} – ${fmt(sunday)}`;
    }
    case "Monthly":
      return now.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
    case "Yearly":
      return String(now.getFullYear());
    default:
      return "All Time";
  }
}

export default function FrontdeskDashboard() {
  const navItems = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [activeTimeFrame,  setActiveTimeFrame]  = useState("Daily");
  const [selectedModality, setSelectedModality] = useState("");
  const [modalities,       setModalities]       = useState([]);
  const [stats,            setStats]            = useState({ scheduled: 0, confirmed: 0, cancelled: 0, done: 0 });
  const [chartData,        setChartData]        = useState([]);
  const [chartDate,        setChartDate]        = useState("");
  const [recentSchedules,  setRecentSchedules]  = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [pdfLoading,       setPdfLoading]       = useState(false);

  useEffect(() => {
    async function fetchModalities() {
      try {
        const res    = await axios.get("/api/modalityDropdown", { headers: getAuthHeader() });
        const active = (res.data ?? []).filter(
          (m) => (m.modalityStatus ?? "").toLowerCase() === "active"
        );
        setModalities(active);
      } catch (err) {
        console.error("Failed to load modalities:", err);
      }
    }
    fetchModalities();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers       = getAuthHeader();
      const filter        = activeTimeFrame.toLowerCase();
      const modalityParam = selectedModality ? { modalityName: selectedModality } : {};

      // 1. Stat card counts
      const countsRes = await axios.get("/api/dashboard/counts", {
        headers,
        params: { filter, ...modalityParam },
      });
      const counts = countsRes.data ?? {};
      setStats({
        scheduled: counts.Scheduled ?? 0,
        confirmed: counts.Confirmed ?? 0,
        cancelled: counts.Cancelled ?? 0,
        done:      counts.Done      ?? 0,
      });

      // 2. Monthly breakdown — FIXED: single call, backend returns per-status per-month
      // Shape: { "January": { "Scheduled": N, "Confirmed": N, "Cancelled": N, "Done": N }, ... }
      let monthlyBreakdown = {};
      if (activeTimeFrame === "Yearly") {
        const monthlyRes = await axios.get("/api/dashboard/monthly-breakdown", {
          headers,
          params: { ...modalityParam },
        });
        monthlyBreakdown = monthlyRes.data ?? {};
      }

      // 3. Recent schedules
      const recentRes = await axios.get("/api/getSchedules", {
        headers,
        params: { page: 0, size: 10, ...modalityParam },
      });
      const allRecent = recentRes.data?.content ?? [];
      const sorted = [...allRecent].sort((a, b) => {
        const da = parseDT(a.startDateTime), db = parseDT(b.startDateTime);
        if (!da || !db) return 0;
        return db - da;
      });
      setRecentSchedules(sorted.slice(0, 5));

      // 4. Build chart
      setChartData(buildChartSeries(activeTimeFrame, counts, monthlyBreakdown));
      setChartDate(buildRangeLabel(activeTimeFrame));

    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [activeTimeFrame, selectedModality]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const headers       = getAuthHeader();
      const filter        = activeTimeFrame.toLowerCase();
      const modalityParam = selectedModality ? { modalityName: selectedModality } : {};
      const response = await axios.get("/api/export/pdf", {
        headers,
        params:       { filter, ...modalityParam },
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.download = `${deptName.toLowerCase()}-schedules-${filter}${selectedModality ? `-${selectedModality.toLowerCase().replace(/\s+/g, "-")}` : ""}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  const statsCards = [
    { icon: CheckCircle, label: "Done",      value: stats.done,      color: "text-blue-500"   },
    { icon: UserCheck, label: "Confirmed", value: stats.confirmed, color: "text-green-500"  },
    { icon: UserX,     label: "Cancelled", value: stats.cancelled, color: "text-accent"     },
    { icon: Clock,     label: "Scheduled", value: stats.scheduled, color: "text-yellow-500" },
  ];

  const pageTitleNode = (
    <span className="flex items-center gap-2 flex-wrap">
      {deptName} Dashboard
      {modalities.length > 0 && (
        <ModalityDropdown
          modalities={modalities}
          selectedModality={selectedModality}
          onChange={setSelectedModality}
        />
      )}
    </span>
  );

  return (
    <AdminLayout
      navItems={navItems}
      pageTitle={pageTitleNode}
      pageSubtitle="Overview & Analytics"
      userRole={userRole}
    >
      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {statsCards.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary font-montserrat">Status Chart</h2>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown size={15} />
                {pdfLoading ? "Exporting…" : "Download PDF"}
              </button>
            </div>

            {/* Time-frame tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto overflow-y-hidden">
              {TIME_FRAMES.map((label) => (
                <button
                  key={label}
                  onClick={() => setActiveTimeFrame(label)}
                  className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px whitespace-nowrap
                    ${activeTimeFrame === label
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="text-center text-sm font-semibold text-primary mb-4">{chartDate}</p>

            <div className="w-full h-[300px] sm:h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#D1D5DB"
                      allowDecimals={false}
                      domain={[0, (dataMax) => Math.max(dataMax + 1, 5)]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", paddingBottom: "12px" }}
                      formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    {STATUS_LINES.map(({ key, color }) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
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
              <Link to="/frontdesk/schedules" className="text-sm font-semibold text-primary hover:text-primary-light transition-colors">
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
                    recentSchedules.map((s) => (
                      <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.patientFullName ?? "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{fmtDate(s.startDateTime)}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">
                          {s.startDateTime && s.endDateTime
                            ? `${fmtTime(s.startDateTime)} - ${fmtTime(s.endDateTime)}`
                            : "—"}
                        </td>
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
                        {selectedModality
                          ? `No recent schedules found for ${selectedModality}`
                          : "No recent schedules found"}
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