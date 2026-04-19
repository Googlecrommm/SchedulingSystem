import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Cpu, Archive, Pencil, RefreshCw, CheckCircle, Wrench } from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  TabBar,
  DataTable,
  ActionDropdown,
  Modal,
  ModalFooter,
  FormField,
  useInputClass,
  StatusBadge,
  ConfirmDialog,
} from "../ui";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const TABS = [
  { label: "All",      icon: Cpu     },
  { label: "Archived", icon: Archive },
];

function getMachineActions(machine, activeTab) {
  if (activeTab === "Archived") {
    return [
      { label: "Edit",      icon: Pencil    },
      { label: "Unarchive", icon: RefreshCw },
    ];
  }
  const statusAction = machine.machineStatus === "Available"
    ? { label: "Under Maintenance", icon: Wrench      }
    : { label: "Available",         icon: CheckCircle };

  return [
    { label: "Edit",    icon: Pencil  },
    statusAction,
    { label: "Archive", icon: Archive, danger: true },
  ];
}

const machineSchema = Yup.object({
  name: Yup.string().required("Machine name is required"),
});

function MachineForm({ initialName = "", submitLabel = "Submit", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { name: initialName },
    validationSchema: machineSchema,
    onSubmit: (values, { setSubmitting }) => {
      onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Machine Name" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>
      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}

export default function MachineManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editMachine,   setEditMachine]   = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [machines,      setMachines]      = useState([]);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    fetchMachines();
  }, []);

 
  async function fetchMachines() {
    setLoading(true);
    try {
     
      const res = await axios.get("/api/getMachines", {
        headers: getAuthHeader(),
        params: { page: 0, size: 1000 },
      });
      
      setMachines(res.data.content ?? []);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  }

  
  const filtered = machines
    .filter((m) =>
      activeTab === "Archived"
        ? m.machineStatus === "Archived"
        : m.machineStatus !== "Archived"
    )
    .filter((m) =>
      m.machineName.toLowerCase().includes(searchQuery.toLowerCase())
    );

 
  function handleAction(action, machine) {
    if (action === "Edit")              return setEditMachine(machine);
    if (action === "Archive")           return setConfirmAction({ type: "archive",     machine });
    if (action === "Unarchive")         return setConfirmAction({ type: "unarchive",   machine });
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", machine });
    if (action === "Available")         return setConfirmAction({ type: "available",   machine });
  }

  
  async function applyConfirm() {
    const { type, machine } = confirmAction;
    try {
      if (type === "archive") {
        await axios.put(`/api/archiveMachine/${machine.machineId}`, {}, { headers: getAuthHeader() });
      } else if (type === "unarchive") {
        await axios.put(`/api/activateMachine/${machine.machineId}`, {}, { headers: getAuthHeader() });
      } else if (type === "maintenance") {
        await axios.put(`/api/markAsMaintenance/${machine.machineId}`, {}, { headers: getAuthHeader() });
      } else if (type === "available") {
        await axios.put(`/api/activateMachine/${machine.machineId}`, {}, { headers: getAuthHeader() });
      }
      await fetchMachines(); 
    } catch (err) {
      console.error(`Failed to apply action (${type}):`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  const confirmMeta = confirmAction && {
    archive:     { title: "Archive Machine?",       msg: `"${confirmAction.machine.machineName}" will be archived.`,                    label: "Archive",   danger: true  },
    unarchive:   { title: "Unarchive Machine?",     msg: `"${confirmAction.machine.machineName}" will be restored to active.`,          label: "Unarchive", danger: false },
    maintenance: { title: "Set Under Maintenance?", msg: `"${confirmAction.machine.machineName}" will be marked as under maintenance.`, label: "Confirm",   danger: false },
    available:   { title: "Mark as Available?",     msg: `"${confirmAction.machine.machineName}" will be marked as available.`,         label: "Confirm",   danger: false },
  }[confirmAction.type];

  return (
    <AdminLayout
      pageTitle="Machine Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Machines"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Machine"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Machine Name", "Status", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Cpu}
        emptyText={activeTab === "Archived" ? "No archived machines" : "No machines found"}
        renderRow={(machine) => (
          <tr key={machine.machineId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{machine.machineName}</td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={machine.machineStatus} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getMachineActions(machine, activeTab)}
                onAction={(action) => handleAction(action, machine)}
              />
            </td>
          </tr>
        )}
      />

    
      {showCreate && (
        <Modal title="Add Machine" onClose={() => setShowCreate(false)}>
          <MachineForm
            submitLabel="Submit"
            onSubmit={async (values) => {
              try {
           
                await axios.post("/api/createMachine", {
                  machineName: values.name,
                 
                }, { headers: getAuthHeader() });
                await fetchMachines();
              } catch (err) {
                console.error("Failed to create machine:", err);
              }
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

     
      {editMachine && (
        <Modal title="Edit Machine" onClose={() => setEditMachine(null)}>
          <MachineForm
            initialName={editMachine.machineName}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              try {
                await axios.put(`/api/updateMachine/${editMachine.machineId}`, {
                  machineName: values.name,
                }, { headers: getAuthHeader() });
                await fetchMachines();
              } catch (err) {
                console.error("Failed to update machine:", err);
              } finally {
                setEditMachine(null);
              }
            }}
            onClose={() => setEditMachine(null)}
          />
        </Modal>
      )}

      
      {confirmAction && (
        <ConfirmDialog
          title={confirmMeta.title}
          message={confirmMeta.msg}
          confirmLabel={confirmMeta.label}
          danger={confirmMeta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}