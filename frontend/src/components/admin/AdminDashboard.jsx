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
  const [stats,           setStats]           = useState({ confirmed: 0, cancelled: 0, pending: 0 });
  const [chartData,       setChartData]       = useState([]);
  const [chartDate,       setChartDate]       = useState("");
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => { fetchDashboardData(); }, [activeTimeFrame, deptFilter]);
  useEffect(() => { fetchDepartments();   }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
     
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
   
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }

  const statsCards = [
    { icon: UserCheck, label: "Confirmed", value: stats.confirmed, color: "text-green-500"  },
    { icon: UserX,     label: "Cancelled", value: stats.cancelled, color: "text-accent"     },
    { icon: Clock,     label: "Pending",   value: stats.pending,   color: "text-yellow-500" },
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
                { color: "bg-yellow-500", label: "Pending"   },
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
                      <tr key={s.id ?? i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.name}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.date}</td>
                        <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{s.time}</td>
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
