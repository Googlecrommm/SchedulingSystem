import { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Cross,
  Pencil,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
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

// Maps raw backend enum values to readable display labels.
// Backend enums: Available, On_Leave, Unavailable
function formatStatus(status) {
  if (status === "On_Leave")    return "On Leave";
  if (status === "Unavailable") return "Unavailable";
  if (status === "Available")   return "Available";
  return status ?? "—";
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
// Matches the UI: All | Available | Unavailable | On Leave
// tabStatus is the value sent to ?availabilityStatus= (null = no filter)

const TABS = [
  { label: "All",         icon: Cross,        tabStatus: null          },
  { label: "Available",   icon: CheckCircle,  tabStatus: "Available"   },
  { label: "Unavailable", icon: XCircle,      tabStatus: "Unavailable" },
  { label: "On Leave",    icon: Clock,        tabStatus: "On_Leave"    },
];

// ─── ACTION ITEMS ──────────────────────────────────────────────────────────────
// Action dropdown options depend on current status.
// - Available   → can go On Leave or Unavailable
// - On_Leave    → can go Available or Unavailable
// - Unavailable → can only go Available

function getDoctorActions(doctor) {
  const s = doctor.availabilityStatus;

  if (s === "Available") {
    return [
      { label: "Edit",        icon: Pencil      },
      { label: "On Leave",    icon: Clock       },
      { label: "Unavailable", icon: XCircle     },
    ];
  }
  if (s === "On_Leave") {
    return [
      { label: "Edit",        icon: Pencil      },
      { label: "Available",   icon: CheckCircle },
      { label: "Unavailable", icon: XCircle     },
    ];
  }
  if (s === "Unavailable") {
    return [
      { label: "Edit",        icon: Pencil      },
      { label: "Available",   icon: CheckCircle },
    ];
  }
  // Fallback
  return [{ label: "Edit", icon: Pencil }];
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const professionalSchema = Yup.object({
  name: Yup.string().required("Full name is required"),
  roleId:   Yup.number()
    .typeError("Role is required")
    .required("Role is required")
    .min(1, "Role is required"),
});

// ─── FORM ─────────────────────────────────────────────────────────────────────

function ProfessionalForm({
  initialName = "",
  initialRoleId   = "",
  submitLabel     = "Submit",
  onSubmit,
  onClose,
  roles,
  rolesLoading = false,
}) {
  const formik = useFormik({
    initialValues: { name: initialName, roleId: initialRoleId },
    validationSchema: professionalSchema,
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

      {/* Full Name */}
      <FormField label="Full Name" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>

      {/* Role dropdown */}
      <FormField label="Role" error={formik.touched.roleId && formik.errors.roleId}>
        <div className="relative">
          <select
            className={`${ic("roleId")} appearance-none cursor-pointer`}
            {...formik.getFieldProps("roleId")}
            disabled={rolesLoading}
          >
            <option value="">
              {rolesLoading ? "Loading roles\u2026" : "Select Role"}
            </option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.roleName}
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

export default function ProfessionalManagement() {
  const [activeTab,        setActiveTab]        = useState("All");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [showCreate,       setShowCreate]       = useState(false);
  const [editProfessional, setEditProfessional] = useState(null);
  const [confirmAction,    setConfirmAction]    = useState(null);
  const [professionals,    setProfessionals]    = useState([]);
  const [roles,            setRoles]            = useState([]);
  const [rolesLoading,     setRolesLoading]     = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [page,             setPage]             = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [serverResults,    setServerResults]    = useState(null);

  // Reset to page 1 whenever tab changes
  useEffect(() => {
    setPage(1);
    setSearchQuery("");
    setServerResults(null);
  }, [activeTab]);

  // ─── FETCH DOCTORS ──────────────────────────────────────────────────────────
  const activeTabStatus = TABS.find((t) => t.label === activeTab)?.tabStatus ?? null;

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page - 1, // Spring is 0-indexed
        size: 10,
        ...(activeTabStatus && { availabilityStatus: activeTabStatus }),
      };
      const res = await axios.get("/api/getDoctors", {
        headers: getAuthHeader(),
        params,
      });
      setProfessionals(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch professionals:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  // ─── FETCH ROLES (for dropdown in form) ────────────────────────────────────
  // Uses GET /api/doctorDropdown to get roles.
  // If you have a dedicated /api/roleDropdown endpoint, switch the URL below.
  useEffect(() => {
    async function fetchRoles() {
      setRolesLoading(true);
      try {
        const res = await axios.get("/api/roleDropdown", {
          headers: getAuthHeader(),
        });
        setRoles(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setRolesLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // ─── DEBOUNCED SERVER SEARCH ────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setServerResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          "/api/searchDoctor/" + encodeURIComponent(searchQuery.trim()),
          { headers: getAuthHeader(), params: { page: 0, size: 100 } }
        );
        setServerResults(res.data.content ?? []);
      } catch (err) {
        console.error("Search failed, using local filter:", err);
        setServerResults(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Server results shown as-is; otherwise use fetched page
  const displayed = serverResults ?? professionals;

  // ─── ACTION HANDLER ─────────────────────────────────────────────────────────
  function handleAction(action, professional) {
    if (action === "Edit")        return setEditProfessional(professional);
    if (action === "On Leave")    return setConfirmAction({ type: "leave",       professional });
    if (action === "Unavailable") return setConfirmAction({ type: "unavailable", professional });
    if (action === "Available")   return setConfirmAction({ type: "available",   professional });
  }

  // ─── CONFIRM ACTIONS ────────────────────────────────────────────────────────
  async function applyConfirm() {
    const { type, professional } = confirmAction;
    try {
      if (type === "leave") {
        await axios.put(
          "/api/leaveDoctor/" + professional.doctorId,
          {},
          { headers: getAuthHeader() }
        );
      } else if (type === "unavailable") {
        await axios.put(
          "/api/unavailableDoctor/" + professional.doctorId,
          {},
          { headers: getAuthHeader() }
        );
      } else if (type === "available") {
        await axios.put(
          "/api/availableDoctor/" + professional.doctorId,
          {},
          { headers: getAuthHeader() }
        );
      }
      await fetchProfessionals();
    } catch (err) {
      console.error("Failed to apply action (" + type + "):", err);
    } finally {
      setConfirmAction(null);
    }
  }

  const profName   = confirmAction ? confirmAction.professional.name : "";
  const confirmMeta = confirmAction && {
    leave: {
      title: "Mark as On Leave?",
      msg:   '"' + profName + '" will be marked as On Leave.',
      label: "Confirm",
      danger: false,
    },
    unavailable: {
      title: "Mark as Unavailable?",
      msg:   '"' + profName + '" will be marked as Unavailable.',
      label: "Confirm",
      danger: true,
    },
    available: {
      title: "Mark as Available?",
      msg:   '"' + profName + '" will be marked as Available.',
      label: "Confirm",
      danger: false,
    },
  }[confirmAction.type];

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      pageTitle="Medical Professionals Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Medical professionals"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Professionals"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Full Name", "Role", "Status", "Action"]}
        rows={displayed}
        loading={loading}
        emptyIcon={Cross}
        emptyText="No professionals found"
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        renderRow={(professional) => (
          <tr
            key={professional.doctorId}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {professional.name}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {professional.roleName ?? "—"}
            </td>
            
            <td className="px-6 py-4 text-center">
              {(() => {
                const s = professional.availabilityStatus;
                const label = formatStatus(s);

                const colorClass =
                  s === "Unavailable"
                    ? "text-red-500 font-bold"
                    : s === "On_Leave"
                    ? "text-yellow-400 font-bold"
                    : "text-green-500 font-bold";
                return (
                  <span className={`text-sm ${colorClass}`}>
                    {label}
                  </span>
                );
              })()}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getDoctorActions(professional)}
                onAction={(action) => handleAction(action, professional)}
              />
            </td>
          </tr>
        )}
      />

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal title="Add Professionals" onClose={() => setShowCreate(false)}>
          <ProfessionalForm
            submitLabel="Submit"
            roles={roles}
            rolesLoading={rolesLoading}
            onSubmit={async (values) => {
              await axios.post(
                "/api/createDoctor",
                {
                  name: values.name,
                  role: { roleId: Number(values.roleId) },
                },
                { headers: getAuthHeader() }
              );
              await fetchProfessionals();
              setShowCreate(false);
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editProfessional && (
        <Modal title="Edit Professional" onClose={() => setEditProfessional(null)}>
          <ProfessionalForm
            initialName={editProfessional.name}
            initialRoleId={
              roles.find((r) => r.roleName === editProfessional.roleName)?.roleId?.toString() ?? ""
            }
            submitLabel="Save Changes"
            roles={roles}
            rolesLoading={rolesLoading}
            onSubmit={async (values) => {
              await axios.put(
                "/api/updateDoctor/" + editProfessional.doctorId,
                {
                  name: values.name,
                  role: { roleId: Number(values.roleId) },
                },
                { headers: getAuthHeader() }
              );
              await fetchProfessionals();
              setEditProfessional(null);
            }}
            onClose={() => setEditProfessional(null)}
          />
        </Modal>
      )}

      {/* CONFIRM DIALOG */}
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