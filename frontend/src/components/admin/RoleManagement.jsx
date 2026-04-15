import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserCog, Archive, Pencil, RefreshCw, ChevronDown } from "lucide-react";
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
  { label: "All",     icon: UserCog },
  { label: "Archive", icon: Archive },
];

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const roleSchema = Yup.object({
  name:         Yup.string().required("Role name is required"),
  departmentId: Yup.string().required("Department is required"),
});

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function mapRole(r) {
  return {
    id:             r.roleId,
    name:           r.roleName,
    departmentName: r.departmentName,
    archived:       r.roleStatus === "Archived",
    isAdmin:        r.roleName?.toLowerCase() === "admin",
  };
}

function RoleForm({ initialName = "", initialDepartmentId = "", submitLabel = "Submit", onSubmit, onClose, departments }) {
  const formik = useFormik({
    initialValues: { name: initialName, departmentId: initialDepartmentId },
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

      <FormField label="Department" error={formik.touched.departmentId && formik.errors.departmentId}>
        <div className="relative">
          <select
            className={`${ic("departmentId")} appearance-none cursor-pointer`}
            {...formik.getFieldProps("departmentId")}
          >
            <option value="" disabled>Select department</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
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
  const [departments,   setDepartments]   = useState([]);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    try {
      const res = await axios.get("/api/getRoles", {
        headers: getAuthHeader(),
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setRoles(data.map(mapRole));
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
      const res = await axios.get("/api/getDepartments", {
        headers: getAuthHeader(),
      });
      const data = Array.isArray(res.data) ? res.data : [];
      
      setDepartments(data.filter((d) => d.departmentStatus === "Active"));
    } catch (err) {
      console.error("Failed to fetch departments:", err);
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

 
  function getRowActions(role) {
    if (activeTab === "Archive") return archiveActions;
    if (role.isAdmin) return [{ label: "Edit", icon: Pencil }];
    return activeActions;
  }

  async function applyConfirm() {
    const { type, role } = confirmAction;
    try {
      const endpoint =
        type === "archive"
          ? `/api/archiveRole/${role.id}`
          : `/api/restoreRole/${role.id}`;

      await axios.put(endpoint, null, {
        headers: getAuthHeader(),
      });

      await fetchRoles();
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
        columns={["Role Name", "Department", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={UserCog}
        emptyText={activeTab === "Archive" ? "No archived roles" : "No roles found"}
        renderRow={(role) => (
          <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{role.name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{role.departmentName ?? "—"}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getRowActions(role)}
                onAction={(action) => handleAction(action, role)}
              />
            </td>
          </tr>
        )}
      />

    
      {showCreate && (
        <Modal title="Add Role" onClose={() => setShowCreate(false)}>
          <RoleForm
            submitLabel="Submit"
            departments={departments}
            onSubmit={async (values) => {
              try {
                await axios.post(
                  "/api/createRole",
                  {
                    roleName:   values.name,
                    department: { departmentId: parseInt(values.departmentId) },
                  },
                  { headers: getAuthHeader() }
                );
                await fetchRoles();
              } catch (err) {
                console.error("Failed to create role:", err);
              }
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

    
      {editRole && (
        <Modal title="Edit Role" onClose={() => setEditRole(null)}>
          <RoleForm
            initialName={editRole.name}
            initialDepartmentId={
              departments.find((d) => d.departmentName === editRole.departmentName)?.departmentId?.toString() ?? ""
            }
            submitLabel="Save Changes"
            departments={departments}
            onSubmit={async (values) => {
              try {
                await axios.put(
                  `/api/updateRole/${editRole.id}`,
                  {
                    roleName:   values.name,
                    department: { departmentId: parseInt(values.departmentId) },
                  },
                  { headers: getAuthHeader() }
                );
                await fetchRoles();
              } catch (err) {
                console.error("Failed to update role:", err);
              } finally {
                setEditRole(null);
              }
            }}
            onClose={() => setEditRole(null)}
          />
        </Modal>
      )}

      
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