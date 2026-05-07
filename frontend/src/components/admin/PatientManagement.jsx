import { useState, useEffect, useCallback, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserRoundPlus, Archive, Pencil, RefreshCw, ChevronDown, Eye } from "lucide-react";
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
  ConfirmDialog,
  readonlyInputClass,
} from "../ui";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All",      icon: UserRoundPlus },
  { label: "Archived", icon: Archive       },
];

const activeActions = [
  { label: "View",    icon: Eye,      danger: false },
  { label: "Edit",    icon: Pencil,   danger: false },
  { label: "Archive", icon: Archive,  danger: true  },
];
const archiveActions = [
  { label: "View",      icon: Eye,      danger: false },
  { label: "Unarchive", icon: RefreshCw               },
];

const SEX_OPTIONS = ["Male", "Female"];
const PAGE_SIZE   = 10;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// FIXED: reads firstName, middleName, lastName directly from DTO fields
// instead of parsing fullName — eliminates the multi-word first name bug
// where "Ralf Vincent" would bleed into middleName
function mapPatient(p) {
  return {
    id:          p.patientId,
    name:        p.fullName       ?? "",
    firstName:   p.firstName      ?? "",   // FIXED: direct from DTO
    middleName:  p.middleName     ?? "",   // FIXED: direct from DTO
    lastName:    p.lastName       ?? "",   // FIXED: direct from DTO
    address:     p.address        ?? "",
    contact:     p.contactNumber  ?? "",
    birthdate:   p.birthDate      ?? "",
    sex:         p.sex            ?? "",
    archived:    p.patientStatus === "Archived",
  };
}

// DELETED: parseFullName — no longer needed since DTO now sends name parts directly

function formatBirthdate(iso) {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const patientSchema = Yup.object({
  firstName:  Yup.string().trim().required("First name is required").max(100),
  middleName: Yup.string(),
  lastName:   Yup.string().trim().required("Last name is required").max(100),
  address:    Yup.string().trim().required("Address is required"),
  contact:    Yup.string()
    .required("Contact number is required")
    .matches(/^\d{11}$/, "Contact number must be exactly 11 digits"),
  birthdate:  Yup.string().required("Date of birth is required"),
  sex:        Yup.string().required("Sex is required"),
});

// ─── EDIT FORM ────────────────────────────────────────────────────────────────

function PatientForm({
  initialValues = { firstName: "", middleName: "", lastName: "", address: "", contact: "", birthdate: "", sex: "" },
  submitLabel   = "Save Changes",
  onSubmit,
  onClose,
}) {
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: patientSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch {
        // errors handled by caller
      } finally {
        setSubmitting(false);
      }
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Contact Number" error={formik.touched.contact && formik.errors.contact}>
          <input
            type="text"
            placeholder="09XXXXXXXXX"
            maxLength={11}
            className={ic("contact")}
            {...formik.getFieldProps("contact")}
          />
        </FormField>

        <FormField label="Sex" error={formik.touched.sex && formik.errors.sex}>
          <div className="relative">
            <select
              className={`${ic("sex")} appearance-none cursor-pointer`}
              {...formik.getFieldProps("sex")}
            >
              <option value="" disabled>Select</option>
              {SEX_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Date of Birth" error={formik.touched.birthdate && formik.errors.birthdate}>
          <input
            type="date"
            className={ic("birthdate")}
            {...formik.getFieldProps("birthdate")}
          />
        </FormField>

        <FormField label="Address" error={formik.touched.address && formik.errors.address}>
          <input
            type="text"
            placeholder="Address"
            className={ic("address")}
            {...formik.getFieldProps("address")}
          />
        </FormField>
      </div>

      <ModalFooter
        onClear={() => formik.resetForm({ values: initialValues })}
        submitLabel={submitLabel}
        submitting={formik.isSubmitting}
      />
    </form>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────

function ViewPatientModal({ patient, onClose }) {
  const ro = readonlyInputClass;

  return (
    <Modal title="View Patient Information" onClose={onClose} scrollable>
      <div className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">First Name</label>
            <input readOnly disabled value={patient.firstName || "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Middle Name</label>
            <input readOnly disabled value={patient.middleName || "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Last Name</label>
            <input readOnly disabled value={patient.lastName || "—"} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Contact Number</label>
            <input readOnly disabled value={patient.contact || "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
            <input readOnly disabled value={patient.sex || "—"} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
            <input readOnly disabled value={formatBirthdate(patient.birthdate)} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
            <input readOnly disabled value={patient.address || "—"} className={ro} />
          </div>
        </div>

      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PatientManagement() {
  const [activeTab,       setActiveTab]       = useState("All");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewPatient,     setViewPatient]     = useState(null);
  const [editPatient,     setEditPatient]     = useState(null);
  const [confirmAction,   setConfirmAction]   = useState(null);
  const [patients,        setPatients]        = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setError(null);
  }, [activeTab, debouncedSearch]);

  const patientStatusParam = useMemo(() => {
    if (debouncedSearch.trim()) return null;
    return activeTab === "Archived" ? "Archived" : null;
  }, [activeTab, debouncedSearch]);

  // ─── FETCH ──────────────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = debouncedSearch.trim();
      const url     = trimmed
        ? `/api/searchPatient/${encodeURIComponent(trimmed)}`
        : `/api/getPatients`;

      const params = {
        page: page - 1,
        size: PAGE_SIZE,
        sort: "lastName,asc",
        ...(patientStatusParam && { patientStatus: patientStatusParam }),
      };

      const res      = await axios.get(url, { headers: getAuthHeader(), params });
      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setPatients(content.map(mapPatient));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setError("Failed to load patients. Please try again.");
      setPatients([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, patientStatusParam, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const displayed = debouncedSearch.trim()
    ? patients.filter((p) => activeTab === "Archived" ? p.archived : !p.archived)
    : patients;

  // ─── ACTIONS ────────────────────────────────────────────────────────────────

  function handleAction(action, patient) {
    if (action === "Edit")      return setEditPatient(patient);
    if (action === "View")      return setViewPatient(patient);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   patient });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", patient });
  }

  async function applyConfirm() {
    const { type, patient } = confirmAction;
    const endpoint =
      type === "archive"
        ? `/api/archivePatient/${patient.id}`
        : `/api/restorePatient/${patient.id}`;

    try {
      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });
      toast(
        type === "archive"
          ? `"${patient.name}" has been archived.`
          : `"${patient.name}" has been restored.`,
        type === "archive" ? "warning" : "success"
      );
      await fetchPatients();
    } catch (err) {
      console.error(`Failed to ${type} patient:`, err);
      toast(`Failed to ${type} patient.`, "error");
      setError(`Failed to ${type} patient. Please try again.`);
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Patient Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Patient"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={["Full Name", "Contact", "Birthdate", "Address", "Sex", "Action"]}
        rows={displayed}
        loading={loading}
        emptyIcon={UserRoundPlus}
        emptyText={activeTab === "Archived" ? "No archived patients" : "No patients found"}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        renderRow={(patient) => (
          <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {patient.name || "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {patient.contact || "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {formatBirthdate(patient.birthdate)}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {patient.address || "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {patient.sex || "—"}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archived" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, patient)}
              />
            </td>
          </tr>
        )}
      />

      {/* ── VIEW MODAL ────────────────────────────────────────────────────── */}
      {viewPatient && (
        <ViewPatientModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
        />
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      {editPatient && (
        <Modal title="Edit Patient Information" onClose={() => setEditPatient(null)} scrollable>
          <PatientForm
            initialValues={{
              firstName:  editPatient.firstName,
              middleName: editPatient.middleName,
              lastName:   editPatient.lastName,
              address:    editPatient.address,
              contact:    editPatient.contact,
              birthdate:  editPatient.birthdate,
              sex:        editPatient.sex,
            }}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              await axios.put(
                `/api/updatePatient/${editPatient.id}`,
                {
                  firstName:     values.firstName.trim(),
                  middleName:    values.middleName?.trim() || null,
                  lastName:      values.lastName.trim(),
                  address:       values.address.trim(),
                  contactNumber: values.contact,
                  birthDate:     values.birthdate,
                  sex:           values.sex,
                },
                { headers: getAuthHeader() }
              );
              toast(`Patient "${values.lastName}, ${values.firstName}" has been updated.`);
              await fetchPatients();
            }}
            onClose={() => setEditPatient(null)}
          />
        </Modal>
      )}

      {/* ── CONFIRM DIALOG ────────────────────────────────────────────────── */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Patient?" : "Unarchive Patient?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.patient.name}" will be moved to the archive.`
              : `"${confirmAction.patient.name}" will be restored to active.`
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