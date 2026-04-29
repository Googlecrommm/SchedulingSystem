import { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserRoundPlus, Archive, Pencil, RefreshCw, ChevronDown, Eye } from "lucide-react";
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
  readonlyInputClass,
} from "../ui";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All",      icon: UserRoundPlus },
  { label: "Archived", icon: Archive       },
];

// No create endpoint exists in PatientController — Add button is intentionally absent.
const activeActions  = [
  { label: "Edit",      icon: Pencil                  },
  { label: "Archive",   icon: Archive,  danger: true  },
];
const archiveActions = [
  { label: "Unarchive", icon: RefreshCw               },
];

// Must match the backend Sex enum names exactly.
const SEX_OPTIONS = ["Male", "Female"];

const PAGE_SIZE = 10;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// Maps PatientResponseDTO → flat local object.
// DTO fields: patientId, name, address, contactNumber, birthDate, sex (Sex enum), patientStatus
function mapPatient(p) {
  return {
    id:        p.patientId,
    name:      p.name            ?? "",
    address:   p.address         ?? "",
    contact:   p.contactNumber   ?? "",   // DTO: contactNumber
    birthdate: p.birthDate       ?? "",   // DTO: birthDate (LocalDate → "YYYY-MM-DD")
    sex:       p.sex             ?? "",   // DTO: sex (Sex enum → string)
    archived:  p.patientStatus === "Archived",  // DTO: patientStatus
  };
}

// Formats ISO date string "YYYY-MM-DD" for display.
function formatBirthdate(iso) {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  });
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
// Mirrors PatientService validation rules:
//   - name: not blank, max 100
//   - contactNumber: not blank, exactly 11 digits (service rejects < 11)
//   - address, birthDate, sex: required / not null

const patientSchema = Yup.object({
  name:      Yup.string()
    .required("Full name is required")
    .max(100, "Name must be at most 100 characters"),
  address:   Yup.string().required("Address is required"),
  contact:   Yup.string()
    .required("Contact number is required")
    .matches(/^\d{11}$/, "Contact number must be exactly 11 digits"),
  birthdate: Yup.string().required("Date of birth is required"),
  sex:       Yup.string().required("Sex is required"),
});

// ─── EDIT FORM ────────────────────────────────────────────────────────────────
// No create form — PatientController has no POST endpoint.
// Edit sends: { name, address, contactNumber, birthDate, sex }
// matching Patients model setters used in PatientService.updatePatient().

function PatientForm({
  initialValues = { name: "", address: "", contact: "", birthdate: "", sex: "" },
  submitLabel   = "Save Changes",
  onSubmit,
  onClose,
}) {
  const formik = useFormik({
    initialValues,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Full Name" error={formik.touched.name && formik.errors.name}>
          <input
            type="text"
            placeholder="Full Name"
            className={ic("name")}
            {...formik.getFieldProps("name")}
          />
        </FormField>

        <FormField label="Contact Number" error={formik.touched.contact && formik.errors.contact}>
          <input
            type="text"
            placeholder="09XXXXXXXXX"
            maxLength={11}
            className={ic("contact")}
            {...formik.getFieldProps("contact")}
          />
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

      <FormField label="Address" error={formik.touched.address && formik.errors.address}>
        <input
          type="text"
          placeholder="Address"
          className={ic("address")}
          {...formik.getFieldProps("address")}
        />
      </FormField>

      <ModalFooter
        onClear={() => formik.resetForm()}
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
    <Modal title="View Patient" onClose={onClose} maxWidth="max-w-lg" scrollable>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
            <input readOnly value={patient.name || "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Contact Number</label>
            <input readOnly value={patient.contact || "—"} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
            <input readOnly value={formatBirthdate(patient.birthdate)} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
            <input readOnly value={patient.sex || "—"} className={ro} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
          <input readOnly value={patient.address || "—"} className={ro} />
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PatientManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [viewPatient,   setViewPatient]   = useState(null);
  const [editPatient,   setEditPatient]   = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [patients,      setPatients]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);

  // Reset to page 1 whenever tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchPatients();
  }, [activeTab, searchQuery, page]);

  // ─── FETCH ──────────────────────────────────────────────────────────────────
  // GET /api/getPatients?patientStatus=Active|Archived&page=N&size=10&sort=name,asc
  // GET /api/searchPatient/{name}?page=N&size=10
  // Response: Page<PatientResponseDTO>
  // DTO: { patientId, name, address, contactNumber, birthDate, sex, patientStatus }

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `/api/searchPatient/${encodeURIComponent(searchQuery.trim())}`
        : `/api/getPatients`;

      const params = {
        page: page - 1,   // backend is 0-indexed (Spring Pageable)
        size: PAGE_SIZE,
        sort: "name,asc",
        // Only pass patientStatus on the base fetch, not on search.
        // Search endpoint (searchByNameContaining) searches across all statuses.
        ...(searchQuery.trim() ? {} : {
          patientStatus: activeTab === "Archived" ? "Archived" : "Active",
        }),
      };

      const res      = await axios.get(url, { headers: getAuthHeader(), params });
      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setPatients(content.map(mapPatient));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setPatients([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  // When searching, the backend returns all statuses — filter client-side by tab.
  const displayed = searchQuery.trim()
    ? patients.filter((p) => activeTab === "Archived" ? p.archived : !p.archived)
    : patients;

  // ─── ACTIONS ─────────────────────────────────────────────────────────────────

  function handleAction(action, patient) {
    if (action === "Edit")      return setEditPatient(patient);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   patient });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", patient });
  }

  // PUT /api/archivePatient/{patientId}
  // PUT /api/restorePatient/{patientId}
  async function applyConfirm() {
    const { type, patient } = confirmAction;
    try {
      const endpoint =
        type === "archive"
          ? `/api/archivePatient/${patient.id}`
          : `/api/restorePatient/${patient.id}`;

      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });

      await fetchPatients();
    } catch (err) {
      console.error(`Failed to ${type} patient:`, err);
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
      {/* No addLabel/onAdd — no create endpoint in PatientController */}
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");  // clear search when switching tabs
        }}
      />

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

      {/* ── VIEW MODAL ─────────────────────────────────────────────────────── */}
      {viewPatient && (
        <ViewPatientModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
        />
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
      {/* PUT /api/updatePatient/{patientId}
          Body (Patients model fields): { name, address, contactNumber, birthDate, sex }
          - sex must match Sex enum name: "Male" | "Female"
          - birthDate: "YYYY-MM-DD" string (Spring deserializes LocalDate from ISO) */}
      {editPatient && (
        <Modal title="Edit Patient Information" onClose={() => setEditPatient(null)} scrollable>
          <PatientForm
            initialValues={{
              name:      editPatient.name,
              address:   editPatient.address,
              contact:   editPatient.contact,
              birthdate: editPatient.birthdate,
              sex:       editPatient.sex,
            }}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              await axios.put(
                `/api/updatePatient/${editPatient.id}`,
                {
                  name:          values.name,
                  address:       values.address,
                  contactNumber: values.contact,   // Patients model field: contactNumber
                  birthDate:     values.birthdate, // Patients model field: birthDate (LocalDate)
                  sex:           values.sex,       // Patients model field: sex (Sex enum)
                },
                { headers: getAuthHeader() }
              );
              await fetchPatients();
            }}
            onClose={() => setEditPatient(null)}
          />
        </Modal>
      )}

      {/* ── CONFIRM DIALOG ─────────────────────────────────────────────────── */}
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