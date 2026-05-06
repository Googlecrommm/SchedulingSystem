import { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Users, MinusCircle, UserCog, RefreshCw, ChevronDown, Eye, EyeOff } from "lucide-react";
import axios from "../../config/axiosInstance";
import { toast } from "../ui/Toast";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All",      icon: Users       },
  { label: "Disabled", icon: MinusCircle },
];

const COLUMNS = ["Name", "Email", "Department", "Role", "Status", "Action"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// Maps UserResponseDTO fields exactly as the backend returns them:
//   userId, fullName, email, roleName, roleId, departmentName, accountStatus
function mapUser(u) {
  return {
    id:         u.userId,
    name:       u.fullName        ?? "",   // fullName, not "name"
    email:      u.email           ?? "",
    role:       u.roleName        ?? "",   // roleName, not "role"
    roleId:     u.roleId          ?? "",   // ← FIX: store roleId for Edit form
    department: u.departmentName  ?? "",   // departmentName, not "department"
    status:     u.accountStatus   ?? "",   // accountStatus, not "status"
  };
}

function getActions(user) {
  if (user.status === "Disabled") {
    return [
      { label: "Edit",   icon: UserCog   },
      { label: "Enable", icon: RefreshCw },
    ];
  }
  return [
    { label: "Edit",    icon: UserCog                    },
    { label: "Disable", icon: MinusCircle, danger: true  },
  ];
}

// ── Validation schemas ────────────────────────────────────────────────────────

const createSchema = Yup.object({
  firstName:  Yup.string().required("First name is required"),
  middleName: Yup.string(),
  lastName:   Yup.string().required("Last name is required"),
  email:      Yup.string().email("Invalid email").required("Email is required"),
  password:   Yup.string().min(6, "At least 6 characters").required("Password is required"),
  role:       Yup.string().required("Role is required"),
});

const editSchema = Yup.object({
  firstName:  Yup.string().required("First name is required"),
  middleName: Yup.string(),
  lastName:   Yup.string().required("Last name is required"),
  email:      Yup.string().email("Invalid email").required("Email is required"),
  password:   Yup.string().min(6, "At least 6 characters"), // optional on edit
  role:       Yup.string().required("Role is required"),
});

// ── User Form ─────────────────────────────────────────────────────────────────

function UserForm({ initialValues, validationSchema, submitLabel, onSubmit, onClose, roles }) {
  const [showPassword, setShowPassword] = useState(false);

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

      <FormField label="First Name" error={formik.touched.firstName && formik.errors.firstName}>
        <input
          type="text"
          placeholder="First Name"
          className={ic("firstName")}
          {...formik.getFieldProps("firstName")}
        />
      </FormField>

      <FormField label="Middle Name" error={formik.touched.middleName && formik.errors.middleName}>
        <input
          type="text"
          placeholder="Middle Name (optional)"
          className={ic("middleName")}
          {...formik.getFieldProps("middleName")}
        />
      </FormField>

      <FormField label="Last Name" error={formik.touched.lastName && formik.errors.lastName}>
        <input
          type="text"
          placeholder="Last Name"
          className={ic("lastName")}
          {...formik.getFieldProps("lastName")}
        />
      </FormField>

      <FormField label="Email" error={formik.touched.email && formik.errors.email}>
        <input
          type="email"
          placeholder="Email"
          className={ic("email")}
          {...formik.getFieldProps("email")}
        />
      </FormField>

      <FormField label="Password" error={formik.touched.password && formik.errors.password}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={submitLabel === "Save" ? "Leave blank to keep current" : "Password"}
            className={ic("password")}
            {...formik.getFieldProps("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users,         setUsers]         = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [serverResults, setServerResults] = useState(null); // null = not searching
  const [showCreate,    setShowCreate]    = useState(false);
  const [editUser,      setEditUser]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  // Reset search + page when switching tabs
  useEffect(() => {
    setSearchQuery("");
    setServerResults(null);
    setPage(0);
  }, [activeTab]);

  // Fetch users whenever tab or page changes
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 10,
        // Filter by accountStatus when on the Disabled tab
        ...(activeTab === "Disabled" && { accountStatus: "Disabled" }),
      };
      const res = await axios.get("/api/getUsers", {
        headers: getAuthHeader(),
        params,
      });
      const content = res.data?.content ?? [];
      setUsers(content.map(mapUser));
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Fetch role dropdown once on mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await axios.get("/api/frontdeskDropdown", { headers: getAuthHeader() });
        const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
        setRoles(
          data
            .filter((r) => r.roleStatus !== "Archived")
            .map((r) => ({
              id:   r.roleId,
              name: r.departmentName
                ? `${r.roleName} (${r.departmentName})`
                : r.roleName,
            }))
        );
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    }
    fetchRoles();
  }, []);

  // Debounced server-side search using /api/searchUser/{name}
  useEffect(() => {
    if (!searchQuery.trim()) { setServerResults(null); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          `/api/searchUser/${encodeURIComponent(searchQuery.trim())}`,
          { headers: getAuthHeader(), params: { page: 0, size: 100 } }
        );
        const content = res.data?.content ?? [];
        setServerResults(content.map(mapUser));
      } catch (err) {
        console.error("Search failed:", err);
        setServerResults(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // What to display: search results override paged list
  const displayed = serverResults ?? users;

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleAction(action, user) {
    if (action === "Edit")    return setEditUser(user);
    if (action === "Disable") return setConfirmAction({ type: "disable", user });
    if (action === "Enable")  return setConfirmAction({ type: "enable",  user });
  }

  async function applyConfirm() {
    const { type, user } = confirmAction;
    try {
      const endpoint =
        type === "disable"
          ? `/api/disableUser/${user.id}`
          : `/api/activateUser/${user.id}`;

      await axios.put(endpoint, {}, { headers: getAuthHeader() });

      toast(
        type === "disable"
          ? `"${user.name}" has been disabled.`
          : `"${user.name}" has been enabled.`,
        type === "disable" ? "warning" : "success"
      );

      // Optimistic UI update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: type === "disable" ? "Disabled" : "Active" }
            : u
        )
      );
    } catch (err) {
      console.error(`Failed to ${type} user:`, err);
      toast(`Failed to ${type} user.`, "error");
    } finally {
      setConfirmAction(null);
    }
  }

  // Create — POST /auth/register
  // Backend Users model fields: firstName, middleName, lastName, email, password, role { roleId }
  async function handleCreate(values) {
    await axios.post(
      "/auth/register",
      {
        firstName:  values.firstName,
        middleName: values.middleName || null,
        lastName:   values.lastName,
        email:      values.email,
        password:   values.password,
        role:       { roleId: Number(values.role) },
      },
      { headers: { ...getAuthHeader(), "Content-Type": "application/json" } }
    );
    toast(`Account for "${values.lastName}, ${values.firstName}" has been created.`);
    await fetchUsers();
  }

  // Edit — PUT /api/updateUser/{id}
  // Only send password if the user filled it in
  async function handleEdit(values) {
    await axios.put(
      `/api/updateUser/${editUser.id}`,
      {
        firstName:  values.firstName,
        middleName: values.middleName || null,
        lastName:   values.lastName,
        email:      values.email,
        role:       { roleId: Number(values.role) },
        ...(values.password ? { password: values.password } : {}),
      },
      { headers: { ...getAuthHeader(), "Content-Type": "application/json" } }
    );
    toast(`"${values.lastName}, ${values.firstName}" has been updated.`);
    await fetchUsers();
  }

  // Split the editUser's fullName back into first/middle/last for the form.
  // Backend stores "lastName, firstName middleName" — we reverse that here.
  function splitFullName(fullName = "") {
    // Format: "LastName, FirstName MiddleName"
    const [lastName = "", rest = ""] = fullName.split(", ");
    const parts      = rest.trim().split(" ");
    const firstName  = parts[0] ?? "";
    const middleName = parts.slice(1).join(" ");
    return { firstName, middleName, lastName };
  }

  const confirmMeta = confirmAction && {
    disable: {
      title: "Disable User?",
      msg:   `"${confirmAction.user.name}" will be disabled.`,
      label: "Disable",
      danger: true,
    },
    enable: {
      title: "Enable User?",
      msg:   `"${confirmAction.user.name}" will be re-enabled.`,
      label: "Enable",
      danger: false,
    },
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
        rows={displayed}
        loading={loading}
        emptyIcon={Users}
        emptyText={activeTab === "Disabled" ? "No disabled users" : "No users found"}
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(user) => (
          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{user.name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.email}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.department}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{user.role}</td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={user.status} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(user)}
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
            initialValues={{ firstName: "", middleName: "", lastName: "", email: "", password: "", role: "" }}
            validationSchema={createSchema}
            submitLabel="Submit"
            roles={roles}
            onSubmit={handleCreate}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)} scrollable>
          <UserForm
            initialValues={{
              ...splitFullName(editUser.name),
              email:    editUser.email,
              password: "",
              role:     String(roles.find(r => r.name === editUser.role || r.name === `${editUser.role} (${editUser.department})`)?.id ?? ""),
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