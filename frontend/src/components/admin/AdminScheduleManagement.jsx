import { useState, useEffect, useRef } from "react";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive,
  CheckCircle, Eye, RefreshCw, ChevronDown,
} from "lucide-react";

import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  Modal,
  ModalFooter,
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
  { label: "Scheduled",   icon: Clock         },
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


function ReadonlyField({ label, value, fullWidth = false }) {
  const ro = readonlyInputClass;
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
      <input readOnly value={value ?? "—"} className={ro} />
    </div>
  );
}

function ViewScheduleModal({ schedule, onClose }) {
  const startDT = schedule.startDateTime ? new Date(schedule.startDateTime.replace(" ", "T")) : null;
  const endDT   = schedule.endDateTime   ? new Date(schedule.endDateTime.replace(" ", "T"))   : null;

  const dateValue = startDT
    ? startDT.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : "—";

  const timeValue = startDT && endDT
    ? `${startDT.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} – ${endDT.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "—";

  const dept       = schedule.departmentName?.toLowerCase() ?? "";
  const isRadio    = dept.includes("radiol");
  const isRehab    = dept.includes("rehab");

  return (
    <Modal title="View Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

        {/* ── Patient Info ─────────────────────────────────── */}
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Patient Information</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Patient Name"   value={schedule.patientName} />
          <ReadonlyField label="Sex"            value={schedule.sex} />
          <ReadonlyField label="Date of Birth"  value={schedule.birthDate} />
          <ReadonlyField label="Contact No."    value={schedule.contactNumber} />
        </div>

        <ReadonlyField label="Address" value={schedule.address} />

        {/* ── Schedule Info ─────────────────────────────────── */}
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-1">Schedule Information</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Department"  value={schedule.departmentName} />
          <ReadonlyField label="Status"      value={schedule.scheduleStatus} />
          <ReadonlyField label="Date"        value={dateValue} />
          <ReadonlyField label="Time"        value={timeValue} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadonlyField label="Doctor / Specialist" value={schedule.name} />
          <ReadonlyField label="Procedure"           value={schedule.procedureName} />
        </div>

        {/* Radiology-only */}
        {isRadio && (
          <ReadonlyField label="Machine" value={schedule.machineName} />
        )}

        {/* Rehab-only */}
        {isRehab && (
          <ReadonlyField label="Room" value={schedule.roomName} />
        )}

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


function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}


export default function AdminScheduleManagement() {
  const [activeTab,        setActiveTab]        = useState("All");
  const [searchQuery,      setSearchQuery]       = useState("");
  const [deptFilter,       setDeptFilter]        = useState("all");
  const [schedules,        setSchedules]         = useState([]);
  const [departments,      setDepartments]       = useState([]);
  const [loading,          setLoading]           = useState(false);
  const [viewSchedule,     setViewSchedule]      = useState(null);
  const [confirmAction,    setConfirmAction]     = useState(null);

  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page and search when tab or dept filter changes
  useEffect(() => {
    setPage(0);
    setSearchQuery("");
  }, [activeTab, deptFilter]);

  // Load departments once on mount; fetchSchedules runs after departments state is set
  useEffect(() => { fetchDepartments(); }, []);

  // Re-fetch whenever any filter or page changes (departments included so filter resolves correctly)
  useEffect(() => {
    fetchSchedules();
  }, [activeTab, searchQuery, deptFilter, page, departments]);

  async function fetchSchedules() {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const deptName = deptFilter !== "all"
        ? departments.find((d) => String(d.departmentId) === String(deptFilter))?.departmentName
        : undefined;
      const patientName = searchQuery.trim() || undefined;

      if (activeTab === "All") {
        // Backend defaults to Scheduled when scheduleStatus is null, so we must
        // fetch each status individually and merge for the "All" tab.
        const ALL_STATUSES = ["Scheduled", "Confirmed", "Cancelled", "Done"];
        const results = await Promise.all(
          ALL_STATUSES.map((status) =>
            axios.get("/api/getSchedules", {
              headers,
              params: {
                scheduleStatus: status,
                page: 0,
                size: 2000,
                ...(deptName    && { departmentName: deptName }),
                ...(patientName && { patientName }),
              },
            })
          )
        );

        // Merge, sort by startDateTime ascending, then paginate client-side
        const merged = results.flatMap((res) => res.data?.content ?? []);
        const STATUS_PRIORITY = { Scheduled: 0, Confirmed: 1, Cancelled: 2, Done: 3 };
        merged.sort((a, b) => {
          const pa = STATUS_PRIORITY[a.scheduleStatus] ?? 99;
          const pb = STATUS_PRIORITY[b.scheduleStatus] ?? 99;
          if (pa !== pb) return pa - pb;
          const da = a.startDateTime ? new Date(String(a.startDateTime).replace(" ", "T")) : 0;
          const db = b.startDateTime ? new Date(String(b.startDateTime).replace(" ", "T")) : 0;
          return da - db;
        });

        const PAGE_SIZE   = 10;
        const totalItems  = merged.length;
        const totalPgs    = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
        const safePage    = Math.min(page, totalPgs - 1);
        const pageSlice   = merged.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

        setSchedules(pageSlice);
        setTotalPages(totalPgs);
      } else {
        // Specific status tab — let the server filter directly
        const res = await axios.get("/api/getSchedules", {
          headers,
          params: {
            scheduleStatus: activeTab,
            page,
            size: 10,
            ...(deptName    && { departmentName: deptName }),
            ...(patientName && { patientName }),
          },
        });
        setSchedules(res.data?.content ?? []);
        setTotalPages(res.data?.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
      // GET /api/departmentsDropdown → List<DepartmentResponseDTO> (departmentId, departmentName)
      const res = await axios.get("/api/departmentsDropdown", { headers: getAuthHeader() });
      setDepartments(Array.isArray(res.data) ? res.data : res.data?.content ?? []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }


  // Server handles all filtering — schedules is already the correct page
  const filtered = schedules;


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
      await fetchSchedules();
    } catch (err) {
      console.error(`Failed to ${type} schedule:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];


  const deptLabel =
    deptFilter === "all"
      ? "All Departments"
      : departments.find((d) => String(d.departmentId) === String(deptFilter))?.departmentName ?? "All Departments";

  return (
    <AdminLayout
      pageTitle={
        <span className="flex items-center gap-3">
          Schedule Management
          <DepartmentDropdown
            value={deptFilter}
            onChange={setDeptFilter}
            departments={departments}
          />
        </span>
      }
      pageSubtitle={deptLabel}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Patient"
    >

      <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto overflow-y-hidden">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2
              transition-colors duration-200 -mb-px whitespace-nowrap cursor-pointer
              ${activeTab === label
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"}`}
          >
            <Icon size={14} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={filtered}
        loading={loading}
        emptyIcon={Calendar}
        emptyText="No schedules found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(s) => (
          <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.patientName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime ? new Date(s.startDateTime.replace(" ", "T")).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime && s.endDateTime
                ? `${new Date(s.startDateTime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${new Date(s.endDateTime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.departmentName ?? "—"}</td>
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.scheduleStatus)}`}>
              {s.scheduleStatus ? s.scheduleStatus.charAt(0).toUpperCase() + s.scheduleStatus.slice(1) : "—"}
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


      {viewSchedule && (
        <ViewScheduleModal
          schedule={viewSchedule}
          onClose={() => setViewSchedule(null)}
        />
      )}

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.schedule.patientName ?? "This schedule")}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}