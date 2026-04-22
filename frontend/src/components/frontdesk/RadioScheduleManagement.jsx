import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive, CheckCircle,
  Eye, UserCheck, UserX, Pencil, Trash2, RefreshCw, ChevronDown, Cross,
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
  ConfirmDialog,
} from "../ui";

import { LayoutDashboard, Cpu } from "lucide-react";

const radiologyNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/radiology/dashboard" },
  { label: "Schedules", icon: Calendar,        path: "/radiology/schedules" },
  { label: "Machine",   icon: Cpu,             path: "/radiology/machine"   },
  { label: "Medical Professionals", icon: Cross,         path: "/radiology/professionals" },
];

const TABS = [
  { label: "All",       icon: Calendar      },
  { label: "Confirmed", icon: CalendarCheck },
  { label: "Cancelled", icon: CalendarX     },
  { label: "Scheduled",   icon: Clock         },
  { label: "Archived",  icon: Archive       },
  { label: "Done",      icon: CheckCircle   },
];


const COLUMNS = ["Full Name", "Date", "Time", "Radiologist", "Modality", "Status", "Action"];


const RADIOLOGIST_OPTIONS = [];
const MODALITY_OPTIONS    = [];
const MACHINE_OPTIONS     = [];

function getActions(status) {
  switch (status?.toLowerCase()) {
    case "confirmed": return [{ label: "View", icon: Eye }, { label: "Done", icon: UserCheck }];
    case "cancelled": return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default:          return [
      { label: "View",    icon: Eye                  },
      { label: "Confirm", icon: UserCheck            },
      { label: "Cancel",  icon: UserX                },
      { label: "Edit",    icon: Pencil               },
      { label: "Archive", icon: Trash2, danger: true },
    ];
  }
}

const confirmMeta = {
  accept:    { title: "Confirm Schedule?",   msg: (n) => `"${n}" will be marked as confirmed.`,  label: "Confirm",   danger: false },
  reject:    { title: "Cancel Schedule?",    msg: (n) => `"${n}" will be marked as cancelled.`,  label: "Cancel",    danger: true  },
  archive:   { title: "Archive Schedule?",   msg: (n) => `"${n}" will be moved to the archive.`, label: "Archive",   danger: true  },
  unarchive: { title: "Unarchive Schedule?", msg: (n) => `"${n}" will be restored to pending.`,  label: "Unarchive", danger: false },
  done:      { title: "Mark as Done?",       msg: (n) => `"${n}" will be marked as done.`,       label: "Done",      danger: false },
};


const patientSchema = Yup.object({
  patientName:            Yup.string().required("Patient name is required"),
  dob:                    Yup.string().required("Date of birth is required"),
  contactNo:              Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, "Enter a valid contact number")
    .required("Contact number is required"),
  address:                Yup.string().required("Address is required"),
  radiologist:            Yup.string().required("Radiologist is required"),
  preparationExplainedBy: Yup.string().required("Preparation explained by is required"),
  modality:               Yup.string().required("Modality is required"),
  machine:                Yup.string().required("Machine is required"),
  procedure:              Yup.string().required("Procedure is required"),

  startDate:              Yup.string().required("Start date & time is required"),
  endDate:                Yup.string().required("End date & time is required"),
  remarks:                Yup.string(),
});


const BLANK_PATIENT = {
  patientName:            "",
  dob:                    "",
  contactNo:              "",
  address:                "",
  radiologist:            "",
  preparationExplainedBy: "",
  modality:               "",
  machine:                "",
  procedure:              "",
  startDate:              "", 
  endDate:                "", 
  remarks:                "",
};


function ModalityDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

 
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = value === "all" ? "All Modality" : value;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-card border border-gray-100 py-1 z-50">
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors
              ${value === "all" ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Modality
          </button>
          {options.map((m) => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${value === m ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


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

   
      <FormField label="Patient Name" error={formik.touched.patientName && formik.errors.patientName}>
        <input
          type="text"
          placeholder="Full Name"
          className={ic("patientName")}
          {...formik.getFieldProps("patientName")}
        />
      </FormField>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Date of Birth" error={formik.touched.dob && formik.errors.dob}>
          <input type="date" className={ic("dob")} {...formik.getFieldProps("dob")} />
        </FormField>
        <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
          <input type="tel" placeholder="63+9XXXXXXXXX" className={ic("contactNo")} {...formik.getFieldProps("contactNo")} />
        </FormField>
      </div>

    
      <FormField label="Address" error={formik.touched.address && formik.errors.address}>
        <input type="text" placeholder="City, Province" className={ic("address")} {...formik.getFieldProps("address")} />
      </FormField>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Radiologist" error={formik.touched.radiologist && formik.errors.radiologist}>
          <div className="relative">
            <select className={sic("radiologist")} {...formik.getFieldProps("radiologist")}>
              <option value="" disabled>Select Radiologist</option>
              {RADIOLOGIST_OPTIONS.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>

        <FormField label="Preparation Explained by" error={formik.touched.preparationExplainedBy && formik.errors.preparationExplainedBy}>
          <div className="relative">
            <select className={sic("preparationExplainedBy")} {...formik.getFieldProps("preparationExplainedBy")}>
              <option value="" disabled>Select</option>
              {RADIOLOGIST_OPTIONS.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>
      </div>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Modality" error={formik.touched.modality && formik.errors.modality}>
          <div className="relative">
            <select className={sic("modality")} {...formik.getFieldProps("modality")}>
              <option value="" disabled>Select Modality</option>
              {MODALITY_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>

        <FormField label="Machine" error={formik.touched.machine && formik.errors.machine}>
          <div className="relative">
            <select className={sic("machine")} {...formik.getFieldProps("machine")}>
              <option value="" disabled>Select Machine</option>
              {MACHINE_OPTIONS.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>
      </div>

  
      <FormField label="Procedure" error={formik.touched.procedure && formik.errors.procedure}>
        <input type="text" placeholder="e.g. Brain MRI" className={ic("procedure")} {...formik.getFieldProps("procedure")} />
      </FormField>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Start Date & Time" error={formik.touched.startDate && formik.errors.startDate}>
          <input type="datetime-local" className={ic("startDate")} {...formik.getFieldProps("startDate")} />
        </FormField>
        <FormField label="End Date & Time" error={formik.touched.endDate && formik.errors.endDate}>
          <input type="datetime-local" className={ic("endDate")} {...formik.getFieldProps("endDate")} />
        </FormField>
      </div>

    
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

 
  function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value.replace(" ", "T")).toLocaleString("en-US", {
      month: "2-digit", day: "2-digit", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  return (
    <Modal title="View Patient Form" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

       
        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Patient Name</label>
          <input readOnly value={patient.name ?? "—"} className={ro} />
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Date of Birth", value: patient.dob       },
            { label: "Contact No.",   value: patient.contactNo },
          ].map(({ label, value }) => (
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

      
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Radiologist",              value: patient.radiologist            },
            { label: "Preparation Explained by", value: patient.preparationExplainedBy },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>

   
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Modality", value: patient.modality },
            { label: "Machine",  value: patient.machine  },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Status",    value: patient.status    },
            { label: "Procedure", value: patient.procedure },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value ?? "—"} className={ro} />
            </div>
          ))}
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Start Date & Time", value: formatDateTime(patient.start_date) },
            { label: "End Date & Time",   value: formatDateTime(patient.end_date)   },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-primary mb-1.5">{label}</label>
              <input readOnly value={value} className={ro} />
            </div>
          ))}
        </div>

       
        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
          <textarea readOnly value={patient.remarks ?? "—"} rows={3} className={`${ro} resize-none`} />
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </Modal>
  );
}

export default function RadioScheduleManagement() {
  const [activeTab,      setActiveTab]      = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [showAdd,        setShowAdd]        = useState(false);
  const [viewPatient,    setViewPatient]    = useState(null);
  const [editPatient,    setEditPatient]    = useState(null);
  const [confirmAction,  setConfirmAction]  = useState(null);
  const [schedules,      setSchedules]      = useState([]);
  const [modalities,     setModalities]     = useState([]);
  const [loading,        setLoading]        = useState(false);

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
    const matchesTab =
      activeTab === "All"
        ? s.status?.toLowerCase() !== "archived"
        : s.status?.toLowerCase() === activeTab.toLowerCase();

    const matchesSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.radiologist?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModality =
      modalityFilter === "all" || s.modality === modalityFilter;

    return matchesTab && matchesSearch && matchesModality;
  });

  async function updateStatus(id, status) {
    try {
     
      await fetchSchedules();
    } catch (err) {
      console.error("Failed to update schedule status:", err);
    }
  }

  async function applyConfirm() {
    const { type, schedule } = confirmAction;
    const statusMap = {
      accept:    "Confirmed",
      reject:    "Cancelled",
      archive:   "Archived",
      unarchive: "Pending",
      done:      "Done",
    };
    await updateStatus(schedule.id, statusMap[type]);
    setConfirmAction(null);
  }

  function handleAction(action, s) {
    switch (action) {
      case "View":      return setViewPatient(s);
      case "Edit":      return setEditPatient(s);
      case "Confirm":   return setConfirmAction({ type: "accept",    schedule: s });
      case "Cancel":    return setConfirmAction({ type: "reject",    schedule: s });
      case "Archive":   return setConfirmAction({ type: "archive",   schedule: s });
      case "Unarchive": return setConfirmAction({ type: "unarchive", schedule: s });
      case "Done":      return setConfirmAction({ type: "done",      schedule: s });
    }
  }

 
  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso.replace(" ", "T")).toLocaleString("en-US", {
      month: "2-digit", day: "2-digit", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  return (
    <AdminLayout
      navItems={radiologyNavItems}
      pageTitle={
        <span className="flex items-center gap-3">
          Schedule Management
          <ModalityDropdown
            value={modalityFilter}
            onChange={setModalityFilter}
            options={modalities}
          />
        </span>
      }
      pageSubtitle="Radiology"
      userName="Radiology"
      userRole="Radiology Frontdesk"
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
         
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.start_date ? new Date(s.start_date.replace(" ", "T")).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.start_date && s.end_date
                ? `${new Date(s.start_date.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${new Date(s.end_date.replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.radiologist}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.modality}</td>
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.status)}`}>
              {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : "—"}
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

  
      {showAdd && (
        <Modal title="Add Patient Form" onClose={() => setShowAdd(false)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={BLANK_PATIENT}
            submitLabel="Submit"
            onSubmit={async (values) => {
             
              const payload = {
                patientName:            values.patientName,
                dob:                    values.dob,
                contactNo:              values.contactNo,
                address:                values.address,
                radiologist:            values.radiologist,
                preparationExplainedBy: values.preparationExplainedBy,
                modality:               values.modality,
                machine:                values.machine,
                procedure:              values.procedure,
                remarks:                values.remarks,
                start_date:             values.startDate + ":00", 
                end_date:               values.endDate   + ":00", 
              };

              console.log("Create payload:", payload);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

     
      {viewPatient && (
        <ViewPatientModal patient={viewPatient} onClose={() => setViewPatient(null)} />
      )}

     
      {editPatient && (
        <Modal title="Edit Patient Form" onClose={() => setEditPatient(null)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={{
              patientName:            editPatient.name                    ?? "",
              dob:                    editPatient.dob                     ?? "",
              contactNo:              editPatient.contactNo               ?? "",
              address:                editPatient.address                 ?? "",
              radiologist:            editPatient.radiologist             ?? "",
              preparationExplainedBy: editPatient.preparationExplainedBy ?? "",
              modality:               editPatient.modality                ?? "",
              machine:                editPatient.machine                 ?? "",
              procedure:              editPatient.procedure               ?? "",
              remarks:                editPatient.remarks                 ?? "",

            
              startDate: editPatient.start_date?.replace(" ", "T").slice(0, 16) ?? "",
              endDate:   editPatient.end_date?.replace(" ", "T").slice(0, 16)   ?? "",
            }}
            submitLabel="Edit"
            onSubmit={async (values) => {
              

              
              const payload = {
                patientName:            values.patientName,
                dob:                    values.dob,
                contactNo:              values.contactNo,
                address:                values.address,
                radiologist:            values.radiologist,
                preparationExplainedBy: values.preparationExplainedBy,
                modality:               values.modality,
                machine:                values.machine,
                procedure:              values.procedure,
                remarks:                values.remarks,
                start_date:             values.startDate + ":00", 
                end_date:               values.endDate   + ":00", 
              };

              console.log("Edit payload:", payload);
            }}
            onClose={() => setEditPatient(null)}
          />
        </Modal>
      )}

    
      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.schedule.name)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}