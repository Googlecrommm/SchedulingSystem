import { useState, useEffect, useRef } from "react";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive,
  CheckCircle, Eye, RefreshCw, ChevronDown,
} from "lucide-react";

import axios from "../../config/axiosInstance";
import { toast } from "../ui/Toast";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  Modal,
  readonlyInputClass,
  scheduleStatusColor,
  ConfirmDialog,
} from "../ui";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const TABS = [
  { label: "All",       icon: Calendar      },
  { label: "Confirmed", icon: CalendarCheck },
  { label: "Cancelled", icon: CalendarX     },
  { label: "Scheduled", icon: Clock         },
  { label: "Archived",  icon: Archive       },
  { label: "Done",      icon: CheckCircle   },
];

const COLUMNS = ["Name", "Date", "Time", "Department", "Status", "Action"];

function getActions(status) {
  switch (status?.toLowerCase()) {
    case "confirmed": return [{ label: "View", icon: Eye }];
    case "cancelled": return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default:          return [
      { label: "View",    icon: Eye     },
      { label: "Archive", icon: Archive, danger: true },
    ];
  }
}

const confirmMeta = {
  archive:   { title: "Archive Schedule?",   msg: (n) => `"${n}" will be moved to the archive.`, label: "Archive",   danger: true  },
  unarchive: { title: "Unarchive Schedule?", msg: (n) => `"${n}" will be restored to pending.`,  label: "Unarchive", danger: false },
};

// ── Debounce hook ──────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── Department dropdown ────────────────────────────────────────────────────────
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
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
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

// ── Readonly field ─────────────────────────────────────────────────────────────
function ReadonlyField({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
      <input readOnly value={value ?? "—"} className={readonlyInputClass} />
    </div>
  );
}

// ── View modal ─────────────────────────────────────────────────────────────────
function ViewScheduleModal({ schedule, onClose }) {
  const startDT = schedule.startDateTime ? new Date(schedule.startDateTime.replace(" ", "T")) : null;
  const endDT   = schedule.endDateTime   ? new Date(schedule.endDateTime.replace(" ", "T"))   : null;

  const dateValue = startDT
    ? startDT.toLocaleDateString("en-CA", { month: "2-digit", day: "2-digit", year: "numeric" })
    : "—";

  const timeValue = startDT && endDT
    ? `${startDT.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })} – ${endDT.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "—";

  const dept    = schedule.departmentName?.toLowerCase() ?? "";
  const isRadio = dept.includes("radiol");
  const isRehab = dept.includes("rehab");

  return (
    <Modal title="View Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Patient Information</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Patient Name"  value={schedule.patientFullName} />
          <ReadonlyField label="Sex"           value={schedule.sex} />
          <ReadonlyField label="Date of Birth" value={schedule.birthDate
            ? new Date(schedule.birthDate).toLocaleDateString("en-CA", { month: "2-digit", day: "2-digit", year: "numeric" })
            : "—"} />
          <ReadonlyField label="Contact No."   value={schedule.contactNumber} />
        </div>

        <ReadonlyField label="Address" value={schedule.address} />

        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-1">Schedule Information</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Department" value={schedule.departmentName} />
          <ReadonlyField label="Status"     value={schedule.scheduleStatus} />
          <ReadonlyField label="Date"       value={dateValue} />
          <ReadonlyField label="Time"       value={timeValue} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Doctor / Specialist" value={schedule.doctorFullName} />
          <ReadonlyField label="Procedure"           value={schedule.procedureName} />
        </div>

        {isRadio && <ReadonlyField label="Machine" value={schedule.machineName} />}
        {isRehab && <ReadonlyField label="Room"    value={schedule.roomName} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Hospitalization Plan"      value={schedule.hospitalizationPlan} />
          <ReadonlyField label="Hospitalization Case Type" value={schedule.hospitalizationType} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
          <textarea
            readOnly
            rows={3}
            value={schedule.remarks ?? ""}
            placeholder="No remarks"
            className={`${readonlyInputClass} resize-none`}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                     text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
        >
          Close
        </button>

      </div>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminScheduleManagement() {
  // ── All filter state lives in one object ─────────────────────────────────────
  // Adding a new filter = add a key here + one param line in buildParams().
  // No scattered useState, no mismatched dep arrays, no double-fetch race.
  const [filters, setFilters] = useState({
    tab:        "All",   // maps to scheduleStatus param (omitted when "All")
    deptFilter: "all",   // resolved to departmentName string before sending
    search:     "",      // debounced before sending as patientName
  });

  const [schedules,     setSchedules]     = useState([]);
  const [departments,   setDepartments]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [viewSchedule,  setViewSchedule]  = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  const debouncedSearch = useDebounce(filters.search, 400);

  // Convenience setters so call sites stay readable
  const setTab        = (tab)        => setFilters((f) => ({ ...f, tab }));
  const setDeptFilter = (deptFilter) => setFilters((f) => ({ ...f, deptFilter }));
  const setSearch     = (search)     => setFilters((f) => ({ ...f, search }));

  // ── Single effect: reset page then fetch whenever any filter or page changes ─
  // No split effects, no coordination bugs, no lint suppression needed.
  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [filters.tab, filters.deptFilter, debouncedSearch]);

  useEffect(() => {
    fetchSchedules();
  }, [filters.tab, filters.deptFilter, debouncedSearch, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build query params from current filter state ─────────────────────────────
  // To add a new filter: add its key to `filters`, resolve it here, done.
  function buildParams(depts) {
    const deptName = filters.deptFilter !== "all"
      ? depts.find((d) => String(d.departmentId) === String(filters.deptFilter))?.departmentName
      : undefined;
    const patientName = debouncedSearch.trim() || undefined;

    return {
      page,
      size: 10,
      ...(filters.tab !== "All" && { scheduleStatus: filters.tab }),
      ...(deptName    && { departmentName: deptName }),
      ...(patientName && { patientName }),
      // Add new filter params here, e.g: ...(modalityName && { modalityName }),
    };
  }

  // ── Fetch schedules ──────────────────────────────────────────────────────────
  async function fetchSchedules() {
    setLoading(true);
    try {
      const res = await axios.get("/api/getSchedules", {
        headers: getAuthHeader(),
        params:  buildParams(departments),
      });
      setSchedules(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch departments ────────────────────────────────────────────────────────
  async function fetchDepartments() {
    try {
      const res = await axios.get("/api/departmentsDropdown", { headers: getAuthHeader() });
      setDepartments(Array.isArray(res.data) ? res.data : res.data?.content ?? []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  function handleAction(action, schedule) {
    switch (action) {
      case "View":      return setViewSchedule(schedule);
      case "Archive":   return setConfirmAction({ type: "archive",   schedule });
      case "Unarchive": return setConfirmAction({ type: "unarchive", schedule });
    }
  }

  async function applyConfirm() {
    const { type, schedule } = confirmAction;
    try {
      const endpointMap = {
        archive:   `/api/archiveSchedule/${schedule.scheduleId}`,
        unarchive: `/api/restoreSchedule/${schedule.scheduleId}`,
      };
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      toast(
        type === "archive"
          ? `Schedule for "${confirmAction.schedule.patientFullName ?? "patient"}" has been archived.`
          : `Schedule for "${confirmAction.schedule.patientFullName ?? "patient"}" has been restored.`,
        type === "archive" ? "warning" : "success"
      );
      await fetchSchedules();
    } catch (err) {
      console.error(`Failed to ${type} schedule:`, err);
      toast(`Failed to ${type} schedule.`, "error");
    } finally {
      setConfirmAction(null);
    }
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  const deptLabel = filters.deptFilter === "all"
    ? "All Departments"
    : departments.find((d) => String(d.departmentId) === String(filters.deptFilter))?.departmentName ?? "All Departments";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      pageTitle={
        <span className="flex items-center gap-3">
          Schedule Management
          <DepartmentDropdown
            value={filters.deptFilter}
            onChange={setDeptFilter}
            departments={departments}
          />
        </span>
      }
      pageSubtitle={deptLabel}
      searchValue={filters.search}
      onSearchChange={setSearch}
      searchPlaceholder="Search Patient"
    >

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto overflow-y-hidden">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2
              transition-colors duration-200 -mb-px whitespace-nowrap cursor-pointer
              ${filters.tab === label
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"}`}
          >
            <Icon size={14} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={COLUMNS}
        rows={schedules}
        loading={loading}
        emptyIcon={Calendar}
        emptyText="No schedules found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(s) => (
          <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.patientFullName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime
                ? new Date(s.startDateTime.replace(" ", "T")).toLocaleDateString("en-CA", {
                    month: "2-digit", day: "2-digit", year: "numeric",
                  })
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime && s.endDateTime
                ? `${new Date(s.startDateTime.replace(" ", "T")).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })} - ${new Date(s.endDateTime.replace(" ", "T")).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.departmentName ?? "—"}</td>
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.scheduleStatus)}`}>
              {s.scheduleStatus
                ? s.scheduleStatus.charAt(0).toUpperCase() + s.scheduleStatus.slice(1)
                : "—"}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(s.scheduleStatus)}
                onAction={(action) => handleAction(action, s)}
              />
            </td>
          </tr>
        )}
      />

      {/* ── Modals ── */}
      {viewSchedule && (
        <ViewScheduleModal
          schedule={viewSchedule}
          onClose={() => setViewSchedule(null)}
        />
      )}

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.schedule.patientFullName ?? "This schedule")}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

    </AdminLayout>
  );
}