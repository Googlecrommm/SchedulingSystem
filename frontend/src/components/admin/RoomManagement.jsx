import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { BedDouble, Archive, Pencil, RefreshCw } from "lucide-react";
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

const TABS = [
  { label: "All",     icon: BedDouble },
  { label: "Archive", icon: Archive   },
];

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const roomSchema = Yup.object({
  name: Yup.string().required("Room name is required"),
});

const PAGE_SIZE = 10;

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function RoomForm({ initialName = "", submitLabel = "Submit", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { name: initialName },
    validationSchema: roomSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch {
        // error handled by caller
      } finally {
        setSubmitting(false);
      }
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Room" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          placeholder="Room"
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

function mapRoom(r) {
  return {
    id:       r.roomId,
    name:     r.roomName,
    archived: r.roomStatus === "Archived",
  };
}

export default function RoomManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editRoom,      setEditRoom]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rooms,         setRooms]         = useState([]);
  const [loading,       setLoading]       = useState(false);

  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchRooms();
  }, [activeTab, searchQuery, page]);

  async function fetchRooms() {
    setLoading(true);
    try {
      const statusParam = activeTab === "Archive" ? "Archived" : "Active";

      const url = searchQuery.trim()
        ? `/api/searchRoom/${encodeURIComponent(searchQuery.trim())}`
        : `/api/getRooms`;

      const params = {
        page,
        size: PAGE_SIZE,
        sort: "roomName,asc",
        ...(searchQuery.trim() ? {} : { roomStatus: statusParam }),
      };

      const res = await axios.get(url, {
        headers: getAuthHeader(),
        params,
      });

      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setRooms(content.map(mapRoom));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setRooms([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  const filtered = searchQuery.trim()
    ? rooms.filter((r) => (activeTab === "Archive" ? r.archived : !r.archived))
    : rooms;

  function handleAction(action, room) {
    if (action === "Edit")      return setEditRoom(room);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   room });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", room });
  }

  async function applyConfirm() {
    const { type, room } = confirmAction;
    try {
      const endpoint =
        type === "archive"
          ? `/api/archiveRoom/${room.id}`
          : `/api/restoreRoom/${room.id}`;

      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });

      await fetchRooms();
    } catch (err) {
      console.error(`Failed to ${type} room:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

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
        onTabChange={setActiveTab}
        addLabel="Add Room"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Room", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={BedDouble}
        emptyText={activeTab === "Archive" ? "No archived rooms" : "No rooms found"}
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(room) => (
          <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{room.name}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archive" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, room)}
              />
            </td>
          </tr>
        )}
      />

      {showCreate && (
        <Modal title="Add Room" onClose={() => setShowCreate(false)}>
          <RoomForm
            submitLabel="Submit"
            onSubmit={async (values) => {
              await axios.post(
                "/api/createRoom",
                { roomName: values.name },
                { headers: getAuthHeader() }
              );
              await fetchRooms();
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editRoom && (
        <Modal title="Edit Room" onClose={() => setEditRoom(null)}>
          <RoomForm
            initialName={editRoom.name}
            submitLabel="Edit"
            onSubmit={async (values) => {
              await axios.put(
                `/api/updateRoom/${editRoom.id}`,
                { roomName: values.name },
                { headers: getAuthHeader() }
              );
              await fetchRooms();
            }}
            onClose={() => setEditRoom(null)}
          />
        </Modal>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Room?" : "Unarchive Room?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.room.name}" will be moved to the archive.`
              : `"${confirmAction.room.name}" will be restored to active.`
          }
          confirmLabel={confirmAction.type === "archive" ? "Archive" : "Unarchive"}
          danger={confirmAction.type === "archive"}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}
