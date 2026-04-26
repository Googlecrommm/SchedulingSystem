import { useState, useEffect, useCallback } from "react";
import {
  Cpu, CheckCircle, Wrench,
  LayoutDashboard, Calendar, Cross,
} from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  StatusBadge,
  ConfirmDialog,
} from "../ui";

// ── Constants ─────────────────────────────────────────────────────────────────

const radiologyNavItems = [
  { label: "Dashboard",            icon: LayoutDashboard, path: "/radiology/dashboard"     },
  { label: "Schedules",            icon: Calendar,        path: "/radiology/schedules"      },
  { label: "Machine",              icon: Cpu,             path: "/radiology/machine"        },
  { label: "Medical Professionals",icon: Cross,           path: "/radiology/professionals"  },
];

const COLUMNS = ["Machine Name", "Status", "Action"];

const confirmMeta = {
  maintenance: {
    title: "Set Under Maintenance?",
    msg:   (n) => `"${n}" will be marked as under maintenance.`,
    label: "Confirm",
    danger: false,
  },
  available: {
    title: "Mark as Available?",
    msg:   (n) => `"${n}" will be marked as available.`,
    label: "Confirm",
    danger: false,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function getMachineActions(machine) {
  if (machine.status === "Available")         return [{ label: "Under Maintenance", icon: Wrench       }];
  if (machine.status === "Under Maintenance") return [{ label: "Available",         icon: CheckCircle  }];
  return [];
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RadioMachineManagement() {
  const [machines,      setMachines]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  // FIX: Debounced search — fires server-side request after user stops typing,
  // instead of filtering a size:1000 local array on every keystroke.
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Reset to page 0 when search changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchMachines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // FIX: Proper server-side pagination instead of size:1000.
  // The backend filters out Archived machines via machineStatus param.
  // Search is passed as machineName query param (adjust name to match your API).
  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const machineName = debouncedSearch.trim() || undefined;
      const res = await axios.get("/api/getMachines", {
        headers: getAuthHeader(),
        params: {
          page,
          size: 10,
          ...(machineName && { machineName }),
        },
      });

      // Exclude archived machines — frontdesk only sees Active / Under Maintenance.
      // If your backend already filters these out via a param, remove this filter.
      const content = (res.data?.content ?? []).filter(
        (m) => m.machineStatus !== "Archived"
      );

      setMachines(content.map((m) => ({
        id:     m.machineId,
        name:   m.machineName,
        // Normalize enum values with underscores to display strings
        status: m.machineStatus === "Under_Maintenance" ? "Under Maintenance" : m.machineStatus,
      })));
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // FIX: applyConfirm now only closes the dialog on success.
  // Previously setConfirmAction(null) was in `finally`, so the dialog always
  // closed even when the request failed — giving the user no feedback.
  async function applyConfirm() {
    const { type, machine } = confirmAction;
    try {
      const endpointMap = {
        maintenance: `/api/markAsMaintenance/${machine.id}`,
        available:   `/api/activateMachine/${machine.id}`,
      };
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      await fetchMachines();
      setConfirmAction(null); // only close on success
    } catch (err) {
      console.error("Failed to update machine status:", err);
      // Dialog stays open — user can retry or cancel manually
    }
  }

  function handleAction(action, machine) {
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", machine });
    if (action === "Available")         return setConfirmAction({ type: "available",   machine });
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      navItems={radiologyNavItems}
      pageTitle="Machine Management"
      pageSubtitle="Radiology Machines"
      userName="Radiology"
      userRole="Radiology Frontdesk"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Machines"
    >

      {/* Tab bar — single static tab, kept for layout consistency */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        <div className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary
          border-b-2 border-primary -mb-px">
          <Cpu size={15} className="shrink-0" />
          All
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={machines}
        loading={loading}
        emptyIcon={Cpu}
        emptyText="No machines found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(machine) => (
          <tr key={machine.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{machine.name}</td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={machine.status} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getMachineActions(machine)}
                onAction={(action) => handleAction(action, machine)}
              />
            </td>
          </tr>
        )}
      />

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.machine.name)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}