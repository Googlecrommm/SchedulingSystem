import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, Eye, UserCheck, UserX, UserCog, Trash2, RefreshCw, ChevronDown,
} from "lucide-react";

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
  scheduleStatusColor,
  frontdeskNavItems,
} from "../ui";

const TABS = [
  { label: "All",       icon: Calendar },
  { label: "Confirmed", icon: Calendar },
  { label: "Canceled",  icon: Calendar },
  { label: "Pending",   icon: Calendar },
  { label: "Archived",  icon: Calendar },
  { label: "Done",      icon: Calendar },
];

const COLUMNS = ["Name", "Date", "Time", "Therapist", "Status", "Action"];

const timeOptions = [];
for (let h = 0; h <= 23; h++) {
  ["00", "30"].forEach((m) => {
    const period = h < 12 ? "AM" : "PM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    timeOptions.push(`${hour12}:${m} ${period}`);
  });
}

function getActions(status) {
  switch (status?.toLowerCase()) {
    case "confirmed": return [{ label: "View", icon: Eye }, { label: "Done", icon: UserCheck }];
    case "canceled":  return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default:          return [
      { label: "View",    icon: Eye       },
      { label: "Accept",  icon: UserCheck },
      { label: "Reject",  icon: UserX,    danger: true },
      { label: "Edit",    icon: UserCog   },
      { label: "Archive", icon: Trash2,   danger: true },
    ];
  }
}

const patientSchema = Yup.object({
  patientName: Yup.string().required("Patient name is required"),
  dob:         Yup.string().required("Date of birth is required"),
  sex:         Yup.string().required("Sex is required"),
  contactNo:   Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, "Enter a valid contact number")
    .required("Contact number is required"),
  address:     Yup.string().required("Address is required"),
  occupation:  Yup.string().required("Occupation is required"),
  date:        Yup.string().required("Date is required"),
  startTime:   Yup.string().required("Start time is required"),
  endTime:     Yup.string().required("End time is required"),
  therapist:   Yup.string().required("Therapist is required"),
  remarks:     Yup.string(),
});

function PatientForm({ initialValues, submitLabel, onSubmit, onClose }) {
  const formik = useFormik({
    initialValues,
    validationSchema: patientSchema,
    onSubmit: (values, { setSubmitting }) => {
      onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic  = useInputClass(formik);
  const sic = (field) => `${ic(field)} appearance-none cursor-pointer`;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Patient Name" error={formik.touched.patientName && formik.errors.patientName}>
          <input type="text" placeholder="Full Name" className={ic("patientName")} {...formik.getFieldProps("patientName")} />
        </FormField>
        <FormField label="Date of Birth" error={formik.touched.dob && formik.errors.dob}>
          <input type="date" className={ic("dob")} {...formik.getFieldProps("dob")} />
        </FormField>
        <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
          <input type="tel" placeholder="+639XXXXXXXXX" className={ic("contactNo")} {...formik.getFieldProps("contactNo")} />
        </FormField>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Sex" error={formik.touched.sex && formik.errors.sex}>
          <div className="relative">
            <select className={sic("sex")} {...formik.getFieldProps("sex")}>
              <option value="" disabled>Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>
        <FormField label="Occupation" error={formik.touched.occupation && formik.errors.occupation}>
          <input type="text" placeholder="Occupation" className={ic("occupation")} {...formik.getFieldProps("occupation")} />
        </FormField>
      </div>

      {}
      <FormField label="Address" error={formik.touched.address && formik.errors.address}>
        <input type="text" placeholder="City, Province" className={ic("address")} {...formik.getFieldProps("address")} />
      </FormField>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Date" error={formik.touched.date && formik.errors.date}>
          <input type="date" className={ic("date")} {...formik.getFieldProps("date")} />
        </FormField>
        <FormField label="Therapist" error={formik.touched.therapist && formik.errors.therapist}>
          <input
            type="text"
            placeholder="Therapist name"
            className={ic("therapist")}
            {...formik.getFieldProps("therapist")}
          />
        </FormField>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
          <div className="relative">
            <select className={sic("startTime")} {...formik.getFieldProps("startTime")}>
              <option value="" disabled>Select</option>
              {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>
        <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
          <div className="relative">
            <select className={sic("endTime")} {...formik.getFieldProps("endTime")}>
              <option value="" disabled>Select</option>
              {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>
      </div>

      {}
      <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
        <textarea
          rows={3}
          placeholder="Optional notes…"
          className={`${ic("remarks")} resize-none`}
          {...formik.getFieldProps("remarks")}
        />
      </FormField>

      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}

function ViewPatientModal({ patient, onClose }) {
  const ro = readonlyInputClass;
  return (
    <Modal title="View Patient Form" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Patient Name", value: patient.name      },
            { label: "Date of Birth",value: patient.dob       },
            { label: "Contact No.",  value: patient.contactNo },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ label: "Sex", value: patient.sex }, { label: "Occupation", value: patient.occupation }].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
          <input readOnly value={patient.address ?? "—"} className={ro} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Date",      value: patient.date      },
            { label: "Therapist", value: patient.therapist },
            { label: "Status",    value: patient.status    },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ label: "Start Time", value: patient.startTime }, { label: "End Time", value: patient.endTime }].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
          <textarea readOnly rows={3} value={patient.remarks ?? ""} placeholder="No remarks" className={`${ro} resize-none`} />
        </div>
        <ModalFooter onClose={onClose} />
      </div>
    </Modal>
  );
}

const BLANK_PATIENT = {
  patientName: "", dob: "", sex: "", contactNo: "",
  address: "", occupation: "", date: "", startTime: "",
  endTime: "", therapist: "", remarks: "",
};

export default function ScheduleManagement() {
  const [activeTab,   setActiveTab]   = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd,     setShowAdd]     = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [schedules,   setSchedules]   = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    try {
      
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = schedules.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.therapist.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "All") return s.status.toLowerCase() !== "archived" && matchesSearch;
    return s.status.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
  });

  async function updateStatus(id, status) {
    try {
      
    } catch (err) {
      console.error("Failed to update schedule status:", err);
    }
  }

  function handleAction(action, s) {
    switch (action) {
      case "View":      return setViewPatient(s);
      case "Edit":      return setEditPatient(s);
      case "Accept":    return updateStatus(s.id, "confirmed");
      case "Reject":    return updateStatus(s.id, "canceled");
      case "Archive":   return updateStatus(s.id, "archived");
      case "Unarchive": return updateStatus(s.id, "pending");
      case "Done":      return updateStatus(s.id, "done");
    }
  }

  return (
    <AdminLayout
      navItems={frontdeskNavItems}
      pageTitle="Schedule Management"
      pageSubtitle="Rehabilitation"
      userName="Rehab"
      userRole="Rehabilitation Frontdesk"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Patient"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Patient"
        onAdd={() => setShowAdd(true)}
      />

      <DataTable
        columns={COLUMNS}
        rows={filtered}
        loading={loading}
        emptyIcon={Calendar}
        emptyText="No schedules found"
        renderRow={(s) => (
          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.date}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.startTime} – {s.endTime}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.therapist}</td>
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.status)}`}>
              {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(s.status)}
                onAction={(action) => handleAction(action, s)}
              />
            </td>
          </tr>
        )}
      />

      {}
      {showAdd && (
        <Modal title="Add Patient Form" onClose={() => setShowAdd(false)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={BLANK_PATIENT}
            submitLabel="Submit"
            onSubmit={async (values) => {
              
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {}
      {viewPatient && <ViewPatientModal patient={viewPatient} onClose={() => setViewPatient(null)} />}

      {}
      {editPatient && (
        <Modal title="Edit Patient Form" onClose={() => setEditPatient(null)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={{
              patientName: editPatient.name       ?? "",
              dob:         editPatient.dob        ?? "",
              sex:         editPatient.sex        ?? "",
              contactNo:   editPatient.contactNo  ?? "",
              address:     editPatient.address    ?? "",
              occupation:  editPatient.occupation ?? "",
              date:        editPatient.date       ?? "",
              startTime:   editPatient.startTime  ?? "",
              endTime:     editPatient.endTime    ?? "",
              therapist:   editPatient.therapist  ?? "",
              remarks:     editPatient.remarks    ?? "",
            }}
            submitLabel="Save"
            onSubmit={async (values) => {
              
            }}
            onClose={() => setEditPatient(null)}
          />
        </Modal>
      )}
    </AdminLayout>
  );
}
