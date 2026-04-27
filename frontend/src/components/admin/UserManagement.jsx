// Remove the View Actions because it panget boi kase nasa table na lahat di na pala need ng view Also Add eye icon for password.
import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Users, MinusCircle, UserCog, RefreshCw, ChevronDown, Eye, EyeOff } from "lucide-react";

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

const BASE_URL = "http://localhost:8080"; 

const TABS = [
  { label: "All",      icon: Users },
  { label: "Disabled", icon: MinusCircle },
];

const COLUMNS = ["Name", "Department", "Role", "Status", "Action"];

function getActions(activeTab, userStatus) {
  if (activeTab === "Disabled") return [{ label: "Enable", icon: RefreshCw }];
  if (userStatus === "Disabled") return [
    { label: "Edit",    icon: UserCog },
    { label: "Enable",  icon: RefreshCw },
  ];
  return [
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

  role:     Yup.string().required("Role is required"),
});


function mapUser(u) {
  return {
    id:         u.userId,                     
    name:       u.name        ?? "",
    email:      u.email       ?? "",
    role:       u.roleName    ?? "",        
    roleId:     u.roleId      ?? "",          
    department: u.departmentName ?? "",       
    status:     u.accountStatus  ?? "",       
  };
}


function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
      <FormField label="Name" error={formik.touched.name && formik.errors.name}>
        <input type="text" placeholder="Name" className={ic("name")} {...formik.getFieldProps("name")} />
      </FormField>

      <FormField label="Email" error={formik.touched.email && formik.errors.email}>
        <input type="email" placeholder="Email" className={ic("email")} {...formik.getFieldProps("email")} />
      </FormField>

      <FormField label="Password" error={formik.touched.password && formik.errors.password}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={ic("password")}
            {...formik.getFieldProps("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
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
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </FormField>

      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}

export default function UserManagement() {
  const [users,         setUsers]         = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
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
     
      const res = await fetch(`${BASE_URL}/api/getUsers?size=100`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
     
      const content = data.content ?? data;
      setUsers(content.map(mapUser));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }


  async function fetchDropdownData() {
    try {
     
      const res = await fetch(`${BASE_URL}/api/roleDropdown`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const activeRoles = data.filter((r) => r.roleStatus !== "Archived");
      setRoles(
      activeRoles.map((r) => ({
      id: r.roleId,
       name: r.departmentName
      ? `${r.roleName} (${r.departmentName})`
      : r.roleName,
       }))
);
} catch (err) {
  console.error("Failed to fetch dropdown data:", err);
}
}

  
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

 
  function handleAction(action, user) {
    switch (action) {
      case "Edit":    return setEditUser(user);
      case "Disable": return setConfirmAction({ type: "disable", user });
      case "Enable":  return setConfirmAction({ type: "enable",  user });
    }
  }

  
  async function applyConfirm() {
    const { type, user } = confirmAction;
    try {

      const endpoint =
        type === "disable"
          ? `${BASE_URL}/api/disableUser/${user.id}`
          : `${BASE_URL}/api/activateUser/${user.id}`;

      const res = await fetch(endpoint, {
        method:  "PUT",
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      
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

  
  async function handleCreate(values) {
    
    const payload = {
      name:     values.name,
      email:    values.email,
      password: values.password,
      role:     { roleId: Number(values.role) },  
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

  
  async function handleEdit(values) {
    
    const payload = {
      name:  values.name,
      email: values.email,
      role:  { roleId: Number(values.role) },      
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