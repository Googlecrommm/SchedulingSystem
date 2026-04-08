import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  LayoutDashboard,
  Users,
  Bell,
  ChevronDown,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MoreHorizontal,
  Eye,
  UserCog,
  MinusCircle,
  RefreshCw,
  Archive,
} from "lucide-react";
import DGMCIcon from "../../assets/DGMC-icon.svg";



const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Management", icon: Users, path: "/admin/user-management" },
];



const tabs = [
  { label: "All",      icon: Users },
  { label: "Disabled", icon: MinusCircle },
  { label: "Archive",  icon: Archive },
];


const allColumns      = ["Full Name", "Department", "Role", "Status", "Action"];
const archiveColumns  = ["Full Name", "Department", "Role", "Action"];



const allActiveActionItems = [
  { label: "View",    icon: Eye },
  { label: "Edit",    icon: UserCog },
  { label: "Disable", icon: MinusCircle },
  { label: "Archive", icon: Archive },
];

const allDisabledActionItems = [
  { label: "View",    icon: Eye },
  { label: "Edit",    icon: UserCog },
  { label: "Enable",  icon: RefreshCw },
  { label: "Archive", icon: Archive },
];

const disabledTabActionItems = [
  { label: "View",   icon: Eye },
  { label: "Enable", icon: RefreshCw },
];

const archiveActionItems = [
  { label: "View",      icon: Eye },
  { label: "Unarchive", icon: RefreshCw },
];


function getActionItems(activeTab, userStatus) {
  if (activeTab === "Archive")  return archiveActionItems;
  if (activeTab === "Disabled") return disabledTabActionItems;
  
  return userStatus === "Disabled" ? allDisabledActionItems : allActiveActionItems;
}



function StatusBadge({ status }) {
  const isEnabled = status !== "Disabled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        ${isEnabled
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isEnabled ? "bg-green-500" : "bg-red-500"}`}
      />
      {isEnabled ? "Enabled" : "Disabled"}
    </span>
  );
}



function ViewUserModal({ user, onClose }) {
  const readonlyClass =
    "w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-input text-primary text-sm cursor-default select-none";

  const statusColor =
    user.status === "Enabled"  ? "text-green-600" :
    user.status === "Disabled" ? "text-accent"    :
    "text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-sm">

        <div className="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-primary font-montserrat">View User</h2>
          <button onClick={onClose} className="absolute right-6 text-gray-400 hover:text-primary transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
            <input readOnly value={user.fullName} className={readonlyClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Department</label>
            <input readOnly value={user.department} className={readonlyClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Role</label>
            <input readOnly value={user.role} className={readonlyClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Status</label>
            <input readOnly value={user.status} className={`${readonlyClass} font-semibold ${statusColor}`} />
          </div>

        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                       text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}



const createUserSchema = Yup.object({
  fullName:   Yup.string().required("Full name is required"),
  password:   Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  department: Yup.string().required("Department is required"),
  role:       Yup.string().required("Role is required"),
});

const editUserSchema = Yup.object({
  fullName:   Yup.string().required("Full name is required"),
  password:   Yup.string().min(6, "Password must be at least 6 characters"),
  department: Yup.string().required("Department is required"),
  role:       Yup.string().required("Role is required"),
});



function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      {message}
    </p>
  );
}



function CreateUserModal({ onClose }) {
  const formik = useFormik({
    initialValues: { fullName: "", password: "", department: "", role: "" },
    validationSchema: createUserSchema,
    onSubmit: async (values, { setSubmitting }) => {
      // TODO: replace with axios call once backend is ready:
      // await axios.post("/users/createUser", {
      //   fullName:   values.fullName,
      //   password:   values.password,
      //   department: values.department,
      //   role:       values.role,
      // });
      // onRefresh(); // re-fetch the users list
      console.log("TODO: POST /users/createUser →", values);
      setSubmitting(false);
      onClose();
    },
  });

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-surface-input text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200
     ${formik.touched[field] && formik.errors[field]
       ? "border-red-400 focus:ring-red-200"
       : "border-surface-border focus:ring-primary/30"
     }`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-sm max-h-[90vh] overflow-y-auto">

        <div className="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-primary font-montserrat">Create User</h2>
          <button onClick={onClose} className="absolute right-6 text-gray-400 hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} noValidate className="px-6 py-6 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
            <input type="text" placeholder="Full Name" className={inputClass("fullName")} {...formik.getFieldProps("fullName")} />
            <FieldError message={formik.touched.fullName && formik.errors.fullName} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Password</label>
            <input type="password" placeholder="Password" className={inputClass("password")} {...formik.getFieldProps("password")} />
            <FieldError message={formik.touched.password && formik.errors.password} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Department</label>
            <div className="relative">
              <select className={`${inputClass("department")} appearance-none`} {...formik.getFieldProps("department")}>
                <option value="" disabled></option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <FieldError message={formik.touched.department && formik.errors.department} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Role</label>
            <div className="relative">
              <select className={`${inputClass("role")} appearance-none`} {...formik.getFieldProps("role")}>
                <option value="" disabled></option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <FieldError message={formik.touched.role && formik.errors.role} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => formik.resetForm()}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-colors duration-200 cursor-pointer">
              Clear
            </button>
            <button type="submit" disabled={formik.isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark text-white text-sm font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {formik.isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}



function EditUserModal({ user, onClose }) {
  const formik = useFormik({
    initialValues: {
      fullName:   user?.fullName   ?? "",
      password:   "",
      department: user?.department ?? "",
      role:       user?.role       ?? "",
    },
    validationSchema: editUserSchema,
    onSubmit: async (values, { setSubmitting }) => {
      
      console.log("TODO: PUT /users/updateUser/:id →", values);
      setSubmitting(false);
      onClose();
    },
  });

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-surface-input text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200
     ${formik.touched[field] && formik.errors[field]
       ? "border-red-400 focus:ring-red-200"
       : "border-surface-border focus:ring-primary/30"
     }`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-sm max-h-[90vh] overflow-y-auto">

        <div className="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-primary font-montserrat">Edit User</h2>
          <button onClick={onClose} className="absolute right-6 text-gray-400 hover:text-primary transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} noValidate className="px-6 py-6 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
            <input type="text" className={inputClass("fullName")} {...formik.getFieldProps("fullName")} />
            <FieldError message={formik.touched.fullName && formik.errors.fullName} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Password</label>
            <input type="password" className={inputClass("password")} {...formik.getFieldProps("password")} />
            <FieldError message={formik.touched.password && formik.errors.password} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Department</label>
            <div className="relative">
              <select className={`${inputClass("department")} appearance-none cursor-pointer`} {...formik.getFieldProps("department")}>
                <option value="" disabled></option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <FieldError message={formik.touched.department && formik.errors.department} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Role</label>
            <div className="relative">
              <select className={`${inputClass("role")} appearance-none cursor-pointer`} {...formik.getFieldProps("role")}>
                <option value="" disabled></option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <FieldError message={formik.touched.role && formik.errors.role} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => formik.resetForm()}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-colors duration-200 cursor-pointer">
              Clear
            </button>
            <button type="submit" disabled={formik.isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark text-white text-sm font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {formik.isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


function ActionDropdown({ activeTab, userStatus, onAction }) {
  const [open, setOpen]           = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, openUp: false });
  const btnRef   = useRef(null);
  const menuRef  = useRef(null);

  const items = getActionItems(activeTab, userStatus);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect        = btnRef.current.getBoundingClientRect();
      const menuHeight  = items.length * 42 + 8; 
      const spaceBelow  = window.innerHeight - rect.bottom;
      const openUp      = spaceBelow < menuHeight + 8;

      setDropdownPos({
        
        top:    openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left:   rect.right - 176, 
        openUp,
      });
    }
    setOpen((v) => !v);
  };

 
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200
                   hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreHorizontal size={18} className="text-gray-500" />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top:      dropdownPos.top,
            left:     dropdownPos.left,
            zIndex:   9999,
          }}
          className="w-44 bg-white rounded-xl shadow-card border border-gray-100 py-1 overflow-hidden"
        >
          {items.map(({ label, icon: Icon }) => {
            const isDanger = label === "Disable" || label === "Archive";
            return (
              <button
                key={label}
                onClick={() => { onAction(label); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer
                  ${isDanger
                    ? "text-accent hover:bg-red-50 hover:text-accent-dark"
                    : "text-gray-600 hover:bg-primary/10 hover:text-primary"
                  }`}
              >
                <Icon size={17} className={isDanger ? "text-accent" : "text-gray-400"} />
                {label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}



export default function UserManagement() {
  const location   = useLocation();

  const [users,             setUsers]             = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [activeTab,         setActiveTab]         = useState("All");
  const [searchQuery,       setSearchQuery]       = useState("");
  const [showUserDropdown,  setShowUserDropdown]  = useState(false);
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [showCreateModal,   setShowCreateModal]   = useState(false);
  const [viewUser,          setViewUser]          = useState(null);
  const [editUser,          setEditUser]          = useState(null);

  const userDropdownRef = useRef(null);

 
  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  useEffect(() => { setSearchQuery(""); }, [activeTab]);


  const filteredUsers = users
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

  const handleAction = async (action, user) => {
    switch (action) {
      case "View":
        setViewUser(user);
        break;
      case "Edit":
        setEditUser(user);
        break;
   
      case "Disable":
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: "Disabled" } : u));
        break;
      
      case "Enable":
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: "Enabled" } : u));
        break;
      
      case "Archive":
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: "Archived" } : u));
        break;
     
      case "Unarchive":
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: "Enabled" } : u));
        break;
      default:
        console.log("Unhandled action:", action, user);
    }
  };

  
  const columns = activeTab === "Archive" ? archiveColumns : allColumns;

  return (
    <div className="flex min-h-screen bg-surface-bg font-body">

    
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} />}
      {viewUser        && <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />}
      {editUser        && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

     
      <aside
        className={`fixed top-0 left-0 h-screen z-30 w-64 bg-bading border-r
          border-gray-100 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:w-72 lg:shrink-0`}
      >
        <div className="px-5 h-[73px] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={DGMCIcon} alt="DGMC Logo" className="w-9 h-9 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary font-montserrat leading-tight truncate">
                Divine Grace Medical Center
              </p>
              <p className="text-xs font-semibold text-accent font-montserrat leading-tight">
                Scheduling System
              </p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-primary">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 px-2">General</p>
          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, path, badge }) => {
              const isActive = location.pathname === path;
              return (
                <li key={label}>
                  <Link
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                      ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-gray-500 hover:bg-gray-100 hover:text-primary"}`}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      
      <div className="flex-1 flex flex-col min-w-0">

        
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-[73px]
          flex items-center justify-between gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Menu size={18} className="text-gray-500" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <Bell size={18} className="text-gray-500" />
            </button>

            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border
                  border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-primary leading-tight">Administrator</p>
                  <p className="text-xs text-gray-400 leading-tight">Admin</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-100 z-50 py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer">
                    Profile
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-red-50 transition-colors cursor-pointer">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

       
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-montserrat">
              User Management
            </h1>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search User"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200
                           bg-white text-sm text-primary placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                           transition-all duration-200"
              />
            </div>
          </div>

        
          <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2
                  transition-colors duration-200 -mb-px whitespace-nowrap
                  ${activeTab === label
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}

            <div className="ml-auto pb-1 shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl
                           bg-primary hover:bg-primary-light active:bg-primary-dark
                           text-white text-sm font-semibold
                           transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

      
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="bg-primary">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 sm:px-6 py-4 text-sm font-bold text-white text-center tracking-wide"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-sm font-medium">Loading users...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
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
                            activeTab={activeTab}
                            userStatus={user.status}
                            onAction={(action) => handleAction(action, user)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <Users size={40} className="text-gray-200" />
                          <p className="text-sm font-medium">
                            {activeTab === "Archive"
                              ? "No archived users"
                              : activeTab === "Disabled"
                              ? "No disabled users"
                              : "No users found"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          
            <div className="bg-primary px-6 py-3.5 flex items-center justify-center gap-4">
              <button
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
                disabled
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-white">Page 1 of 1</span>
              <button
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
                disabled
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}