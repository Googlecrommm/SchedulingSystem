import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Bell,
  ChevronDown,
  Menu,
  X,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import DGMCIcon from "../../assets/DGMC-icon.svg";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/frontdesk/rehab-dashboard" },
  { label: "Schedules", icon: Calendar, path: "/frontdesk/schedules" },
];

const timeFrameTabs = ["Daily", "Weekly", "Monthly", "Yearly", "Overall"];

const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed": return "text-green-500";
    case "cancelled": return "text-accent";
    case "pending":   return "text-yellow-500";
    default:          return "text-gray-500";
  }
};

export default function RehabilitationDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeTimeFrame, setActiveTimeFrame] = useState("Daily");
  const userDropdownRef = useRef(null);

  const [stats, setStats] = useState({ confirmed: 0, cancelled: 0, pending: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartDate, setChartDate] = useState("");

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTimeFrame]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResponse, chartResponse, schedulesResponse] = await Promise.all([
        axios.get("/api/rehabilitation/stats", {
          params: { timeFrame: activeTimeFrame.toLowerCase() },
        }),
        axios.get("/api/rehabilitation/chart-data", {
          params: { timeFrame: activeTimeFrame.toLowerCase() },
        }),
        axios.get("/api/rehabilitation/recent-schedules", {
          params: { limit: 3 },
        }),
      ]);

      setStats({
        confirmed: statsResponse.data.confirmed || 0,
        cancelled: statsResponse.data.cancelled || 0,
        pending: statsResponse.data.pending || 0,
      });

      setChartData(chartResponse.data.data || []);
      setChartDate(chartResponse.data.date || new Date().toLocaleDateString());
      setRecentSchedules(schedulesResponse.data.schedules || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      icon: UserCheck,
      label: "Confirmed",
      value: stats.confirmed,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: UserX,
      label: "Cancelled",
      value: stats.cancelled,
      color: "text-accent",
      bgColor: "bg-red-50",
    },
    {
      icon: Clock,
      label: "Pending",
      value: stats.pending,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
  ];

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-card h-32">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6 h-[500px]">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-full bg-gray-100 rounded"></div>
      </div>
    </div>
  );

  const ErrorMessage = ({ message, onRetry }) => (
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

  return (
    <div className="flex h-screen bg-surface-bg overflow-hidden font-body">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-30 w-64 bg-bading border-r border-gray-100 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:w-72 lg:shrink-0`}
      >
        <div className="px-5 h-[73px] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={DGMCIcon} alt="DGMC Logo" className="w-9 h-9 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary font-montserrat leading-tight truncate">
                Divine Grace Medical Center
              </p>
              <p className="text-xs font-semibold text-accent font-montserrat leading-tight">
                Scheduling System
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 px-2">
            General
          </p>
          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, path }) => {
              const isActive = location.pathname === path;
              return (
                <li key={label}>
                  <Link
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                      ${isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-primary"
                      }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-[73px] flex items-center justify-between gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Menu size={18} className="text-gray-500" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <Bell size={18} className="text-gray-500" />
            </button>

            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-primary leading-tight">Rehab</p>
                  <p className="text-xs text-gray-400 leading-tight">Rehabilitation Frontdesk</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-100 z-50 py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer">
                    Profile
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-red-50 transition-colors cursor-pointer">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-montserrat">
              Rehabilitation Dashboard
            </h1>
            <p className="text-sm font-semibold text-accent font-montserrat mt-0.5">
              Overview & Analytics
            </p>
          </div>

          {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {statsCards.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                        </div>
                        <p className="text-4xl font-bold text-primary">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
                <h2 className="text-lg font-bold text-primary mb-4 font-montserrat">
                  Rehabilitation Dashboard
                </h2>

                <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-y-hidden">
                  {timeFrameTabs.map((label) => (
                    <button
                      key={label}
                      onClick={() => setActiveTimeFrame(label)}
                      className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px whitespace-nowrap
                        ${activeTimeFrame === label
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-4 sm:gap-6 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-sm" />
                    <span className="text-sm text-gray-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent rounded-sm" />
                    <span className="text-sm text-gray-600">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                </div>

                <p className="text-center text-sm font-semibold text-primary mb-4">{chartDate}</p>

                <div className="w-full h-[300px] sm:h-[350px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
                        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#D1D5DB" />
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
                        <Line type="monotone" dataKey="pending" stroke="#EAB308" strokeWidth={2} dot={{ fill: "#EAB308", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-primary font-montserrat">Recent Schedules</h3>
                  <Link
                    to="/frontdesk/schedules"
                    className="text-sm font-semibold text-primary hover:text-primary-light transition-colors"
                  >
                    See all
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary">
                        <th className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide">Name</th>
                        <th className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide">Time</th>
                        <th className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSchedules.length > 0 ? (
                        recentSchedules.map((schedule) => (
                          <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{schedule.name}</td>
                            <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">{schedule.time}</td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className={`text-sm font-semibold ${statusColor(schedule.status)}`}>
                                {schedule.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 sm:px-6 py-8 text-center text-sm text-gray-400">
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
        </main>
      </div>
    </div>
  );
}