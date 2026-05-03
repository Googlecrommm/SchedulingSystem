import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function formatStatus(status) {
  if (status === "Under_Maintenance") return "Under Maintenance";
  return status ?? "—";
}

const PAGE_SIZE = 10;

const TABS = [
  { label: "All",               icon: Cpu       },
  { label: "Available",         icon: CheckCircle },
  { label: "Under Maintenance", icon: Wrench    },
  { label: "Archived",          icon: Archive   },
];

// Actions driven by machine's current status.
// Archived machines can only be unarchived.
// Available/Under_Maintenance machines can be edited or archived.
function getMachineActions(machine) {
  const s = machine.machineStatus;

  if (s === "Archived") {
    return [{ label: "Unarchive", icon: RefreshCw }];
  }

  return [
    { label: "Edit",    icon: Pencil                },
    { label: "Archive", icon: Archive, danger: true },
  ];
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const createMachineSchema = Yup.object({
  name:       Yup.string().trim().required("Machine name is required").max(100),
  modalityId: Yup.number()
    .typeError("Modality is required")
    .required("Modality is required")
    .min(1, "Modality is required"),
});

const editMachineSchema = Yup.object({
  name: Yup.string().trim().required("Machine name is required").max(100),
});

// ─── CREATE FORM ──────────────────────────────────────────────────────────────
// GET /api/modalityDropdown  → populates the modality <select>
// POST /api/createMachine
//   Body: { machineName, modality: { modalityId } }
//   Admin: any modality allowed.

function CreateMachineForm({ onSubmit, onClose }) {
  const [modalities,      setModalities]      = useState([]);
  const [modalityLoading, setModalityLoading] = useState(true);
  const [modalityError,   setModalityError]   = useState(false);

  useEffect(() => {
    async function loadModalities() {
      try {
        const res = await axios.get("/api/modalityDropdown", { headers: getAuthHeader() });
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
          placeholder="Machine name"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>

      <FormField label="Modality" error={formik.touched.modalityId && formik.errors.modalityId}>
        <select
          className={ic("modalityId")}
          {...formik.getFieldProps("modalityId")}
          disabled={modalityLoading || modalityError}
        >
          <option value="">
            {modalityLoading
              ? "Loading modalities…"
              : modalityError
              ? "Failed to load — try again"
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
        submitLabel="Submit"
        submitting={formik.isSubmitting}
      />
    </form>
  );
}

// ─── EDIT FORM ────────────────────────────────────────────────────────────────
// PUT /api/updateMachine/{machineId}
//   Body: { machineName }
//   MachineService.updateMachine() checks for duplicate name BEFORE applying the
//   change — if the name is unchanged the backend will throw AlreadyExists because
//   existsByMachineName() matches the machine itself. We guard against that here
//   by only submitting if the name actually changed.

function EditMachineForm({ initialName = "", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { name: initialName },
    validationSchema: editMachineSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      // FIX: backend's existsByMachineName() will throw AlreadyExists even when
      // the user submits the same name (it matches itself). Guard client-side.
      if (values.name.trim() === initialName.trim()) {
        setFieldError("name", "No changes detected.");
        setSubmitting(false);
        return;
      }
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
          placeholder="Machine name"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>
      <ModalFooter
        onClear={() => formik.resetForm()}
        submitLabel="Save Changes"
        submitting={formik.isSubmitting}
      />
    </form>
  );
}

// Maps tab label → backend machineStatus enum value (null = omit param)
const TAB_TO_STATUS = {
  "All":               null,
  "Available":         "Available",
  "Under Maintenance": "Under_Maintenance",
  "Archived":          "Archived",
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function MachineManagement() {
  const [activeTab,       setActiveTab]       = useState("All");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreate,      setShowCreate]      = useState(false);
  const [editMachine,     setEditMachine]     = useState(null);
  const [confirmAction,   setConfirmAction]   = useState(null);
  const [machines,        setMachines]        = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [serverResults,   setServerResults]   = useState(null); // null = not searching

  // Debounce search input — fire 400ms after user stops typing
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Reset to page 1 on tab or search change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(1);
    setServerResults(null);
    setError(null);
  }, [activeTab, debouncedSearch]);

  // ── machineStatus param ───────────────────────────────────────────────────
  // "All" tab              → null (omit param) → hasStatus(null) excludes Archived,
  //                          showing Available + Under_Maintenance.
  // "Available" tab        → "Available"
  // "Under Maintenance" tab→ "Under_Maintenance" (backend enum value)
  // "Archived" tab         → "Archived"
  // Searching              → null (searchMachine has no machineStatus param;
  //                          we filter client-side by tab after results arrive).
  const machineStatusParam = useMemo(() => {
    if (debouncedSearch.trim()) return null;
    return TAB_TO_STATUS[activeTab] ?? null;
  }, [activeTab, debouncedSearch]);

  // ─── FETCH MACHINES ───────────────────────────────────────────────────────
  // GET /api/getMachines?machineStatus=&page=&size=&sort=
  // Response: Page<MachineResponseDTO>
  // DTO: { machineId, machineName, machineStatus, modalityName }
  const fetchMachines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page - 1,         // Spring Pageable is 0-indexed; UI uses 1-indexed
        size: PAGE_SIZE,
        sort: "machineName,asc",
        ...(machineStatusParam && { machineStatus: machineStatusParam }),
      };
      const res  = await axios.get("/api/getMachines", { headers: getAuthHeader(), params });
      const data = res.data;
      setMachines(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
      setError("Failed to load machines. Please try again.");
      setMachines([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [machineStatusParam, page]);

  // ─── SEARCH ───────────────────────────────────────────────────────────────
  // GET /api/searchMachine/{machineName}?page=&size=&sort=
  // Response: Page<MachineResponseDTO>
  // Note: searchMachine() has NO machineStatus param — returns all statuses
  // within the department scope. We filter client-side by active tab below.
  const fetchSearch = useCallback(async () => {
    const trimmed = debouncedSearch.trim();
    if (!trimmed) { setServerResults(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        "/api/searchMachine/" + encodeURIComponent(trimmed),
        {
          headers: getAuthHeader(),
          params: { page: page - 1, size: PAGE_SIZE, sort: "machineName,asc" },
        }
      );
      const data = res.data;
      setServerResults(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Please try again.");
      setServerResults(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  // Single effect — branch on whether we're searching or listing
  useEffect(() => {
    if (debouncedSearch.trim()) {
      fetchSearch();
    } else {
      fetchMachines();
    }
  }, [debouncedSearch, fetchMachines, fetchSearch]);

  // When searching, filter client-side by tab since searchMachine returns all statuses.
  // When not searching, backend already scopes by machineStatus via Specification.
  const displayed = serverResults !== null
    ? serverResults.filter((m) => {
        const status = TAB_TO_STATUS[activeTab];
        if (status === null && activeTab === "All") return m.machineStatus !== "Archived";
        if (status === null) return true;
        return m.machineStatus === status;
      })
    : machines;

  // ─── ACTION HANDLER ───────────────────────────────────────────────────────

  function handleAction(action, machine) {
    if (action === "Edit")      return setEditMachine(machine);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   machine });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", machine });
  }

  // ─── STATUS MUTATIONS ─────────────────────────────────────────────────────
  // PUT /api/archiveMachine/{machineId}
  // PUT /api/activateMachine/{machineId}  — covers "Unarchive"
  async function applyConfirm() {
    const { type, machine } = confirmAction;
    const endpointMap = {
      archive:   `/api/archiveMachine/${machine.machineId}`,
      unarchive: `/api/activateMachine/${machine.machineId}`,
    };
    try {
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      // Refresh the current view after the status change
      if (debouncedSearch.trim()) {
        await fetchSearch();
      } else {
        await fetchMachines();
      }
    } catch (err) {
      console.error("Failed to apply action (" + type + "):", err);
      setError("Failed to update machine. Please try again.");
    } finally {
      setConfirmAction(null);
    }
  }

  // FIX: confirmMeta was evaluated unconditionally even when confirmAction is null,
  // causing a crash on `confirmAction.type`. Guard with early null-check.
  const machineName  = confirmAction?.machine?.machineName ?? "";
  const confirmMetaMap = {
    archive: {
      title: "Archive Machine?",
      msg:   `"${machineName}" will be archived.`,
      label: "Archive",
      danger: true,
    },
    unarchive: {
      title: "Unarchive Machine?",
      msg:   `"${machineName}" will be restored to active.`,
      label: "Unarchive",
      danger: false,
    },
  };
  // FIX: only look up the meta when confirmAction exists — prevents crash on null
  const confirmMeta = confirmAction ? confirmMetaMap[confirmAction.type] : null;

  // ─── RENDER ───────────────────────────────────────────────────────────────

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
          setDebouncedSearch("");  // FIX: clear debounced value too, not just raw input
          setServerResults(null);
          setPage(1);
        }}
        addLabel="Add Machine"
        onAdd={() => setShowCreate(true)}
      />

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={["Machine Name", "Modality", "Status", "Action"]}
        rows={displayed}
        loading={loading}
        emptyIcon={Cpu}
        emptyText={activeTab === "All" ? "No machines found" : `No ${activeTab.toLowerCase()} machines`}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
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

      {/* ── CREATE MODAL ──────────────────────────────────────────────────── */}
      {/* POST /api/createMachine
          Body: { machineName, modality: { modalityId } }
          Admin: any modality allowed. */}
      {showCreate && (
        <Modal title="Add Machine" onClose={() => setShowCreate(false)}>
          <CreateMachineForm
            onSubmit={async (values) => {
              await axios.post(
                "/api/createMachine",
                {
                  machineName: values.name.trim(),
                  modality: { modalityId: Number(values.modalityId) },
                },
                { headers: getAuthHeader() }
              );
              setPage(1);
              setShowCreate(false);
              await fetchMachines();
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      {/* PUT /api/updateMachine/{machineId}
          Body: { machineName }
          Note: MachineService.updateMachine() checks for duplicates BEFORE applying
          the name change — submitting the same name throws AlreadyExists.
          EditMachineForm guards against this client-side. */}
      {editMachine && (
        <Modal title="Edit Machine" onClose={() => setEditMachine(null)}>
          <EditMachineForm
            initialName={editMachine.machineName}
            onSubmit={async (values) => {
              await axios.put(
                "/api/updateMachine/" + editMachine.machineId,
                { machineName: values.name.trim() },
                { headers: getAuthHeader() }
              );
              setEditMachine(null);
              // FIX: refresh whichever view is currently active
              if (debouncedSearch.trim()) {
                await fetchSearch();
              } else {
                await fetchMachines();
              }
            }}
            onClose={() => setEditMachine(null)}
          />
        </Modal>
      )}

      {/* ── CONFIRM DIALOG ────────────────────────────────────────────────── */}
      {confirmAction && confirmMeta && (
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