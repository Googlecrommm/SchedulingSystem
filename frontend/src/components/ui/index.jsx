import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, UserCog, Cpu, Calendar,
  Bell, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Search, Plus, MoreHorizontal,
} from "lucide-react";
import DGMCLogo    from "../../assets/dgmc-logo.png";
import DGMCIcon    from "../../assets/DGMC-icon.svg";
import TUVLogo     from "../../assets/tuv-logo.svg";
import TUVSmall    from "../../assets/tuvsmall-logo.svg";

// Nav Configs
export const adminNavItems = [
  { label: "Dashboard",       icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Schedules",       icon: Calendar,        path: "/admin/schedules" },
  { label: "User Management", icon: Users,            path: "/admin/user-management" },
  { label: "Departments",     icon: Building2,        path: "/admin/department-management" },
  { label: "Role",            icon: UserCog,          path: "/admin/role-management" },
  { label: "Machine",         icon: Cpu,              path: "/admin/machine-management" },
];

export const frontdeskNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/frontdesk/rehab-dashboard" },
  { label: "Schedules", icon: Calendar,        path: "/frontdesk/schedules" },
];

// Admin Layout
export function AdminLayout({
  children,
  pageTitle,
  pageSubtitle,          // optional red machine mangement
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  navItems = adminNavItems,
  userName = "Administrator",
  userRole = "Admin",
}) {
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [collapsed,         setCollapsed]         = useState(() => localStorage.getItem("sidebarCollapsed") === "true");
  const [showUserDropdown,  setShowUserDropdown]  = useState(false);
  const userDropdownRef                            = useRef(null);
  const location                                   = useLocation();

  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target))
        setShowUserDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen bg-surface-bg overflow-hidden font-body">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-bading shadow-card flex flex-col
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex lg:z-auto lg:shrink-0
        ${collapsed ? "lg:w-[72px]" : "lg:w-72"}
        w-64
      `}>
        {/* Logo */}
        <div className={`relative flex flex-col items-center justify-center px-4 py-5 overflow-hidden transition-all duration-300 ${collapsed ? "px-2" : "px-6"}`}>
          <img
            src={collapsed ? DGMCIcon : DGMCLogo}
            alt="DGMC Logo"
            className={`object-contain drop-shadow-sm transition-all duration-300 ${collapsed ? "w-10 h-10" : "w-[160px]"}`}
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-3 top-3 p-1 rounded-lg text-gray-400 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          {/* GENERAL label + collapse button */}
          <div className={`flex items-center mb-3 px-1 ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <p className="text-xs font-bold text-primary uppercase tracking-widest px-1">General</p>
            )}
            <button
              onClick={() => setCollapsed((v) => {
                localStorage.setItem("sidebarCollapsed", String(!v));
                return !v;
              })}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl
                         text-gray-500 hover:bg-gray-100 hover:text-primary
                         transition-all duration-200 cursor-pointer shrink-0"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed
                ? <ChevronRight size={18} />
                : <ChevronLeft  size={18} />
              }
            </button>
          </div>

          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, path, badge }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${collapsed ? "justify-center px-2" : ""}
                      ${isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-primary"}
                    `}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <span className="flex-1 whitespace-nowrap overflow-hidden transition-all duration-200">
                        {label}
                      </span>
                    )}
                    {!collapsed && badge && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* TÜV Logo */}
        <div className={`py-4 bg-bading flex items-center justify-center transition-all duration-300 ${collapsed ? "px-2" : "px-5"}`}>
          <img
            src={collapsed ? TUVSmall : TUVLogo}
            alt="TÜV Rheinland Certified ISO 9001:2015"
            className={`object-contain rounded-lg opacity-90 transition-all duration-300 ${collapsed ? "w-10 h-10" : "w-[160px]"}`}
          />
        </div>
      </aside>

      
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-[73px]
          flex items-center justify-between gap-4 sticky top-0 z-10">

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
                onClick={() => setShowUserDropdown((v) => !v)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border
                  border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-primary leading-tight">{userName}</p>
                  <p className="text-xs text-gray-400 leading-tight">{userRole}</p>
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

        {/* Scrollable content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-y-auto">

          {/* Page title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-montserrat">
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p className="text-sm font-semibold text-accent font-montserrat mt-0.5">
                  {pageSubtitle}
                </p>
              )}
            </div>

            {onSearchChange && (
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200
                             bg-white text-sm text-primary placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                             transition-all duration-200"
                />
              </div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

// Tab Bar
export function TabBar({ tabs = [], activeTab, onTabChange, addLabel, onAdd }) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
      {tabs.map(({ label, icon: Icon }) => (
        <button
          key={label}
          onClick={() => onTabChange(label)}
          className={`
            flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2
            transition-colors duration-200 -mb-px whitespace-nowrap
            ${activeTab === label
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"}
          `}
        >
          {Icon && <Icon size={15} />}
          {label}
        </button>
      ))}

      {onAdd && (
        <div className="ml-auto pb-1 shrink-0">
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl
                       bg-primary hover:bg-primary-light active:bg-primary-dark
                       text-white text-sm font-semibold
                       transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{addLabel}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Data Table
export function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyIcon: EmptyIcon,
  emptyText = "No data found",
  renderRow,
  page = 1,
  totalPages = 1,
  onPrev,
  onNext,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="bg-primary">
              {columns.map((col) => (
                <th key={col} className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium">Loading…</p>
                  </div>
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row) => renderRow(row))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    {EmptyIcon && <EmptyIcon size={40} className="text-gray-200" />}
                    <p className="text-sm font-medium">{emptyText}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginator */}
      <div className="bg-primary px-6 py-3.5 flex items-center justify-center gap-4">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-white">Page {page} of {totalPages}</span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// Action Dropdown
export function ActionDropdown({ items = [], onAction }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef          = useRef(null);
  const menuRef         = useRef(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect       = btnRef.current.getBoundingClientRect();
      const menuHeight = items.length * 42 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp     = spaceBelow < menuHeight + 8;
      setPos({
        top:  openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: rect.right - 176,
      });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreHorizontal size={17} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-white rounded-xl shadow-card border border-gray-100 py-1 z-[9999]"
          style={{ top: pos.top, left: pos.left }}
        >
          {items.map(({ label, icon: Icon, danger }) => (
            <button
              key={label}
              onClick={() => { onAction(label); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer whitespace-nowrap
                ${danger
                  ? "text-accent hover:bg-red-50 hover:text-accent-dark"
                  : "text-gray-600 hover:bg-primary/10 hover:text-primary"}`}
            >
              {Icon && <Icon size={15} className={danger ? "text-accent" : "text-gray-400"} />}
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// Modal Shell
export function Modal({ title, onClose, children, maxWidth = "max-w-sm", scrollable = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className={`bg-white rounded-2xl shadow-card w-full ${maxWidth} ${scrollable ? "max-h-[90vh] flex flex-col" : ""}`}>

        <div className={`relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200
          ${scrollable ? "shrink-0 bg-white rounded-t-2xl" : ""}`}>
          <h2 className="text-xl font-bold text-primary font-montserrat">{title}</h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`px-6 py-6 ${scrollable ? "overflow-y-auto" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal Footer
export function ModalFooter({ onClose, onClear, submitLabel = "Submit", submitting = false }) {
  if (onClose && !onClear) {
    return (
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                   text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
      >
        Close
      </button>
    );
  }

  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onClear}
        className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark
                   text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
      >
        Clear
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                   text-white text-sm font-semibold transition-colors duration-200 cursor-pointer
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting…" : submitLabel}
      </button>
    </div>
  );
}

// Form Field
export function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Input Class Hook
export function useInputClass(formik) {
  return (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-surface-input
     text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200
     ${formik.touched[field] && formik.errors[field]
       ? "border-red-400 focus:ring-red-200"
       : "border-surface-border focus:ring-primary/30"}`;
}

// Readonly variant used in View modals
export const readonlyInputClass =
  "w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-input text-primary text-sm cursor-default select-none";

// Status Badge
export function StatusBadge({ status }) {
  const color =
    status === "Enabled"           || status === "Active"    || status === "Available"
      ? "text-green-500"  :
    status === "Disabled"          || status === "Inactive"  || status === "Under Maintenance"
      ? "text-yellow-500" :
    "text-gray-400";

  return <span className={`text-sm font-semibold ${color}`}>{status}</span>;
}

// Schedule Status Color
export function scheduleStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "confirmed": return "text-green-500";
    case "canceled":
    case "cancelled": return "text-accent";
    case "pending":   return "text-yellow-500";
    case "archived":  return "text-gray-400";
    case "done":      return "text-primary";
    default:          return "text-gray-500";
  }
}

// Confirm Dialog
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-sm">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-primary font-montserrat">{title}</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600
                       hover:bg-gray-50 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors cursor-pointer
              ${danger ? "bg-accent hover:bg-accent-dark" : "bg-primary hover:bg-primary-light"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}