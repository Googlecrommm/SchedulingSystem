import { useState, useEffect, useCallback } from "react";
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// Normalizes the raw MachineStatus enum for display.
// The backend stores "Under_Maintenance"; we surface it as "Under Maintenance".
function formatStatus(status) {
  if (status === "Under_Maintenance") return "Under Maintenance";
  return status;
}

const TABS = [
  { label: "All",      icon: Cpu     },
  { label: "Archived", icon: Archive },
];

function getMachineActions(machine) {
  if (machine.machineStatus === "Archived") {
    return [
      { label: "Unarchive", icon: RefreshCw },
    ];
  }

  // The enum value from the backend is "Under_Maintenance";
  // we compare against that but always display "Under Maintenance" as the label.
  const statusAction =
    machine.machineStatus === "Available"
      ? { label: "Under Maintenance", icon: Wrench      }
      : { label: "Available",         icon: CheckCircle };

  return [
    { label: "Edit",    icon: Pencil                },
    statusAction,
    { label: "Archive", icon: Archive, danger: true },
  ];
}

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const createMachineSchema = Yup.object({
  name:       Yup.string().required("Machine name is required"),
  modalityId: Yup.number()
    .typeError("Modality is required")
    .required("Modality is required")
    .min(1, "Modality is required"),
});

const editMachineSchema = Yup.object({
  name: Yup.string().required("Machine name is required"),
});

// ─── CREATE FORM ─────────────────────────────────────────────────────────────
// Fetches modalities from GET /api/modalityDropdown on mount.
// Each modality is expected to have { modalityId, modalityName }.
// Update the endpoint path if yours differs (e.g. /api/getModalityDropdown).

function CreateMachineForm({ submitLabel = "Submit", onSubmit, onClose }) {
  const [modalities,      setModalities]      = useState([]);
  const [modalityLoading, setModalityLoading] = useState(true);
  const [modalityError,   setModalityError]   = useState(false);

  useEffect(() => {
    async function loadModalities() {
      try {
        const res = await axios.get("/api/modalityDropdown", {
          headers: getAuthHeader(),
        });
        setModalities(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch modalities:", err);
        setModalityError(true);
      } finally {
        setModalityLoading(false);
      }
    }
    loadModalities();
  }, []);

  const formik = useFormik({
    initialValues: { name: "", modalityId: "" },
    validationSchema: createMachineSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

      {/* Machine Name */}
      <FormField label="Machine Name" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>

      {/* Modality Dropdown */}
      <FormField
        label="Modality"
        error={formik.touched.modalityId && formik.errors.modalityId}
      >
        <select
          className={ic("modalityId")}
          {...formik.getFieldProps("modalityId")}
          disabled={modalityLoading || modalityError}
        >
          <option value="">
            {modalityLoading
              ? "Loading modalities\u2026"
              : modalityError
              ? "Failed to load \u2014 try again"
              : "Select a modality"}
          </option>
          {modalities.map((m) => (
            <option key={m.modalityId} value={m.modalityId}>
              {m.modalityName}
            </option>
          ))}
        </select>
      </FormField>

      <ModalFooter
        onClear={() => formik.resetForm()}
        submitLabel={submitLabel}
        submitting={formik.isSubmitting}
      />
    </form>
  );
}

// ─── EDIT FORM ───────────────────────────────────────────────────────────────
// Rename only — modality is not changed after a machine is created.

function EditMachineForm({ initialName = "", submitLabel = "Save Changes", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { name: initialName },
    validationSchema: editMachineSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
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
      <ModalFooter
        onClear={() => formik.resetForm()}
        submitLabel={submitLabel}
        submitting={formik.isSubmitting}
      />
    </form>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function MachineManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editMachine,   setEditMachine]   = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [machines,      setMachines]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [serverResults, setServerResults] = useState(null);

  // ─── FETCH MACHINES ────────────────────────────────────────────────────────
  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: 0,
        size: 1000,
        ...(activeTab === "Archived" && { machineStatus: "Archived" }),
      };
      const res = await axios.get("/api/getMachines", {
        headers: getAuthHeader(),
        params,
      });
      setMachines(res.data.content ?? []);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // ─── DEBOUNCED SERVER SEARCH ───────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setServerResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          "/api/searchMachine/" + encodeURIComponent(searchQuery.trim()),
          { headers: getAuthHeader(), params: { page: 0, size: 1000 } }
        );
        setServerResults(res.data.content ?? []);
      } catch (err) {
        console.error("Search failed, using local filter:", err);
        setServerResults(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const filtered = (serverResults ?? machines).filter((m) =>
    activeTab === "Archived"
      ? m.machineStatus === "Archived"
      : m.machineStatus !== "Archived"
  );

  // ─── ACTION HANDLER ────────────────────────────────────────────────────────
  function handleAction(action, machine) {
    if (action === "Edit")              return setEditMachine(machine);
    if (action === "Archive")           return setConfirmAction({ type: "archive",     machine });
    if (action === "Unarchive")         return setConfirmAction({ type: "unarchive",   machine });
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", machine });
    if (action === "Available")         return setConfirmAction({ type: "available",   machine });
  }

  // ─── CONFIRM ACTIONS ───────────────────────────────────────────────────────
  async function applyConfirm() {
    const { type, machine } = confirmAction;
    try {
      if (type === "archive") {
        await axios.put("/api/archiveMachine/" + machine.machineId, {}, { headers: getAuthHeader() });
      } else if (type === "unarchive") {
        await axios.put("/api/activateMachine/" + machine.machineId, {}, { headers: getAuthHeader() });
      } else if (type === "maintenance") {
        await axios.put("/api/markAsMaintenance/" + machine.machineId, {}, { headers: getAuthHeader() });
      } else if (type === "available") {
        await axios.put("/api/activateMachine/" + machine.machineId, {}, { headers: getAuthHeader() });
      }
      await fetchMachines();
    } catch (err) {
      console.error("Failed to apply action (" + type + "):", err);
    } finally {
      setConfirmAction(null);
    }
  }

  const machineName  = confirmAction ? confirmAction.machine.machineName : "";
  const confirmMeta  = confirmAction && {
    archive: {
      title: "Archive Machine?",
      msg:   '"' + machineName + '" will be archived.',
      label: "Archive",
      danger: true,
    },
    unarchive: {
      title: "Unarchive Machine?",
      msg:   '"' + machineName + '" will be restored to active.',
      label: "Unarchive",
      danger: false,
    },
    maintenance: {
      title: "Set Under Maintenance?",
      msg:   '"' + machineName + '" will be marked as under maintenance.',
      label: "Confirm",
      danger: false,
    },
    available: {
      title: "Mark as Available?",
      msg:   '"' + machineName + '" will be marked as available.',
      label: "Confirm",
      danger: false,
    },
  }[confirmAction.type];

  // ─── RENDER ────────────────────────────────────────────────────────────────
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
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
          setServerResults(null);
        }}
        addLabel="Add Machine"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Machine Name", "Modality", "Status", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Cpu}
        emptyText={activeTab === "Archived" ? "No archived machines" : "No machines found"}
        renderRow={(machine) => (
          <tr
            key={machine.machineId}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {machine.machineName}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {machine.modalityName ?? "—"}
            </td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={formatStatus(machine.machineStatus)} />
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

      {/* CREATE MODAL — includes modality dropdown */}
      {showCreate && (
        <Modal title="Add Machine" onClose={() => setShowCreate(false)}>
          <CreateMachineForm
            submitLabel="Submit"
            onSubmit={async (values) => {
              await axios.post(
                "/api/createMachine",
                {
                  machineName: values.name,
                  modality: { modalityId: Number(values.modalityId) },
                },
                { headers: getAuthHeader() }
              );
              await fetchMachines();
              setShowCreate(false);
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* EDIT MODAL — rename only, modality unchanged */}
      {editMachine && (
        <Modal title="Edit Machine" onClose={() => setEditMachine(null)}>
          <EditMachineForm
            initialName={editMachine.machineName}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              await axios.put(
                "/api/updateMachine/" + editMachine.machineId,
                { machineName: values.name },
                { headers: getAuthHeader() }
              );
              await fetchMachines();
              setEditMachine(null);
            }}
            onClose={() => setEditMachine(null)}
          />
        </Modal>
      )}

      {/* CONFIRM DIALOG */}
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