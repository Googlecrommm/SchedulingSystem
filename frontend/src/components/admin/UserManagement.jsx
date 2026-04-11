import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Users, MinusCircle, Archive, Eye, UserCog, RefreshCw, ChevronDown } from "lucide-react";

import {
  AdminLayout,
  TabBar,
  DataTable,
  ActionDropdown,
  Modal,
  ModalFooter,
  FormField,
  useInputClass,
  readonlyInputClass,
  StatusBadge,
  ConfirmDialog,
} from "../ui";

const TABS = [
  { label: "All",      icon: Users },
  { label: "Disabled", icon: MinusCircle },
  { label: "Archive",  icon: Archive },
];

const ALL_COLUMNS     = ["Full Name", "Department", "Role", "Status", "Action"];
const ARCHIVE_COLUMNS = ["Full Name", "Department", "Role", "Action"];

function getActions(activeTab, userStatus) {
  if (activeTab === "Archive")  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
  if (activeTab === "Disabled") return [{ label: "View", icon: Eye }, { label: "Enable",    icon: RefreshCw }];
  if (userStatus === "Disabled") return [
    { label: "View",    icon: Eye },
    { label: "Edit",    icon: UserCog },
    { label: "Enable",  icon: RefreshCw },
    { label: "Archive", icon: Archive, danger: true },
  ];
  return [
    { label: "View",    icon: Eye },
    { label: "Edit",    icon: UserCog },
    { label: "Disable", icon: MinusCircle, danger: true },
    { label: "Archive", icon: Archive,     danger: true },
  ];
}

const createSchema = Yup.object({
  fullName:   Yup.string().required("Full name is required"),
  password:   Yup.string().min(6, "At least 6 characters").required("Password is required"),
  department: Yup.string().required("Department is required"),
  role:       Yup.string().required("Role is required"),
});

const editSchema = Yup.object({
  fullName:   Yup.string().required("Full name is required"),
  password:   Yup.string().min(6, "At least 6 characters"),
  department: Yup.string().required("Department is required"),
  role:       Yup.string().required("Role is required"),
});

function UserForm({ initialValues, validationSchema, submitLabel, onSubmit, onClose, departments, roles }) {
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      await onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Full Name" error={formik.touched.fullName && formik.errors.fullName}>
        <input type="text" placeholder="Full Name" className={ic("fullName")} {...formik.getFieldProps("fullName")} />
      </FormField>

      <FormField label="Password" error={formik.touched.password && formik.errors.password}>
        <input type="password" placeholder="Password" className={ic("password")} {...formik.getFieldProps("password")} />
      </FormField>

      <FormField label="Department" error={formik.touched.department && formik.errors.department}>
        <div className="relative">
          <select className={`${ic("department")} appearance-none cursor-pointer`} {...formik.getFieldProps("department")}>
            <option value="" disabled>Select department</option>
            {}
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Role" error={formik.touched.role && formik.errors.role}>
        <div className="relative">
          <select className={`${ic("role")} appearance-none cursor-pointer`} {...formik.getFieldProps("role")}>
            <option value="" disabled>Select role</option>
            {}
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </FormField>

      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}

function ViewUserModal({ user, onClose }) {
  const statusColor =
    user.status === "Enabled"  ? "text-green-600" :
    user.status === "Disabled" ? "text-accent"    : "text-gray-400";

  return (
    <Modal title="View User" onClose={onClose}>
      <div className="space-y-4">
        {[
          { label: "Full Name",  value: user.fullName   },
          { label: "Department", value: user.department },
          { label: "Role",       value: user.role       },
        ].map(({ label, value }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
            <input readOnly value={value} className={readonlyInputClass} />
          </div>
        ))}
        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Status</label>
          <input readOnly value={user.status} className={`${readonlyInputClass} font-semibold ${statusColor}`} />
        </div>
        <ModalFooter onClose={onClose} />
      </div>
    </Modal>
  );
}

export default function UserManagement() {
  const [users,         setUsers]         = useState([]);
  const [departments,   setDepartments]   = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [viewUser,      setViewUser]      = useState(null);
  const [editUser,      setEditUser]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => { setSearchQuery(""); }, [activeTab]);

  useEffect(() => {
    fetchUsers();
    fetchDropdownData();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDropdownData() {
    try {
      
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }

  const filtered = users
    .filter((u) => {
      if (activeTab === "Archive")  return u.status === "Archived";
      if (activeTab === "Disabled") return u.status === "Disabled";
      return u.status !== "Archived";
    })
    .filter((u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const columns = activeTab === "Archive" ? ARCHIVE_COLUMNS : ALL_COLUMNS;

  function handleAction(action, user) {
    switch (action) {
      case "View":      return setViewUser(user);
      case "Edit":      return setEditUser(user);
      case "Disable":   return setConfirmAction({ type: "disable",   user });
      case "Enable":    return setConfirmAction({ type: "enable",    user });
      case "Archive":   return setConfirmAction({ type: "archive",   user });
      case "Unarchive": return setConfirmAction({ type: "unarchive", user });
    }
  }

  async function applyConfirm() {
    const { type, user } = confirmAction;
    try {
      
    } catch (err) {
      console.error(`Failed to ${type} user:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  const confirmMeta = confirmAction && {
    disable:   { title: "Disable User?",   msg: `"${confirmAction.user.fullName}" will be disabled.`,           label: "Disable",   danger: true  },
    enable:    { title: "Enable User?",    msg: `"${confirmAction.user.fullName}" will be re-enabled.`,         label: "Enable",    danger: false },
    archive:   { title: "Archive User?",   msg: `"${confirmAction.user.fullName}" will be moved to archive.`,   label: "Archive",   danger: true  },
    unarchive: { title: "Unarchive User?", msg: `"${confirmAction.user.fullName}" will be restored to active.`, label: "Unarchive", danger: false },
  }[confirmAction.type];

  return (
    <AdminLayout
      pageTitle="User Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search User"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Create Account"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyIcon={Users}
        emptyText={
          activeTab === "Archive"  ? "No archived users"  :
          activeTab === "Disabled" ? "No disabled users"  : "No users found"
        }
        renderRow={(user) => (
          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{user.fullName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.department}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.role}</td>
            {activeTab !== "Archive" && (
              <td className="px-6 py-4 text-center">
                <StatusBadge status={user.status} />
              </td>
            )}
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(activeTab, user.status)}
                onAction={(action) => handleAction(action, user)}
              />
            </td>
          </tr>
        )}
      />

      {}
      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)} scrollable>
          <UserForm
            initialValues={{ fullName: "", password: "", department: "", role: "" }}
            validationSchema={createSchema}
            submitLabel="Submit"
            departments={departments}
            roles={roles}
            onSubmit={async (values) => {
              
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {}
      {viewUser && <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />}

      {}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)} scrollable>
          <UserForm
            initialValues={{ fullName: editUser.fullName, password: "", department: editUser.department, role: editUser.role }}
            validationSchema={editSchema}
            submitLabel="Save"
            departments={departments}
            roles={roles}
            onSubmit={async (values) => {
              
            }}
            onClose={() => setEditUser(null)}
          />
        </Modal>
      )}

      {}
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
