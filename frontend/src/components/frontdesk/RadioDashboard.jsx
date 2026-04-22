import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck, UserX, Clock, AlertCircle, ChevronDown, LayoutDashboard, Calendar, Cpu,Cross,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

import {
  AdminLayout,
  scheduleStatusColor,
} from "../ui";


const radiologyNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/radiology/dashboard" },
  { label: "Schedules", icon: Calendar,        path: "/radiology/schedules" },
  { label: "Machine",   icon: Cpu,             path: "/radiology/machine"   },
  { label: "Medical Professionals", icon: Cross,         path: "/radiology/professionals" },
];

const TIME_FRAMES = ["Daily", "Weekly", "Monthly", "Yearly", "Overall"];


function ModalityDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = value === "all" ? "All Modality" : value;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-card border border-gray-100 py-1 z-50">
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors
              ${value === "all" ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Modality
          </button>
          {options.map((m) => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${value === m ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
            >
              {m}
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


export default function RadiologyDashboard() {
  const [activeTimeFrame, setActiveTimeFrame] = useState("Daily");
  const [modalityFilter,  setModalityFilter]  = useState("all");
  const [modalities,      setModalities]      = useState([]);
  const [stats,           setStats]           = useState({ confirmed: 0, cancelled: 0, pending: 0 });
  const [chartData,       setChartData]       = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [chartDate,       setChartDate]       = useState("");
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  useEffect(() => { fetchDashboardData(); }, [activeTimeFrame, modalityFilter]);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      
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
    { icon: Clock,     label: "Pending",   value: stats.pending,   color: "text-yellow-500" },
  ];

  return (
    <AdminLayout
      navItems={radiologyNavItems}
      pageTitle={
        <span className="flex items-center gap-3">
          Radiology Dashboard
          <ModalityDropdown
            value={modalityFilter}
            onChange={setModalityFilter}
            options={modalities}
          />
        </span>
      }
      pageSubtitle="Overview And Analysis"
      userName="Radiology"
      userRole="Radiology Frontdesk"
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
              Status Chart
            </h2>

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

            <div className="flex items-center justify-end gap-4 sm:gap-6 mb-4 flex-wrap">
              {[
                { color: "bg-green-500", label: "Accepted"  },
                { color: "bg-accent",    label: "Cancelled" },
                { color: "bg-yellow-500",label: "Pending"   },
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
                    <YAxis                 tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line type="monotone" dataKey="confirmed" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="cancelled" stroke="#C0392B" strokeWidth={2} dot={{ fill: "#C0392B", r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="pending"   stroke="#EAB308" strokeWidth={2} dot={{ fill: "#EAB308", r: 4 }} activeDot={{ r: 6 }} />
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
                to="/radiology/schedules"
                className="text-sm font-semibold text-primary hover:text-primary-light transition-colors"
              >
                See all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary">
                    {["Name", "Start Date Time", "End Date Time", "Status"].map((col) => (
                      <th key={col} className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSchedules.length > 0 ? (
                    recentSchedules.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.name}</td>
                        
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{formatDateTime(s.start_date)}</td>
                   
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{formatDateTime(s.end_date)}</td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <span className={`text-sm font-semibold ${scheduleStatusColor(s.status)}`}>
                            {s.status}
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