import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Users, MinusCircle, Eye, UserCog, RefreshCw, ChevronDown } from "lucide-react";

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

const BASE_URL = "http://localhost:8080"; // adjust if needed

const TABS = [
  { label: "All",      icon: Users },
  { label: "Disabled", icon: MinusCircle },
];

const COLUMNS = ["Name", "Department", "Role", "Status", "Action"];

function getActions(activeTab, userStatus) {
  if (activeTab === "Disabled") return [{ label: "View", icon: Eye }, { label: "Enable", icon: RefreshCw }];
  if (userStatus === "Disabled") return [
    { label: "View",    icon: Eye },
    { label: "Edit",    icon: UserCog },
    { label: "Enable",  icon: RefreshCw },
  ];
  return [
    { label: "View",    icon: Eye },
    { label: "Edit",    icon: UserCog },
    { label: "Disable", icon: MinusCircle, danger: true },
  ];
}

const createSchema = Yup.object({
  name:     Yup.string().required("Name is required"),
  email:    Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "At least 6 characters").required("Password is required"),
  role:     Yup.string().required("Role is required"),
});

const editSchema = Yup.object({
  name:     Yup.string().required("Name is required"),
  email:    Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "At least 6 characters"),
  // department is display-only in edit — role carries it on the backend
  role:     Yup.string().required("Role is required"),
});

/**
 * Map a UserResponseDTO from Spring to the flat shape used by the UI.
 *
 * UserResponseDTO fields:
 *   userId, name, email, roleName, departmentName, accountStatus
 *
 * NOTE: Make sure your UserResponseDTO exposes `userId` (see fix note below).
 */
function mapUser(u) {
  return {
    id:         u.userId,                     // FIX: UserResponseDTO must include userId
    name:       u.name        ?? "",
    email:      u.email       ?? "",
    role:       u.roleName    ?? "",          // FIX: DTO field is `roleName`, not `role.roleName`
    roleId:     u.roleId      ?? "",          // FIX: DTO must include roleId for edit payload
    department: u.departmentName ?? "",       // FIX: DTO field is `departmentName`
    status:     u.accountStatus  ?? "",       // FIX: DTO field is `accountStatus`, not `status`
  };
}

/** Return the Authorization header value from wherever you store the JWT */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function UserForm({ initialValues, validationSchema, submitLabel, onSubmit, onClose, roles }) {
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch (err) {
        console.error("Form submit error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Name" error={formik.touched.name && formik.errors.name}>
        <input type="text" placeholder="Name" className={ic("name")} {...formik.getFieldProps("name")} />
      </FormField>

      <FormField label="Email" error={formik.touched.email && formik.errors.email}>
        <input type="email" placeholder="Email" className={ic("email")} {...formik.getFieldProps("email")} />
      </FormField>

      <FormField label="Password" error={formik.touched.password && formik.errors.password}>
        <input type="password" placeholder="Password" className={ic("password")} {...formik.getFieldProps("password")} />
      </FormField>

      <FormField label="Role" error={formik.touched.role && formik.errors.role}>
        <div className="relative">
          <select
            className={`${ic("role")} appearance-none cursor-pointer`}
            {...formik.getFieldProps("role")}
          >
            <option value="" disabled>Select role</option>
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
    user.status === "Active"   ? "text-green-600" :
    user.status === "Disabled" ? "text-accent"    : "text-gray-400";

  return (
    <Modal title="View User" onClose={onClose}>
      <div className="space-y-4">
        {[
          { label: "Name",       value: user.name       },
          { label: "Email",      value: user.email      },
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

  // ─── Fetch all users ───────────────────────────────────────────────────────
  async function fetchUsers() {
    setLoading(true);
    try {
      // FIX: added leading slash → /api/getUsers
      const res = await fetch(`${BASE_URL}/api/getUsers?size=100`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Spring Page<UserResponseDTO> → data.content
      const content = data.content ?? data;
      setUsers(content.map(mapUser));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Fetch roles for dropdown (/api/roleDropdown — requires ADMIN token) ──
  async function fetchDropdownData() {
    try {
      // FIX: added leading slash → /api/roleDropdown
      const res = await fetch(`${BASE_URL}/api/roleDropdown`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // RoleResponseDTO: { roleId, roleName, departmentName, roleStatus }
      // Only show Active roles
      const activeRoles = data.filter((r) => r.roleStatus !== "Archived");
      setRoles(activeRoles.map((r) => ({ id: r.roleId, name: r.roleName })));
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }

  // ─── Client-side filtering ─────────────────────────────────────────────────
  const filtered = users
    .filter((u) => {
      if (activeTab === "Disabled") return u.status === "Disabled";
      return true;
    })
    .filter((u) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });

  // ─── Action dispatcher ─────────────────────────────────────────────────────
  function handleAction(action, user) {
    switch (action) {
      case "View":    return setViewUser(user);
      case "Edit":    return setEditUser(user);
      case "Disable": return setConfirmAction({ type: "disable", user });
      case "Enable":  return setConfirmAction({ type: "enable",  user });
    }
  }

  // ─── Confirm: disable / enable ────────────────────────────────────────────
  async function applyConfirm() {
    const { type, user } = confirmAction;
    try {
      // FIX: correct endpoint paths with leading slash
      const endpoint =
        type === "disable"
          ? `${BASE_URL}/api/disableUser/${user.id}`
          : `${BASE_URL}/api/activateUser/${user.id}`;

      const res = await fetch(endpoint, {
        method:  "PUT",
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Optimistic update — no full refetch needed
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: type === "disable" ? "Disabled" : "Active" }
            : u
        )
      );
    } catch (err) {
      console.error(`Failed to ${type} user:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  // ─── Create user (POST /auth/register) ────────────────────────────────────
  async function handleCreate(values) {
    // Users.java expects: name, email, password, role { roleId }
    const payload = {
      name:     values.name,
      email:    values.email,
      password: values.password,
      role:     { roleId: Number(values.role) },  // FIX: matches @JoinColumn roleId in Users entity
    };

    const res = await fetch(`${BASE_URL}/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    await fetchUsers();
  }

  // ─── Update user (PUT /api/updateUser/:id) ────────────────────────────────
  async function handleEdit(values) {
    // UsersService.updateUser accepts: name, email, password (optional), role { roleId }
    const payload = {
      name:  values.name,
      email: values.email,
      role:  { roleId: Number(values.role) },       // FIX: backend reads role.roleId
      ...(values.password ? { password: values.password } : {}),
    };

    const res = await fetch(`${BASE_URL}/api/updateUser/${editUser.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    await fetchUsers();
  }

  const confirmMeta = confirmAction && {
    disable: { title: "Disable User?", msg: `"${confirmAction.user.name}" will be disabled.`,   label: "Disable", danger: true  },
    enable:  { title: "Enable User?",  msg: `"${confirmAction.user.name}" will be re-enabled.`, label: "Enable",  danger: false },
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
        columns={COLUMNS}
        rows={filtered}
        loading={loading}
        emptyIcon={Users}
        emptyText={activeTab === "Disabled" ? "No disabled users" : "No users found"}
        renderRow={(user) => (
          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{user.name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.department}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.role}</td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={user.status} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(activeTab, user.status)}
                onAction={(action) => handleAction(action, user)}
              />
            </td>
          </tr>
        )}
      />

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Account" onClose={() => setShowCreate(false)} scrollable>
          <UserForm
            initialValues={{ name: "", email: "", password: "", role: "" }}
            validationSchema={createSchema}
            submitLabel="Submit"
            roles={roles}
            showDepartment={false}
            onSubmit={handleCreate}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* View Modal */}
      {viewUser && <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />}

      {/* Edit Modal */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)} scrollable>
          <UserForm
            initialValues={{
              name:     editUser.name,
              email:    editUser.email,
              password: "",
              role:     String(editUser.roleId ?? ""),
            }}
            validationSchema={editSchema}
            submitLabel="Save"
            roles={roles}
            onSubmit={handleEdit}
            onClose={() => setEditUser(null)}
          />
        </Modal>
      )}

      {/* Confirm Dialog */}
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