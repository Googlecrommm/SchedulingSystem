import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive, CheckCircle,
  Eye, UserCheck, UserX, Pencil, Trash2, RefreshCw, ChevronDown, Cross, Search, X,
} from "lucide-react";
import { LayoutDashboard, Cpu } from "lucide-react";

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



const radiologyNavItems = [
  { label: "Dashboard",             icon: LayoutDashboard, path: "/radiology/dashboard"    },
  { label: "Schedules",             icon: Calendar,        path: "/radiology/schedules"    },
  { label: "Machine",               icon: Cpu,             path: "/radiology/machine"      },
  { label: "Medical Professionals", icon: Cross,           path: "/radiology/professionals" },
];



const TABS = [
  { label: "All",       icon: Calendar      },
  { label: "Confirmed", icon: CalendarCheck },
  { label: "Cancelled", icon: CalendarX     },
  { label: "Scheduled", icon: Clock         },
  { label: "Archived",  icon: Archive       },
  { label: "Done",      icon: CheckCircle   },
];

const COLUMNS = ["Full Name", "Date", "Time", "Radiologist", "Modality", "Status", "Action"];



const confirmMeta = {
  accept:    { title: "Confirm Schedule?",   msg: (n) => `"${n}" will be marked as confirmed.`,  label: "Confirm",   danger: false },
  reject:    { title: "Cancel Schedule?",    msg: (n) => `"${n}" will be marked as cancelled.`,  label: "Cancel",    danger: true  },
  archive:   { title: "Archive Schedule?",   msg: (n) => `"${n}" will be moved to the archive.`, label: "Archive",   danger: true  },
  unarchive: { title: "Unarchive Schedule?", msg: (n) => `"${n}" will be restored to pending.`,  label: "Unarchive", danger: false },
  done:      { title: "Mark as Done?",       msg: (n) => `"${n}" will be marked as done.`,       label: "Done",      danger: false },
};



const BLANK_PATIENT = {
  radiologist:            "",
  procedure:              "",
  modality:               "",
  machine:                "",
  preparationExplainedBy: "",
  date:                   "",
  startTime:              "",
  endTime:                "",
  patientName:            "",
  patientId:              "",   
  sex:                    "",
  dob:                    "",
  contactNo:              "",

  hospPlan:               "",
  hospCaseType:           "",
  remarks:                "",
};



function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}


function buildDatetime(date, time) {
  if (!date || !time) return "";
  return `${date} ${time}:00`;
}


function splitDatetime(datetime) {
  if (!datetime) return { date: "", time: "" };
  const [datePart, timePart] = datetime.replace("T", " ").split(" ");
  return { date: datePart ?? "", time: timePart?.slice(0, 5) ?? "" };
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleDateString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function getActions(status) {
  switch (status?.toLowerCase()) {
    case "confirmed": return [{ label: "View", icon: Eye }, { label: "Done", icon: UserCheck }];
    case "cancelled": return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default: return [
      { label: "View",    icon: Eye                   },
      { label: "Confirm", icon: UserCheck             },
      { label: "Cancel",  icon: UserX                 },
      { label: "Edit",    icon: Pencil                },
      { label: "Archive", icon: Trash2, danger: true  },
    ];
  }
}




function PatientSearchableInput({ formik, hasError }) {
  const [query,        setQuery]        = useState(formik.values.patientName ?? "");
  const [results,      setResults]      = useState([]);
  const [open,         setOpen]         = useState(false);
  const [searching,    setSearching]    = useState(false);
  const [isExisting,   setIsExisting]   = useState(!!formik.values.patientId);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setQuery(formik.values.patientName ?? "");
    setIsExisting(!!formik.values.patientId);
  }, [formik.values.patientName, formik.values.patientId]);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setIsExisting(false);

    formik.setFieldValue("patientName", val);
    formik.setFieldValue("patientId", "");

    if (!val.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/searchPatient/${encodeURIComponent(val.trim())}`,
          { headers: getAuthHeader() }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.content ?? [];
        setResults(list);
        setOpen(list.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  function handleSelect(patient) {
    setQuery(patient.patientName ?? patient.name ?? "");
    setIsExisting(true);
    setOpen(false);
    setResults([]);

    formik.setFieldValue("patientName", patient.patientName ?? patient.name ?? "");
    formik.setFieldValue("patientId",   patient.patientId ?? "");
    formik.setFieldValue("sex",         patient.sex        ?? "");
    formik.setFieldValue("dob",         patient.dob        ?? "");
    formik.setFieldValue("contactNo",   patient.contactNo  ?? "");

  }

  function handleClear() {
    setQuery("");
    setIsExisting(false);
    setResults([]);
    setOpen(false);
    formik.setFieldValue("patientName", "");
    formik.setFieldValue("patientId",   "");
    formik.setFieldValue("sex",         "");
    formik.setFieldValue("dob",         "");
    formik.setFieldValue("contactNo",   "");

  }

  const borderClass = hasError
    ? "border-red-400 focus:ring-red-200"
    : isExisting
    ? "border-green-400 focus:ring-green-200"
    : "border-surface-border focus:ring-primary/30";

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search size={15} />
        </span>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search or type new patient name…"
          className={`w-full py-2.5 pl-9 pr-9 rounded-xl border bg-surface-input
            text-primary placeholder-gray-400 text-sm
            focus:outline-none focus:ring-2 focus:border-primary
            transition-all duration-200 ${borderClass}`}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {searching ? (
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          ) : null}
        </span>
      </div>

      {isExisting && (
        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
          <CheckCircle size={12} />
          Existing patient — info auto-filled
        </p>
      )}

      {query && !isExisting && !searching && (
        <p className="text-xs text-blue-500 font-medium mt-1">
          New patient — fill in the details below
        </p>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-card border border-gray-100 py-1 max-h-52 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.patientId}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <span className="font-medium">{p.patientName ?? p.name}</span>
              {p.dob && (
                <span className="ml-2 text-xs text-gray-400">DOB: {p.dob}</span>
              )}
              {p.contactNo && (
                <span className="ml-2 text-xs text-gray-400">{p.contactNo}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



const patientSchema = Yup.object({
  radiologist:            Yup.string().required("Radiologist is required"),
  procedure:              Yup.string().required("Procedure is required"),
  modality:               Yup.string().required("Modality is required"),
  machine:                Yup.string().required("Machine is required"),
  preparationExplainedBy: Yup.string().required("Preparation explained by is required"),
  date:                   Yup.string().required("Date is required"),
  startTime:              Yup.string().required("Start time is required"),
  endTime:                Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  patientName:            Yup.string().required("Patient name is required"),
  sex:                    Yup.string().required("Sex is required"),
  dob:                    Yup.string().required("Date of birth is required"),
  contactNo:              Yup.string()
    .matches(/^\+?[0-9]{7,15}$/, "Enter a valid contact number")
    .required("Contact number is required"),

  hospPlan:               Yup.string(),
  hospCaseType:           Yup.string(),
  remarks:                Yup.string(),
});



function SelectField({ formik, field, placeholder, options, keyProp, valueProp, labelProp, disabled }) {
  const ic = useInputClass(formik);
  return (
    <div className="relative">
      <select
        className={`${ic(field)} appearance-none cursor-pointer`}
        {...formik.getFieldProps(field)}
        disabled={disabled}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o[keyProp]} value={o[valueProp]}>{o[labelProp]}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}


function PatientForm({
  initialValues,
  submitLabel,
  onSubmit,
  onClose,
  radiologists,
  modalities,
  machines,
  hospPlans,
  hospCaseTypes,
}) {
  const formik = useFormik({
    initialValues,
    validationSchema: patientSchema,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Radiologist" error={formik.touched.radiologist && formik.errors.radiologist}>
          <SelectField
            formik={formik}
            field="radiologist"
            placeholder="Select Radiologist"
            options={radiologists}
            keyProp="doctorId"
            valueProp="doctorId"
            labelProp="name"
          />
        </FormField>

        <FormField label="Procedure" error={formik.touched.procedure && formik.errors.procedure}>
          <input
            type="text"
            placeholder="e.g. Brain MRI"
            className={ic("procedure")}
            {...formik.getFieldProps("procedure")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Modality" error={formik.touched.modality && formik.errors.modality}>
          <SelectField
            formik={formik}
            field="modality"
            placeholder="Select Modality"
            options={modalities}
            keyProp="modalityId"
            valueProp="modalityId"
            labelProp="modalityName"
          />
        </FormField>

        <FormField label="Machine" error={formik.touched.machine && formik.errors.machine}>
          <SelectField
            formik={formik}
            field="machine"
            placeholder="Select Machine"
            options={machines}
            keyProp="machineId"
            valueProp="machineId"
            labelProp="machineName"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Preparation Explained by" error={formik.touched.preparationExplainedBy && formik.errors.preparationExplainedBy}>
          <SelectField
            formik={formik}
            field="preparationExplainedBy"
            placeholder="Select Radiologist"
            options={radiologists}
            keyProp="doctorId"
            valueProp="doctorId"
            labelProp="name"
          />
        </FormField>

        <FormField label="Date" error={formik.touched.date && formik.errors.date}>
          <input
            type="date"
            className={ic("date")}
            {...formik.getFieldProps("date")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
          <input
            type="time"
            className={ic("startTime")}
            {...formik.getFieldProps("startTime")}
          />
        </FormField>

        <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
          <input
            type="time"
            className={ic("endTime")}
            {...formik.getFieldProps("endTime")}
          />
        </FormField>
      </div>

      <FormField label="Patient Name" error={formik.touched.patientName && formik.errors.patientName}>
        <PatientSearchableInput
          formik={formik}
          hasError={!!(formik.touched.patientName && formik.errors.patientName)}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Sex" error={formik.touched.sex && formik.errors.sex}>
          <div className="relative">
            <select
              className={`${ic("sex")} appearance-none cursor-pointer`}
              {...formik.getFieldProps("sex")}
            >
              <option value="" disabled>Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </FormField>

        <FormField label="Date of Birth" error={formik.touched.dob && formik.errors.dob}>
          <input
            type="date"
            className={ic("dob")}
            {...formik.getFieldProps("dob")}
          />
        </FormField>
      </div>

      <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
        <input
          type="tel"
          placeholder="63+9XXXXXXXXX"
          className={ic("contactNo")}
          {...formik.getFieldProps("contactNo")}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
          <SelectField
            formik={formik}
            field="hospPlan"
            placeholder="Select Plan"
            options={hospPlans}
            keyProp="planId"
            valueProp="planId"
            labelProp="planDescription"
          />
        </FormField>

        <FormField label="Hospitalization Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
          <SelectField
            formik={formik}
            field="hospCaseType"
            placeholder="Select Case Type"
            options={hospCaseTypes}
            keyProp="caseTypeId"
            valueProp="caseTypeId"
            labelProp="caseTypeDescription"
          />
        </FormField>
      </div>

      <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
        <textarea
          rows={4}
          placeholder="Optional notes…"
          className={`${ic("remarks")} resize-none`}
          {...formik.getFieldProps("remarks")}
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


function ViewPatientModal({ patient, onClose }) {
  const ro = readonlyInputClass;

  const dateDisplay = patient.start_datetime
    ? new Date(patient.start_datetime.replace(" ", "T")).toLocaleDateString("en-US", {
        month: "2-digit", day: "2-digit", year: "numeric",
      })
    : "—";

  const startTimeDisplay = patient.start_datetime
    ? new Date(patient.start_datetime.replace(" ", "T")).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : "—";

  const endTimeDisplay = patient.end_datetime
    ? new Date(patient.end_datetime.replace(" ", "T")).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : "—";

  return (
    <Modal title="View Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Radiologist</label>
            <div className="relative">
              <input readOnly value={patient.radiologistName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Procedure</label>
            <input readOnly value={patient.procedure ?? "—"} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Modality</label>
            <div className="relative">
              <input readOnly value={patient.modalityName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Machine</label>
            <div className="relative">
              <input readOnly value={patient.machineName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Preparation Explained by</label>
            <div className="relative">
              <input readOnly value={patient.preparationExplainedByName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Date</label>
            <input readOnly value={dateDisplay} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Start Time</label>
            <input readOnly value={startTimeDisplay} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">End Time</label>
            <input readOnly value={endTimeDisplay} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Patient Name</label>
            <input readOnly value={patient.patientName ?? "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
            <div className="relative">
              <input readOnly value={patient.sex ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
            <input readOnly value={patient.dob ?? "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Contact No.</label>
            <input readOnly value={patient.contactNo ?? "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Status</label>
            <input
              readOnly
              value={patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : "—"}
              className={ro}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Hospitalization Plan</label>
            <div className="relative">
              <input readOnly value={patient.hospPlanName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Hospitalization Case Type</label>
            <div className="relative">
              <input readOnly value={patient.hospCaseTypeName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
          <textarea
            readOnly
            rows={4}
            value={patient.remarks ?? ""}
            placeholder="No remarks"
            className={`${ro} resize-none`}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                     text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}



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

  const label = value === "all"
    ? "All Modality"
    : options.find((o) => String(o.modalityId) === String(value))?.modalityName ?? "All Modality";

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
        <div className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-card border border-gray-100 py-1 z-50">
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors
              ${value === "all" ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Modality
          </button>
          {options.map((m) => (
            <button
              key={m.modalityId}
              onClick={() => { onChange(String(m.modalityId)); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${String(value) === String(m.modalityId) ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
            >
              {m.modalityName}
            </button>
          ))}
        </div>
      )}
    </div>
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
  const [loading,        setLoading]        = useState(false);

  const [radiologists,  setRadiologists]  = useState([]);
  const [modalities,    setModalities]    = useState([]);
  const [machines,      setMachines]      = useState([]);
  const [hospPlans,     setHospPlans]     = useState([]);
  const [hospCaseTypes, setHospCaseTypes] = useState([]);

  useEffect(() => {
    fetchSchedules();
    fetchDropdownData();
  }, []);

  useEffect(() => { setSearchQuery(""); }, [activeTab]);

  async function fetchSchedules() {
    setLoading(true);
    try {

    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDropdownData() {
    try {

    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }

  const filtered = schedules.filter((s) => {
    const q = searchQuery.toLowerCase();

    const matchesTab =
      activeTab === "All"
        ? s.status?.toLowerCase() !== "archived"
        : s.status?.toLowerCase() === activeTab.toLowerCase();

    const matchesSearch =
      s.patientName?.toLowerCase().includes(q) ||
      s.radiologistName?.toLowerCase().includes(q);

    const matchesModality =
      modalityFilter === "all" || String(s.modalityId) === String(modalityFilter);

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
      unarchive: "Scheduled",
      done:      "Done",
    };
    await updateStatus(schedule.scheduleId, statusMap[type]);
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

  async function handleCreate(values) {
    const payload = {
      patientName:   values.patientName,
      sex:           values.sex,
      dob:           values.dob,
      contactNo:     values.contactNo,
      procedure:     values.procedure,
      remarks:       values.remarks,
      start_datetime: buildDatetime(values.date, values.startTime),
      end_datetime:   buildDatetime(values.date, values.endTime),
      doctor:                  { doctorId:    Number(values.radiologist)            },
      preparationExplainedBy:  { doctorId:    Number(values.preparationExplainedBy) },
      modality:                { modalityId:  Number(values.modality)               },
      machine:                 { machineId:   Number(values.machine)                },
      hospitalizationPlan:     values.hospPlan     ? { planId:     Number(values.hospPlan)     } : null,
      hospitalizationCaseType: values.hospCaseType ? { caseTypeId: Number(values.hospCaseType) } : null,
      ...(values.patientId ? { patient: { patientId: Number(values.patientId) } } : {}),
    };

    console.log("Create payload:", payload);
    await fetchSchedules();
  }

  async function handleEdit(values) {
    const payload = {
      patientName:   values.patientName,
      sex:           values.sex,
      dob:           values.dob,
      contactNo:     values.contactNo,
      procedure:     values.procedure,
      remarks:       values.remarks,
      start_datetime: buildDatetime(values.date, values.startTime),
      end_datetime:   buildDatetime(values.date, values.endTime),
      doctor:                  { doctorId:    Number(values.radiologist)            },
      preparationExplainedBy:  { doctorId:    Number(values.preparationExplainedBy) },
      modality:                { modalityId:  Number(values.modality)               },
      machine:                 { machineId:   Number(values.machine)                },
      hospitalizationPlan:     values.hospPlan     ? { planId:     Number(values.hospPlan)     } : null,
      hospitalizationCaseType: values.hospCaseType ? { caseTypeId: Number(values.hospCaseType) } : null,
      ...(values.patientId ? { patient: { patientId: Number(values.patientId) } } : {}),
    };

    console.log("Edit payload:", payload);
    await fetchSchedules();
  }

  function toEditInitial(s) {
    const { date, time: startTime } = splitDatetime(s.start_datetime);
    const { time: endTime }         = splitDatetime(s.end_datetime);
    return {
      radiologist:            String(s.doctorId                  ?? ""),
      procedure:              s.procedure                        ?? "",
      modality:               String(s.modalityId               ?? ""),
      machine:                String(s.machineId                ?? ""),
      preparationExplainedBy: String(s.preparationExplainedById ?? ""),
      date,
      startTime,
      endTime,
      patientName:            s.patientName   ?? "",
      patientId:              s.patientId     ?? "",
      sex:                    s.sex           ?? "",
      dob:                    s.dob           ?? "",
      contactNo:              s.contactNo     ?? "",
      hospPlan:               String(s.hospPlanId     ?? ""),
      hospCaseType:           String(s.hospCaseTypeId ?? ""),
      remarks:                s.remarks       ?? "",
    };
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
          <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.patientName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {formatDate(s.start_datetime)}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.start_datetime && s.end_datetime
                ? `${formatTime(s.start_datetime)} - ${formatTime(s.end_datetime)}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.radiologistName ?? "—"}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.modalityName    ?? "—"}</td>
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
        <Modal title="Add Patient Schedule" onClose={() => setShowAdd(false)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={BLANK_PATIENT}
            submitLabel="Submit"
            radiologists={radiologists}
            modalities={modalities}
            machines={machines}
            hospPlans={hospPlans}
            hospCaseTypes={hospCaseTypes}
            onSubmit={handleCreate}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {viewPatient && (
        <ViewPatientModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
        />
      )}

      {editPatient && (
        <Modal title="Edit Patient Schedule" onClose={() => setEditPatient(null)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={toEditInitial(editPatient)}
            submitLabel="Edit"
            radiologists={radiologists}
            modalities={modalities}
            machines={machines}
            hospPlans={hospPlans}
            hospCaseTypes={hospCaseTypes}
            onSubmit={handleEdit}
            onClose={() => setEditPatient(null)}
          />
        </Modal>
      )}

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.schedule.patientName ?? "This schedule")}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}