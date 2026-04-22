
import { useState, useEffect, useRef } from "react";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive,
  CheckCircle, Eye, Pencil, RefreshCw, ChevronDown,
} from "lucide-react";

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
    case "confirmed": return [{ label: "View", icon: Eye }, { label: "Edit", icon: Pencil }];
    case "cancelled": return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default:          return [
      { label: "View",    icon: Eye     },
      { label: "Edit",    icon: Pencil  },
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


function ViewScheduleModal({ schedule, onClose }) {
  const ro = readonlyInputClass;

  const fields = [
    { label: "Patient Name", value: schedule.name },
    { label: "Department",   value: schedule.department },
    { label: "Status",       value: schedule.status },
  ];

  const dateTimeFields = [
    { label: "Date",       value: schedule.start_datetime ? new Date(schedule.start_datetime.replace(" ", "T")).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—" },
    { label: "Time",       value: schedule.start_datetime && schedule.end_datetime
        ? `${new Date(schedule.start_datetime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${new Date(schedule.end_datetime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
        : "—" },
  ];

  return (
    <Modal title="View Schedule" onClose={onClose} maxWidth="max-w-lg" scrollable>
      <div className="space-y-4">

        {fields.map(({ label, value }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
            <input readOnly value={value ?? "—"} className={ro} />
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dateTimeFields.map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value} className={ro} />
            </div>
          ))}
        </div>

        <ModalFooter onClose={onClose} />
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


  useEffect(() => { setSearchQuery(""); }, [activeTab]);

  useEffect(() => {
    fetchSchedules();
  }, [activeTab, deptFilter]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    try {

    } catch (err) {
      console.error("Failed to fetch schedules:", err);
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


  const filtered = schedules.filter((s) => {
    const matchesTab =
      activeTab === "All"
        ? s.status?.toLowerCase() !== "archived"
        : s.status?.toLowerCase() === activeTab.toLowerCase();

    const matchesSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      deptFilter === "all" || String(s.departmentId) === String(deptFilter);

    return matchesTab && matchesSearch && matchesDept;
  });


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
        renderRow={(s) => (
          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.start_datetime ? new Date(s.start_datetime.replace(" ", "T")).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.start_datetime && s.end_datetime
                ? `${new Date(s.start_datetime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${new Date(s.end_datetime.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.department}</td>
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.status)}`}>
              {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : "—"}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(s.status)}
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
          message={meta.msg(confirmAction.schedule.name)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}