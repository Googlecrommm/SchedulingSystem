import { useState, useEffect, useCallback, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { BedDouble, Archive, Pencil, RefreshCw, Wrench, CheckCircle, ChevronDown } from "lucide-react";
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
  ConfirmDialog,
} from "../ui";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All",               icon: BedDouble   },
  { label: "Available",         icon: CheckCircle },
  { label: "Under Maintenance", icon: Wrench      },
  { label: "Archive",           icon: Archive     },
];

// Actions driven by current room status.
// Available / Under_Maintenance → Edit | Archive
// Archived                      → Unarchive
function getAdminActions(status) {
  if (status === "Archived") {
    return [{ label: "Unarchive", icon: RefreshCw, danger: false }];
  }
  return [
    { label: "Edit",    icon: Pencil,  danger: false },
    { label: "Archive", icon: Archive, danger: true  },
  ];
}

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  Available:         "text-green-600",
  Under_Maintenance: "text-yellow-500",
  Archived:          "text-gray-400",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// Maps RoomResponseDTO → flat local object.
// DTO fields: roomId, roomName, roomStatus (MachineStatus enum), departmentName
function mapRoom(r) {
  return {
    id:             r.roomId,
    name:           r.roomName,
    departmentName: r.departmentName ?? "—",
    status:         r.roomStatus,             // "Available" | "Under_Maintenance" | "Archived"
    archived:       r.roomStatus === "Archived",
  };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colorClass = STATUS_STYLES[status] ?? "text-gray-500";
  const label = status === "Under_Maintenance" ? "Under Maintenance" : (status ?? "—");
  return <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>;
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
// roomName: required, mirrors @NotBlank @Size(max=100) on Rooms entity.
// departmentId: required for admin create; frontdesk has it auto-assigned by backend,
//   but we still collect it in the form (backend ignores it for frontdesk).

const roomSchema = Yup.object({
  name:         Yup.string().trim().required("Room name is required").max(100),
  departmentId: Yup.string().required("Department is required"),
});

// ─── ROOM FORM ────────────────────────────────────────────────────────────────

function RoomForm({
  initialName         = "",
  initialDepartmentId = "",
  submitLabel         = "Submit",
  onSubmit,
  onClose,
  departments,
  departmentsLoading  = false,
}) {
  const formik = useFormik({
    initialValues: { name: initialName, departmentId: initialDepartmentId },
    validationSchema: roomSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch {
        // error surface handled by caller
      } finally {
        setSubmitting(false);
      }
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Room Name" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          placeholder="Room name"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>

      <FormField label="Department" error={formik.touched.departmentId && formik.errors.departmentId}>
        <div className="relative">
          <select
            className={`${ic("departmentId")} appearance-none cursor-pointer`}
            {...formik.getFieldProps("departmentId")}
            disabled={departmentsLoading}
          >
            <option value="" disabled>
              {departmentsLoading ? "Loading departments…" : "Select department"}
            </option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </FormField>

      <ModalFooter
        onClear={() => formik.resetForm()}
        submitLabel={submitLabel}
        submitting={formik.isSubmitting}
      />
    </form>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RoomManagement() {
  const [activeTab,          setActiveTab]          = useState("All");
  const [searchQuery,        setSearchQuery]        = useState("");
  const [debouncedSearch,    setDebouncedSearch]    = useState("");
  const [showCreate,         setShowCreate]         = useState(false);
  const [editRoom,           setEditRoom]           = useState(null);
  const [confirmAction,      setConfirmAction]      = useState(null);
  const [rooms,              setRooms]              = useState([]);
  const [departments,        setDepartments]        = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState(null);
  // FIX: use 1-based page state (consistent with PatientManagement/ProfessionalManagement)
  const [page,               setPage]               = useState(1);
  const [totalPages,         setTotalPages]         = useState(1);

  // FIX: debounce search — only update debouncedSearch 400ms after typing stops
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Reset to page 1 on tab or search change
  useEffect(() => {
    setPage(1);
    setError(null);
  }, [activeTab, debouncedSearch]);

  // "All"               → null  (RoomSpecification excludes Archived by default)
  // "Available"         → "Available"
  // "Under Maintenance" → "Under_Maintenance"
  // "Archive"           → "Archived"
  // When searching     → null  (search endpoint has no status param)
  const roomStatusParam = useMemo(() => {
    if (debouncedSearch.trim()) return null;
    if (activeTab === "Archive")           return "Archived";
    if (activeTab === "Available")         return "Available";
    if (activeTab === "Under Maintenance") return "Under_Maintenance";
    return null; // "All"
  }, [activeTab, debouncedSearch]);

  // ─── FETCH DEPARTMENTS ──────────────────────────────────────────────────────
  // GET /api/getDepartments → array or Page of { departmentId, departmentName, departmentStatus }
  useEffect(() => {
    async function fetchDepartments() {
      setDepartmentsLoading(true);
      try {
        const res  = await axios.get("/api/getDepartments", { headers: getAuthHeader() });
        const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
        setDepartments(data.filter((d) => d.departmentStatus === "Active"));
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      } finally {
        setDepartmentsLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  // ─── FETCH ROOMS ────────────────────────────────────────────────────────────
  // GET /api/getRooms?roomStatus=&page=&size=&sort=        (no search)
  // GET /api/searchRoom/{roomName}?page=&size=&sort=       (with search)
  // Response: Page<RoomResponseDTO>
  //   DTO fields: roomId, roomName, roomStatus (MachineStatus), departmentName
  //
  // FIX: converted from plain async function to useCallback so it has a stable
  //   reference and doesn't cause infinite re-render loops in useEffect.
  // FIX: dep array uses stable memoized values, not raw state variables.
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = debouncedSearch.trim();
      const url     = trimmed
        ? `/api/searchRoom/${encodeURIComponent(trimmed)}`
        : `/api/getRooms`;

      const params = {
        page: page - 1,         // Spring Pageable is 0-indexed
        size: PAGE_SIZE,
        sort: "roomName,asc",
        // FIX: only pass roomStatus when a specific status is needed.
        // null → backend RoomSpecification.hasStatus(null) excludes Archived only,
        //   so "All" tab correctly shows Available + Under_Maintenance rooms.
        // "Archived" → "Archive" tab shows only archived rooms.
        ...(roomStatusParam && { roomStatus: roomStatusParam }),
      };

      const res      = await axios.get(url, { headers: getAuthHeader(), params });
      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setRooms(content.map(mapRoom));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setError("Failed to load rooms. Please try again.");
      setRooms([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roomStatusParam, page]);

  // FIX: single useEffect on the stable useCallback ref — no duplicate fetches
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // When searching, apply tab filter client-side (search endpoint has no status param).
  // When not searching, backend already scopes by roomStatus.
  const displayed = debouncedSearch.trim()
    ? rooms.filter((r) => {
        if (activeTab === "Archive")           return r.status === "Archived";
        if (activeTab === "Available")         return r.status === "Available";
        if (activeTab === "Under Maintenance") return r.status === "Under_Maintenance";
        return !r.archived; // "All" — exclude Archived
      })
    : rooms;

  // ─── ACTION HANDLER ──────────────────────────────────────────────────────────

  function handleAction(action, room) {
    if (action === "Edit")      return setEditRoom(room);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   room });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", room });
  }

  // ─── STATUS MUTATIONS ────────────────────────────────────────────────────────
  // PUT /api/archiveRoom/{roomId}
  // PUT /api/restoreRoom/{roomId}
  async function applyConfirm() {
    const { type, room } = confirmAction;
    const endpointMap = {
      archive:   `/api/archiveRoom/${room.id}`,
      unarchive: `/api/restoreRoom/${room.id}`,
    };
    const endpoint = endpointMap[type];
    if (!endpoint) return;

    try {
      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });
      await fetchRooms();
    } catch (err) {
      console.error(`Failed to ${type} room:`, err);
      setError(`Failed to ${type} room. Please try again.`);
    } finally {
      setConfirmAction(null);
    }
  }

  const confirmMeta = confirmAction && {
    archive: {
      title:        "Archive Room?",
      message:      `"${confirmAction.room.name}" will be moved to the archive.`,
      confirmLabel: "Archive",
      danger:       true,
    },
    unarchive: {
      title:        "Unarchive Room?",
      message:      `"${confirmAction.room.name}" will be restored to active.`,
      confirmLabel: "Unarchive",
      danger:       false,
    },
  }[confirmAction.type];

  return (
    <AdminLayout
      pageTitle="Room Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Room"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
        addLabel="Add Room"
        onAdd={() => setShowCreate(true)}
      />

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={["Room", "Department", "Status", "Action"]}
        rows={displayed}
        loading={loading}
        emptyIcon={BedDouble}
        emptyText={
          activeTab === "Archive"           ? "No archived rooms"          :
          activeTab === "Available"         ? "No available rooms"         :
          activeTab === "Under Maintenance" ? "No rooms under maintenance" :
          "No rooms found"
        }
        // FIX: page state is now 1-based — pass directly, no +1 needed
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        renderRow={(room) => (
          <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {room.name}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {room.departmentName}
            </td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={room.status} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getAdminActions(room.status)}
                onAction={(action) => handleAction(action, room)}
              />
            </td>
          </tr>
        )}
      />

      {/* ── CREATE MODAL ────────────────────────────────────────────────────── */}
      {/* POST /api/createRoom
          Body: { roomName, department: { departmentId } }
          Frontdesk: backend ignores department and auto-assigns their own.
          Admin: department is required and used as-is. */}
      {showCreate && (
        <Modal title="Add Room" onClose={() => setShowCreate(false)}>
          <RoomForm
            submitLabel="Submit"
            departments={departments}
            departmentsLoading={departmentsLoading}
            onSubmit={async (values) => {
              await axios.post(
                "/api/createRoom",
                {
                  roomName:   values.name.trim(),
                  department: { departmentId: parseInt(values.departmentId, 10) },
                },
                { headers: getAuthHeader() }
              );
              await fetchRooms();
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {/* PUT /api/updateRoom/{roomId}
          Body: { roomName }
          Note: RoomsService.updateRoom() only updates roomName — department
          cannot be changed on edit (it uses the existing room's department for
          the duplicate check). We still show the department field as read-only
          context, but only send roomName in the PUT body. */}
      {editRoom && (
        <Modal title="Edit Room" onClose={() => setEditRoom(null)}>
          <RoomForm
            initialName={editRoom.name}
            initialDepartmentId={
              departments.find((d) => d.departmentName === editRoom.departmentName)
                ?.departmentId?.toString() ?? ""
            }
            submitLabel="Save Changes"
            departments={departments}
            departmentsLoading={departmentsLoading}
            onSubmit={async (values) => {
              // FIX: only send roomName — backend updateRoom() only mutates roomName.
              // Sending department on update would be silently ignored by the service,
              // but we omit it to keep the request minimal and accurate.
              await axios.put(
                `/api/updateRoom/${editRoom.id}`,
                { roomName: values.name.trim() },
                { headers: getAuthHeader() }
              );
              await fetchRooms();
            }}
            onClose={() => setEditRoom(null)}
          />
        </Modal>
      )}

      {/* ── CONFIRM DIALOG ──────────────────────────────────────────────────── */}
      {confirmAction && confirmMeta && (
        <ConfirmDialog
          title={confirmMeta.title}
          message={confirmMeta.message}
          confirmLabel={confirmMeta.confirmLabel}
          danger={confirmMeta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}