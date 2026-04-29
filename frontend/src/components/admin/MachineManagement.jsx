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

function formatStatus(status) {
  if (status === "Under_Maintenance") return "Under Maintenance";
  return status;
}

const PAGE_SIZE = 10;

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

      <FormField label="Machine Name" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>

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

  // ─── PAGINATION STATE ──────────────────────────────────────────────────────
  // `page` is 1-based for display; we send (page - 1) to the server (0-based).
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ─── FETCH MACHINES ────────────────────────────────────────────────────────
  const fetchMachines = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage - 1,   // Spring Data is 0-based
        size: PAGE_SIZE,
        ...(activeTab === "Archived" && { machineStatus: "Archived" }),
      };
      const res = await axios.get("/api/getMachines", {
        headers: getAuthHeader(),
        params,
      });
      const data = res.data;
      setMachines(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Reset to page 1 whenever the tab changes
  useEffect(() => {
    setSearchQuery("");
    fetchMachines(1);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── DEBOUNCED SERVER SEARCH ───────────────────────────────────────────────
  // Search uses its own pagination state so it doesn't clobber the main one.
  const [searchPage,       setSearchPage]       = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchResults,    setSearchResults]    = useState(null);

  const runSearch = useCallback(async (query, targetPage = 1) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        "/api/searchMachine/" + encodeURIComponent(query.trim()),
        {
          headers: getAuthHeader(),
          params: { page: targetPage - 1, size: PAGE_SIZE },
        }
      );
      const data = res.data;
      setSearchResults(data.content ?? []);
      setSearchTotalPages(data.totalPages ?? 1);
      setSearchPage(targetPage);
    } catch (err) {
      console.error("Search failed, falling back to local data:", err);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce: fire search 400 ms after the user stops typing; clear on empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchPage(1);
      setSearchTotalPages(1);
      return;
    }
    const timeout = setTimeout(() => runSearch(searchQuery, 1), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, runSearch]);

  // ─── DERIVED DISPLAY VALUES ────────────────────────────────────────────────
  const isSearching   = searchResults !== null;
  const displayRows   = (isSearching ? searchResults : machines).filter((m) =>
    activeTab === "Archived"
      ? m.machineStatus === "Archived"
      : m.machineStatus !== "Archived"
  );
  const displayPage   = isSearching ? searchPage       : page;
  const displayTotal  = isSearching ? searchTotalPages : totalPages;

  function handlePageChange(newPage) {
    if (isSearching) {
      runSearch(searchQuery, newPage);
    } else {
      fetchMachines(newPage);
    }
  }

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
      // After a status change, refresh the current page rather than jumping to 1
      await fetchMachines(page);
    } catch (err) {
      console.error("Failed to apply action (" + type + "):", err);
    } finally {
      setConfirmAction(null);
    }
  }

  const machineName = confirmAction ? confirmAction.machine.machineName : "";
  const confirmMeta = confirmAction && {
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
          setSearchResults(null);
        }}
        addLabel="Add Machine"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Machine Name", "Modality", "Status", "Action"]}
        rows={displayRows}
        loading={loading}
        emptyIcon={Cpu}
        emptyText={activeTab === "Archived" ? "No archived machines" : "No machines found"}
        page={displayPage}
        totalPages={displayTotal}
        onPrev={() => handlePageChange(displayPage - 1)}
        onNext={() => handlePageChange(displayPage + 1)}
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

      {/* CREATE MODAL */}
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
              // New machine goes to page 1 so the user can see it
              await fetchMachines(1);
              setShowCreate(false);
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* EDIT MODAL */}
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
              // Stay on the same page after an edit
              await fetchMachines(page);
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