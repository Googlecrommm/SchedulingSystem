import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserCog, Archive, Pencil, RefreshCw } from "lucide-react";

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
  { label: "All",     icon: UserCog },
  { label: "Archive", icon: Archive },
];

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const roleSchema = Yup.object({
  name: Yup.string().required("Role name is required"),
});

function RoleForm({ initialName = "", submitLabel = "Submit", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { name: initialName },
    validationSchema: roleSchema,
    onSubmit: (values, { setSubmitting }) => {
      onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Role Name" error={formik.touched.name && formik.errors.name}>
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

export default function RoleManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editRole,      setEditRole]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [roles,         setRoles]         = useState([]);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    try {
      
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = roles
    .filter((r) => (activeTab === "Archive" ? r.archived : !r.archived))
    .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  function handleAction(action, role) {
    if (action === "Edit")      return setEditRole(role);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   role });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", role });
  }

  async function applyConfirm() {
    const { type, role } = confirmAction;
    try {
      
    } catch (err) {
      console.error(`Failed to ${type} role:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Role Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Role"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Role"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Role Name", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={UserCog}
        emptyText={activeTab === "Archive" ? "No archived roles" : "No roles found"}
        renderRow={(role) => (
          <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{role.name}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archive" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, role)}
              />
            </td>
          </tr>
        )}
      />

      {}
      {showCreate && (
        <Modal title="Add Role" onClose={() => setShowCreate(false)}>
          <RoleForm
            submitLabel="Submit"
            onSubmit={async (values) => {
              
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {}
      {editRole && (
        <Modal title="Edit Role" onClose={() => setEditRole(null)}>
          <RoleForm
            initialName={editRole.name}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              
            }}
            onClose={() => setEditRole(null)}
          />
        </Modal>
      )}

      {}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Role?" : "Unarchive Role?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.role.name}" will be moved to the archive.`
              : `"${confirmAction.role.name}" will be restored to active.`
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
