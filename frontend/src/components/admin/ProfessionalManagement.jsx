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
  ConfirmDialog,
} from "../ui";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// Backend DTO returns availabilityStatus as a DoctorStatus enum string:
// "Available" | "On_Leave" | "Unavailable"
function formatStatus(status) {
  if (status === "On_Leave")    return "On Leave";
  if (status === "Unavailable") return "Unavailable";
  if (status === "Available")   return "Available";
  return status ?? "—";
}

// Backend mapToDTO builds fullName as:
//   lastName + ", " + (middleName ?? "") + firstName   ← no space between middle and first
// e.g. "Jason, MendoOtto"
// We reformat it to: "lastName, firstName middleName" (middle name appended with a space).
// Steps:
//   1. Split on the first ", " → lastName | remainder
//   2. remainder = middleName + firstName (concatenated, no separator)
//      We can't reliably split them here, so we just add a space before the
//      first capital letter that follows a lowercase run (heuristic), OR
//      simply display as-is if no middle name was stored (no issue then).
// The safest display fix without knowing middleName length: keep the format
// but normalise spaces so it reads cleanly. The backend team should add a
// space in mapToDTO; until then this helper prevents run-together display.
function formatFullName(fullName) {
  if (!fullName) return "—";
  // fullName: "LastName, MiddleNameFirstName"  OR  "LastName, FirstName" (no middle)
  const commaIdx = fullName.indexOf(", ");
  if (commaIdx === -1) return fullName;

  const lastName  = fullName.slice(0, commaIdx);
  const remainder = fullName.slice(commaIdx + 2); // MiddleNameFirstName or just FirstName

  // Insert a space before every uppercase letter that is immediately preceded
  // by a lowercase letter — catches "MendoOtto" → "Mendo Otto".
  // This is a heuristic; it works for standard name capitalisation.
  const spaced = remainder.replace(/([a-z])([A-Z])/g, "$1 $2");

  return `${lastName}, ${spaced}`;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All",         icon: Cross,       tabStatus: null          },
  { label: "Available",   icon: CheckCircle, tabStatus: "Available"   },
  { label: "Unavailable", icon: XCircle,     tabStatus: "Unavailable" },
  { label: "On Leave",    icon: Clock,       tabStatus: "On_Leave"    },
];

// Actions are driven by the professional's current availabilityStatus.
// "Unavailable" can only go Available (no On Leave option).
function getDoctorActions(professional) {
  const s = professional.availabilityStatus;

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
  return [{ label: "Edit", icon: Pencil }];
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

// Backend Doctors model has separate firstName, middleName, lastName fields.
// middleName is optional (nullable in service).
const professionalSchema = Yup.object({
  firstName:  Yup.string().required("First name is required"),
  middleName: Yup.string(),                                      // optional
  lastName:   Yup.string().required("Last name is required"),
  roleId:     Yup.number()
    .typeError("Role is required")
    .required("Role is required")
    .min(1, "Role is required"),
});

// ─── FORM ─────────────────────────────────────────────────────────────────────

function ProfessionalForm({
  initialFirstName  = "",
  initialMiddleName = "",
  initialLastName   = "",
  initialRoleId     = "",
  submitLabel       = "Submit",
  onSubmit,
  onClose,
  roles,
  rolesLoading = false,
}) {
  const formik = useFormik({
    initialValues: {
      firstName:  initialFirstName,
      middleName: initialMiddleName,
      lastName:   initialLastName,
      roleId:     initialRoleId,
    },
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

      {/* First Name + Last Name on same row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="First Name" error={formik.touched.firstName && formik.errors.firstName}>
          <input
            type="text"
            placeholder="First Name"
            className={ic("firstName")}
            {...formik.getFieldProps("firstName")}
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
      </div>

      {/* Middle Name — full width, optional */}
      <FormField
        label="Middle Name"
        error={formik.touched.middleName && formik.errors.middleName}
      >
        <input
          type="text"
          placeholder="Middle Name (optional)"
          className={ic("middleName")}
          {...formik.getFieldProps("middleName")}
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
              {rolesLoading ? "Loading roles…" : "Select Role"}
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

  // Reset page and search when tab changes
  useEffect(() => {
    setPage(1);
    setSearchQuery("");
    setServerResults(null);
  }, [activeTab]);

  const activeTabStatus = TABS.find((t) => t.label === activeTab)?.tabStatus ?? null;

  // ─── FETCH PROFESSIONALS ────────────────────────────────────────────────────
  // GET /api/getDoctors
  // Response: Page<DoctorsResponseDTO>
  // DTO fields: doctorId, fullName, availabilityStatus (enum), roleName
  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page - 1,  // backend is 0-indexed
        size: 10,
        sort: "lastName,asc",
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
      setProfessionals([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  // ─── FETCH ROLES FOR DROPDOWN ───────────────────────────────────────────────
  // GET /api/roleDropdown → [{ roleId, roleName }]
  useEffect(() => {
    async function fetchRoles() {
      setRolesLoading(true);
      try {
        const res = await axios.get("/api/roleDropdown", { headers: getAuthHeader() });
        setRoles(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setRolesLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // ─── DEBOUNCED SEARCH ───────────────────────────────────────────────────────
  // GET /api/searchDoctor/{searchName}
  // Response: Page<DoctorsResponseDTO> — same DTO shape as getDoctors
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
        console.error("Search failed:", err);
        setServerResults(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const displayed = serverResults ?? professionals;

  // ─── ACTION HANDLER ─────────────────────────────────────────────────────────
  function handleAction(action, professional) {
    if (action === "Edit")        return setEditProfessional(professional);
    if (action === "On Leave")    return setConfirmAction({ type: "leave",       professional });
    if (action === "Unavailable") return setConfirmAction({ type: "unavailable", professional });
    if (action === "Available")   return setConfirmAction({ type: "available",   professional });
  }

  // ─── STATUS CHANGE CONFIRM ──────────────────────────────────────────────────
  // PUT /api/leaveDoctor/{doctorId}
  // PUT /api/unavailableDoctor/{doctorId}
  // PUT /api/availableDoctor/{doctorId}
  async function applyConfirm() {
    const { type, professional } = confirmAction;
    try {
      const endpointMap = {
        leave:       "/api/leaveDoctor/",
        unavailable: "/api/unavailableDoctor/",
        available:   "/api/availableDoctor/",
      };
      await axios.put(
        endpointMap[type] + professional.doctorId,
        {},
        { headers: getAuthHeader() }
      );
      await fetchProfessionals();
    } catch (err) {
      console.error("Failed to apply action (" + type + "):", err);
    } finally {
      setConfirmAction(null);
    }
  }

  // fullName is what the backend DTO returns — run through formatFullName for display
  const profFullName = formatFullName(confirmAction?.professional?.fullName ?? "");

  const confirmMeta = confirmAction && {
    leave: {
      title: "Mark as On Leave?",
      msg:   `"${profFullName}" will be marked as On Leave.`,
      label: "Confirm",
      danger: false,
    },
    unavailable: {
      title: "Mark as Unavailable?",
      msg:   `"${profFullName}" will be marked as Unavailable.`,
      label: "Confirm",
      danger: true,
    },
    available: {
      title: "Mark as Available?",
      msg:   `"${profFullName}" will be marked as Available.`,
      label: "Confirm",
      danger: false,
    },
  }[confirmAction.type];

  // ─── EDIT: parse fullName back into parts for the form ──────────────────────
  // Backend mapToDTO builds fullName as: "lastName, middleNamefirstName"
  // We store the raw DTO on editProfessional so we can pre-fill separately.
  function getEditInitialValues(p) {
    // fullName format from service: lastName + ", " + (middleName ?? "") + firstName
    // We split on the first ", " to get lastName vs the rest
    const fullName = p.fullName ?? "";
    const commaIdx = fullName.indexOf(", ");
    if (commaIdx === -1) return { firstName: fullName, middleName: "", lastName: "" };

    const lastName  = fullName.slice(0, commaIdx);
    const remainder = fullName.slice(commaIdx + 2); // everything after ", "

    // remainder = middleName + firstName (no separator — backend just concatenates)
    // Since we can't reliably split that without knowing middleName length,
    // we put the entire remainder in firstName and leave middleName blank.
    // The user can correct middleName in the edit form if needed.
    return { firstName: remainder, middleName: "", lastName };
  }

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
            {/* DTO field: fullName — run through formatFullName to insert
                the missing space between middleName and firstName */}
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {formatFullName(professional.fullName)}
            </td>

            {/* DTO field: roleName */}
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {professional.roleName ?? "—"}
            </td>

            {/* DTO field: availabilityStatus (DoctorStatus enum) */}
            <td className="px-6 py-4 text-center">
              {(() => {
                const s     = professional.availabilityStatus;
                const label = formatStatus(s);
                const colorClass =
                  s === "Unavailable" ? "text-red-500 font-bold"
                  : s === "On_Leave"  ? "text-yellow-400 font-bold"
                  :                     "text-green-500 font-bold";
                return <span className={`text-sm ${colorClass}`}>{label}</span>;
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

      {/* ── CREATE MODAL ────────────────────────────────────────────────────── */}
      {/* POST /api/createDoctor
          Body: { firstName, middleName, lastName, role: { roleId } } */}
      {showCreate && (
        <Modal title="Add Professional" onClose={() => setShowCreate(false)}>
          <ProfessionalForm
            submitLabel="Submit"
            roles={roles}
            rolesLoading={rolesLoading}
            onSubmit={async (values) => {
              await axios.post(
                "/api/createDoctor",
                {
                  firstName:  values.firstName,
                  middleName: values.middleName || null, // nullable in backend
                  lastName:   values.lastName,
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

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {/* PUT /api/updateDoctor/{doctorId}
          Body: { firstName, middleName, lastName, role: { roleId } } */}
      {editProfessional && (
        <Modal title="Edit Professional" onClose={() => setEditProfessional(null)}>
          <ProfessionalForm
            {...getEditInitialValues(editProfessional)}
            initialRoleId={
              roles.find((r) => r.roleName === editProfessional.roleName)
                ?.roleId?.toString() ?? ""
            }
            submitLabel="Save Changes"
            roles={roles}
            rolesLoading={rolesLoading}
            onSubmit={async (values) => {
              await axios.put(
                "/api/updateDoctor/" + editProfessional.doctorId,
                {
                  firstName:  values.firstName,
                  middleName: values.middleName || null,
                  lastName:   values.lastName,
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

      {/* ── CONFIRM DIALOG ──────────────────────────────────────────────────── */}
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