import axios from "../../config/axiosInstance";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck, UserX, Clock, AlertCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

import {
  AdminLayout,
  frontdeskNavItems,
  scheduleStatusColor,
} from "../ui";

const TIME_FRAMES = ["Daily", "Weekly", "Monthly", "Yearly", "Overall"];

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

export default function RehabilitationDashboard() {
  const [activeTimeFrame, setActiveTimeFrame] = useState("Daily");
  const [stats,           setStats]           = useState({ confirmed: 0, cancelled: 0, scheduled: 0 });
  const [chartData,       setChartData]       = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [chartDate,       setChartDate]       = useState("");
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  useEffect(() => { fetchDashboardData(); }, [activeTimeFrame]);

  function getAuthHeader() {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeader();
      const filter  = activeTimeFrame.toLowerCase();

      // Fetch all 4 statuses separately (backend hasStatus() defaults to Scheduled when null)
      const TRACKED = ["Scheduled", "Confirmed", "Cancelled", "Done"];
      const [countsRes, ...statusResults] = await Promise.all([
        axios.get("/api/dashboard/countRehab", { headers, params: { filter } }),
        ...TRACKED.map((status) =>
          axios.get("/api/getRehabSched", {
            headers,
            params: { page: 0, size: 2000, scheduleStatus: status },
          })
        ),
      ]);

      const counts   = countsRes.data;
      const allSched = statusResults.flatMap((res) => res.data?.content ?? []);

      // ── Helpers ────────────────────────────────────────────────────────────
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
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      }

      function isStatus(s, status) {
        return (s.scheduleStatus ?? "").toLowerCase() === status.toLowerCase();
      }

      function countByDate(schedules, dateStr) {
        const day = schedules.filter((s) => toDateStr(s.startDateTime) === dateStr);
        return {
          confirmed: day.filter((s) => isStatus(s, "Confirmed")).length,
          cancelled: day.filter((s) => isStatus(s, "Cancelled")).length,
          scheduled: day.filter((s) => isStatus(s, "Scheduled")).length,
        };
      }

      // ── Filter allSched to the active time window (mirrors chart bucketing) ──
      const now = new Date();
      function getWindowSched() {
        if (activeTimeFrame === "Daily") {
          const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
          const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
          return allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= todayStart && d <= todayEnd; });
        }
        if (activeTimeFrame === "Weekly") {
          const dow = now.getDay();
          const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7)); monday.setHours(0,0,0,0);
          const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23,59,59,999);
          return allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= monday && d <= sunday; });
        }
        if (activeTimeFrame === "Monthly") {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          return allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= firstDay && d <= lastDay; });
        }
        if (activeTimeFrame === "Yearly") {
          const firstDay = new Date(now.getFullYear(), 0, 1);
          const lastDay  = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          return allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= firstDay && d <= lastDay; });
        }
        return allSched; // Overall
      }

      const windowSched = getWindowSched();

      // ── Build chart series ─────────────────────────────────────────────────
      let series     = [];
      let rangeLabel = "";

      if (activeTimeFrame === "Daily") {
        // Today's schedules grouped by hour (6 AM – 10 PM)
        const todayIso = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        const todaySched = allSched.filter((s) => {
          const d = parseDT(s.startDateTime);
          return d && `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` === todayIso;
        });
        for (let h = 6; h <= 22; h++) {
          const hourSched = todaySched.filter((s) => {
            const d = parseDT(s.startDateTime);
            return d && d.getHours() === h;
          });
          const period = h < 12 ? "AM" : "PM";
          const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
          series.push({
            label:     `${h12}${period}`,
            confirmed: hourSched.filter((s) => isStatus(s, "Confirmed")).length,
            cancelled: hourSched.filter((s) => isStatus(s, "Cancelled")).length,
            scheduled: hourSched.filter((s) => isStatus(s, "Scheduled")).length,
          });
        }
        rangeLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

      } else if (activeTimeFrame === "Weekly") {
        const dow    = now.getDay();
        const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7));
        for (let i = 0; i < 7; i++) {
          const d   = new Date(monday); d.setDate(monday.getDate() + i);
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          series.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), ...countByDate(allSched, iso) });
        }
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const fmt    = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        rangeLabel   = `${fmt(monday)} – ${fmt(sunday)}`;

      } else if (activeTimeFrame === "Monthly") {
        const year = now.getFullYear(), month = now.getMonth();
        const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
        let weekNum = 1, cursor = new Date(firstDay);
        while (cursor <= lastDay) {
          const wStart = new Date(cursor), wEnd = new Date(cursor);
          wEnd.setDate(wEnd.getDate() + 6);
          if (wEnd > lastDay) wEnd.setTime(lastDay.getTime());
          const wSched = allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d >= wStart && d <= wEnd; });
          series.push({
            label: `Week ${weekNum}`,
            confirmed: wSched.filter((s) => isStatus(s, "Confirmed")).length,
            cancelled: wSched.filter((s) => isStatus(s, "Cancelled")).length,
            scheduled: wSched.filter((s) => isStatus(s, "Scheduled")).length,
          });
          cursor.setDate(cursor.getDate() + 7); weekNum++;
        }
        rangeLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      } else if (activeTimeFrame === "Yearly") {
        const year   = now.getFullYear();
        const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        for (let m = 0; m < 12; m++) {
          const mSched = allSched.filter((s) => { const d = parseDT(s.startDateTime); return d && d.getFullYear() === year && d.getMonth() === m; });
          series.push({
            label: MONTHS[m],
            confirmed: mSched.filter((s) => isStatus(s, "Confirmed")).length,
            cancelled: mSched.filter((s) => isStatus(s, "Cancelled")).length,
            scheduled: mSched.filter((s) => isStatus(s, "Scheduled")).length,
          });
        }
        rangeLabel = String(now.getFullYear());

      } else {
        series = [{
          label:     "Overall",
          confirmed: allSched.filter((s) => isStatus(s, "Confirmed")).length,
          cancelled: allSched.filter((s) => isStatus(s, "Cancelled")).length,
          scheduled: allSched.filter((s) => isStatus(s, "Scheduled")).length,
        }];
        rangeLabel = "All Time";
      }

      // Stat boxes always match the chart by summing from series
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
      setRecentSchedules(allSched.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

 
  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso.replace(" ", "T")).toLocaleString("en-US", {
      month: "2-digit", day: "2-digit", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  const statsCards = [
    { icon: UserCheck, label: "Confirmed", value: stats.confirmed, color: "text-green-500"  },
    { icon: UserX,     label: "Cancelled", value: stats.cancelled, color: "text-accent"     },
    { icon: Clock,     label: "Scheduled", value: stats.scheduled, color: "text-yellow-500" },
  ];

  return (
    <AdminLayout
      navItems={frontdeskNavItems}
      pageTitle="Rehabilitation Dashboard"
      pageSubtitle="Overview & Analytics"
      userName="Rehab"
      userRole="Rehabilitation Frontdesk"
    >
      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
        
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

      
          <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
            <h2 className="text-lg font-bold text-primary mb-4 font-montserrat">
              Appointment Status Overview
            </h2>

            <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-y-hidden">
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

            <div className="flex items-center justify-end gap-4 sm:gap-6 mb-4 flex-wrap">
              {[
                { color: "bg-primary",    label: "Confirmed" },
                { color: "bg-accent",     label: "Cancelled" },
                { color: "bg-yellow-500", label: "Scheduled"   },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${color} rounded-sm`} />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm font-semibold text-primary mb-4">{chartDate}</p>

            <div className="w-full h-[300px] sm:h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
                    <YAxis                tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line type="monotone" dataKey="confirmed" stroke="#1B2A6B" strokeWidth={2} dot={{ fill: "#1B2A6B", r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="cancelled" stroke="#C0392B" strokeWidth={2} dot={{ fill: "#C0392B", r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="scheduled" stroke="#EAB308" strokeWidth={2} dot={{ fill: "#EAB308", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              )}
            </div>
          </div>

     
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-primary font-montserrat">Recent Schedules</h3>
              <Link
                to="/frontdesk/rehab-schedules"
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
                    recentSchedules.map((s) => (
                      <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.patientName}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">
                          {s.startDateTime ? new Date(s.startDateTime.replace(" ", "T")).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">
                          {s.startDateTime && s.endDateTime
                            ? `${new Date(s.startDateTime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${new Date(s.endDateTime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
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