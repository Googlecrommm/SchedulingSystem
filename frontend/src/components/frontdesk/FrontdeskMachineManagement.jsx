import { useState, useEffect, useCallback } from "react";
import { Cpu, CheckCircle, Wrench } from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  StatusBadge,
  ConfirmDialog,
} from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function formatStatus(status) {
  if (status === "Under_Maintenance") return "Under Maintenance";
  return status;
}

function getMachineActions(machine) {
  if (machine.status === "Available")         return [{ label: "Under Maintenance", icon: Wrench      }];
  if (machine.status === "Under Maintenance") return [{ label: "Available",         icon: CheckCircle }];
  return [];
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const confirmMeta = {
  maintenance: {
    title:  "Set Under Maintenance?",
    msg:    (n) => `"${n}" will be marked as under maintenance.`,
    label:  "Confirm",
    danger: false,
  },
  available: {
    title:  "Mark as Available?",
    msg:    (n) => `"${n}" will be marked as available.`,
    label:  "Confirm",
    danger: false,
  },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FrontdeskMachineManagement() {
  const navItems           = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [machines,      setMachines]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { fetchMachines(); }, [debouncedSearch, page]);

  // Generic endpoint — backend filters by dept from JWT
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

      const content = (res.data?.content ?? []).filter(
        (m) => m.machineStatus !== "Archived"
      );

      setMachines(content.map((m) => ({
        id:     m.machineId,
        name:   m.machineName,
        modality: m.modalityName ?? "—",
        status: formatStatus(m.machineStatus),
      })));
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  async function applyConfirm() {
    const { type, machine } = confirmAction;
    try {
      const endpointMap = {
        maintenance: `/api/markAsMaintenance/${machine.id}`,
        available:   `/api/activateMachine/${machine.id}`,
      };
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      await fetchMachines();
      setConfirmAction(null);
    } catch (err) {
      console.error("Failed to update machine status:", err);
    }
  }

  function handleAction(action, machine) {
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", machine });
    if (action === "Available")         return setConfirmAction({ type: "available",   machine });
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  return (
    <AdminLayout
      navItems={navItems}
      pageTitle="Machine Management"
      pageSubtitle={deptName}
      userRole={userRole}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Machines"
    >
      {/* Static single tab for layout consistency */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        <div className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary
          border-b-2 border-primary -mb-px">
          <Cpu size={15} className="shrink-0" />
          All
        </div>
      </div>

      <DataTable
        columns={["Machine Name", "Modality", "Status", "Action"]}
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
            <td className="px-6 py-4 text-center text-sm text-gray-600">{machine.modality}</td>
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
