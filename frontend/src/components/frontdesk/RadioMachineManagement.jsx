import { useState, useEffect } from "react";
import { Cpu, CheckCircle, Wrench } from "lucide-react";
import { LayoutDashboard, Calendar } from "lucide-react";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  StatusBadge,
  ConfirmDialog,
} from "../ui";


const radiologyNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/radiology/dashboard" },
  { label: "Schedules", icon: Calendar,        path: "/radiology/schedules" },
  { label: "Machine",   icon: Cpu,             path: "/radiology/machine"   },
];


function getMachineActions(machine) {
  if (machine.status === "Available") {
    return [{ label: "Under Maintenance", icon: Wrench }];
  }
  return [{ label: "Available", icon: CheckCircle }];
}


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


function mapMachine(m) {
  return {
    id:     m.machineId,
    name:   m.machineName,
    status: m.machineStatus, 
  };
}

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}


export default function RadioMachineManagement() {
  const [machines,      setMachines]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  async function fetchMachines() {
    setLoading(true);
    try {
      
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  }

  async function applyConfirm() {
    const { type, machine } = confirmAction;
    const newStatus = type === "maintenance" ? "Under Maintenance" : "Available";
    try {
     
    } catch (err) {
      console.error(`Failed to update machine status:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  function handleAction(action, machine) {
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", machine });
    if (action === "Available")         return setConfirmAction({ type: "available",   machine });
  }

  const filtered = machines.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const meta = confirmAction && confirmMeta[confirmAction.type];

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
      
      <div className="flex items-center border-b border-gray-200 mb-4">
        <div className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary
          border-b-2 border-primary -mb-px">
          <Cpu size={15} className="shrink-0" />
          All
        </div>
      </div>

      <DataTable
        columns={["Machine Name", "Status", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Cpu}
        emptyText="No machines found"
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