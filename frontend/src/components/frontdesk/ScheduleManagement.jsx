import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
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
  UserCheck,
  UserX,
  UserCog,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import DGMCIcon from "../../assets/DGMC-icon.svg";



const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/frontdesk/dashboard" },
  { label: "Schedules", icon: Calendar, path: "/frontdesk/schedules" },
];

const tabs = ["All", "Confirmed", "Canceled", "Pending", "Archived", "Done"];

const columns = ["Name", "Date", "Time", "Therapist", "Status", "Action"];

const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed": return "text-green-500";
    case "canceled":  return "text-accent";
    case "pending":   return "text-yellow-500";
    case "archived":  return "text-gray-400";
    case "done":      return "text-primary";
    default:          return "text-gray-500";
  }
};



const timeOptions = [];
for (let h = 0; h <= 23; h++) {
  ["00", "30"].forEach((m) => {
    const period = h < 12 ? "AM" : "PM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    timeOptions.push(`${hour12}:${m} ${period}`);
  });
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

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

const pendingActionItems = [
  { label: "View",    icon: Eye       },
  { label: "Accept",  icon: UserCheck },
  { label: "Reject",  icon: UserX     },
  { label: "Edit",    icon: UserCog   },
  { label: "Archive", icon: Trash2    },
];

const confirmedActionItems = [
  { label: "View", icon: Eye       },
  { label: "Done", icon: UserCheck },
];

const viewOnlyActionItems = [
  { label: "View", icon: Eye },
];

const archivedActionItems = [
  { label: "View",      icon: Eye      },
  { label: "Unarchive", icon: RefreshCw },
];

const getActionItems = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed": return confirmedActionItems;
    case "canceled":  return viewOnlyActionItems;
    case "archived":  return archivedActionItems;
    case "done":      return viewOnlyActionItems;
    default:          return pendingActionItems; 
  }
};



function AddPatientModal({ onClose, onSubmit }) {
  const formik = useFormik({
    initialValues: {
      patientName: "",
      dob:         "",
      sex:         "",
      contactNo:   "",
      address:     "",
      occupation:  "",
      date:        "",
      startTime:   "",
      endTime:     "",
      therapist:   "",
      remarks:     "",
    },
    validationSchema: patientSchema,
    onSubmit: (values, { setSubmitting }) => {
     
      onSubmit?.(values);
      onClose?.();
      setSubmitting(false);
    },
  });

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-surface-input text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200
     ${formik.touched[field] && formik.errors[field]
       ? "border-red-400 focus:ring-red-200"
       : "border-surface-border focus:ring-primary/30"
     }`;

  const selectInputClass = (field) =>
    `${inputClass(field)} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">

     
        <div className="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-primary font-montserrat">
            Add Patient Form
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

      
        <form onSubmit={formik.handleSubmit} noValidate className="px-6 py-6 space-y-4">

     
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Patient Name</label>
              <input
                type="text"
                placeholder="Full Name"
                {...formik.getFieldProps("patientName")}
                className={inputClass("patientName")}
              />
              <FieldError message={formik.touched.patientName && formik.errors.patientName} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
              <input
                type="date"
                {...formik.getFieldProps("dob")}
                className={inputClass("dob")}
              />
              <FieldError message={formik.touched.dob && formik.errors.dob} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Contact No.</label>
              <input
                type="tel"
                placeholder="+639XXXXXXXXX"
                {...formik.getFieldProps("contactNo")}
                className={inputClass("contactNo")}
              />
              <FieldError message={formik.touched.contactNo && formik.errors.contactNo} />
            </div>
          </div>

         
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
              <div className="relative">
                <select {...formik.getFieldProps("sex")} className={selectInputClass("sex")}>
                  <option value="" disabled>Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <FieldError message={formik.touched.sex && formik.errors.sex} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Occupation</label>
              <input
                type="text"
                placeholder="Occupation"
                {...formik.getFieldProps("occupation")}
                className={inputClass("occupation")}
              />
              <FieldError message={formik.touched.occupation && formik.errors.occupation} />
            </div>
          </div>

         
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Date</label>
              <input
                type="date"
                {...formik.getFieldProps("date")}
                className={inputClass("date")}
              />
              <FieldError message={formik.touched.date && formik.errors.date} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Therapist</label>
              <input
                type="text"
                placeholder="Therapist name"
                {...formik.getFieldProps("therapist")}
                className={inputClass("therapist")}
              />
              <FieldError message={formik.touched.therapist && formik.errors.therapist} />
            </div>
          </div>

       
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
            <input
              type="text"
              placeholder="City, Province"
              {...formik.getFieldProps("address")}
              className={inputClass("address")}
            />
            <FieldError message={formik.touched.address && formik.errors.address} />
          </div>

         
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Start Time</label>
              <div className="relative">
                <select {...formik.getFieldProps("startTime")} className={selectInputClass("startTime")}>
                  <option value="">Select</option>
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <FieldError message={formik.touched.startTime && formik.errors.startTime} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">End Time</label>
              <div className="relative">
                <select {...formik.getFieldProps("endTime")} className={selectInputClass("endTime")}>
                  <option value="">Select</option>
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <FieldError message={formik.touched.endTime && formik.errors.endTime} />
            </div>
          </div>

        
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
            <textarea
              rows={3}
              placeholder="Optional notes..."
              {...formik.getFieldProps("remarks")}
              className={`${inputClass("remarks")} resize-none`}
            />
            <FieldError message={formik.touched.remarks && formik.errors.remarks} />
          </div>

         
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => formik.resetForm()}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark
                         text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                         text-white text-sm font-semibold transition-colors duration-200 cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}



function ViewPatientModal({ patient, onClose }) {
  const readonlyClass =
    "w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-input text-primary text-sm cursor-default select-none";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        
        <div className="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-primary font-montserrat">
            View Patient Form
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

      
        <div className="px-6 py-6 space-y-4">

        
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Patient Name</label>
              <input readOnly value={patient.name ?? "—"} className={readonlyClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
              <input readOnly value={patient.dob ?? "—"} className={readonlyClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Contact No.</label>
              <input readOnly value={patient.contactNo ?? "—"} className={readonlyClass} />
            </div>
          </div>

         
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
              <input readOnly value={patient.sex ?? "—"} className={readonlyClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Occupation</label>
              <input readOnly value={patient.occupation ?? "—"} className={readonlyClass} />
            </div>
          </div>

     
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
            <input readOnly value={patient.address ?? "—"} className={readonlyClass} />
          </div>

        
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Date</label>
              <input readOnly value={patient.date ?? "—"} className={readonlyClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Therapist</label>
              <input readOnly value={patient.therapist ?? "—"} className={readonlyClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Status</label>
              <input readOnly value={patient.status ?? "—"} className={readonlyClass} />
            </div>
          </div>

        
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Start Time</label>
              <input readOnly value={patient.startTime ?? "—"} className={readonlyClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">End Time</label>
              <input readOnly value={patient.endTime ?? "—"} className={readonlyClass} />
            </div>
          </div>

       
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
            <textarea
              readOnly
              rows={3}
              value={patient.remarks ?? ""}
              placeholder="No remarks"
              className={`${readonlyClass} resize-none`}
            />
          </div>

        
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                         text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}



function EditPatientModal({ patient, onClose, onSubmit }) {
  const formik = useFormik({
    initialValues: {
      patientName: patient.name       ?? "",
      dob:         patient.dob        ?? "",
      sex:         patient.sex        ?? "",
      contactNo:   patient.contactNo  ?? "",
      address:     patient.address    ?? "",
      occupation:  patient.occupation ?? "",
      date:        patient.date       ?? "",
      startTime:   patient.startTime  ?? "",
      endTime:     patient.endTime    ?? "",
      therapist:   patient.therapist  ?? "",
      remarks:     patient.remarks    ?? "",
    },
    validationSchema: patientSchema,
    onSubmit: (values, { setSubmitting }) => {
   
      onSubmit?.(patient.id, values);
      onClose?.();
      setSubmitting(false);
    },
  });

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border bg-surface-input text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200
     ${formik.touched[field] && formik.errors[field]
       ? "border-red-400 focus:ring-red-200"
       : "border-surface-border focus:ring-primary/30"
     }`;

  const selectInputClass = (field) =>
    `${inputClass(field)} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">

       
        <div className="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-primary font-montserrat">
            Edit Patient Form
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

       
        <form onSubmit={formik.handleSubmit} noValidate className="px-6 py-6 space-y-4">

        
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Patient Name</label>
              <input
                type="text"
                placeholder="Full Name"
                {...formik.getFieldProps("patientName")}
                className={inputClass("patientName")}
              />
              <FieldError message={formik.touched.patientName && formik.errors.patientName} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
              <input
                type="date"
                {...formik.getFieldProps("dob")}
                className={inputClass("dob")}
              />
              <FieldError message={formik.touched.dob && formik.errors.dob} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Contact No.</label>
              <input
                type="tel"
                placeholder="+639XXXXXXXXX"
                {...formik.getFieldProps("contactNo")}
                className={inputClass("contactNo")}
              />
              <FieldError message={formik.touched.contactNo && formik.errors.contactNo} />
            </div>
          </div>

        
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
              <div className="relative">
                <select {...formik.getFieldProps("sex")} className={selectInputClass("sex")}>
                  <option value="" disabled>Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <FieldError message={formik.touched.sex && formik.errors.sex} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Occupation</label>
              <input
                type="text"
                placeholder="Occupation"
                {...formik.getFieldProps("occupation")}
                className={inputClass("occupation")}
              />
              <FieldError message={formik.touched.occupation && formik.errors.occupation} />
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
            <input
              type="text"
              placeholder="City, Province"
              {...formik.getFieldProps("address")}
              className={inputClass("address")}
            />
            <FieldError message={formik.touched.address && formik.errors.address} />
          </div>

       
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Date</label>
              <input
                type="date"
                {...formik.getFieldProps("date")}
                className={inputClass("date")}
              />
              <FieldError message={formik.touched.date && formik.errors.date} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Therapist</label>
              <input
                type="text"
                placeholder="Therapist name"
                {...formik.getFieldProps("therapist")}
                className={inputClass("therapist")}
              />
              <FieldError message={formik.touched.therapist && formik.errors.therapist} />
            </div>
          </div>

         
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Start Time</label>
              <div className="relative">
                <select {...formik.getFieldProps("startTime")} className={selectInputClass("startTime")}>
                  <option value="">Select</option>
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <FieldError message={formik.touched.startTime && formik.errors.startTime} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">End Time</label>
              <div className="relative">
                <select {...formik.getFieldProps("endTime")} className={selectInputClass("endTime")}>
                  <option value="">Select</option>
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <FieldError message={formik.touched.endTime && formik.errors.endTime} />
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Remarks</label>
            <textarea
              rows={3}
              placeholder="Optional notes..."
              {...formik.getFieldProps("remarks")}
              className={`${inputClass("remarks")} resize-none`}
            />
            <FieldError message={formik.touched.remarks && formik.errors.remarks} />
          </div>

         
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => formik.resetForm()}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark
                         text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                         text-white text-sm font-semibold transition-colors duration-200 cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}



function ActionDropdown({ onAction, status }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

 
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect       = ref.current.getBoundingClientRect();
      const items      = getActionItems(status);
      const menuHeight = items.length * 42 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp     = spaceBelow < menuHeight + 8;
      setDropdownPos({
       
        top:  openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: rect.right - 176,
      });
    }
    setOpen((prev) => !prev);
  };

  const items = getActionItems(status);

  return (
    <div className="flex justify-center" ref={ref}>
      <button
        onClick={handleToggle}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200
                   hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreHorizontal size={18} className="text-gray-500" />
      </button>

      {open && createPortal(
        <div
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="w-44 bg-white rounded-xl shadow-card border border-gray-100 py-1 overflow-hidden"
        >
          {items.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => { onAction(label); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600
                         hover:bg-primary/10 hover:text-primary transition-colors duration-150 cursor-pointer"
            >
              <Icon size={17} className="text-gray-400" />
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}



export default function ScheduleManagement() {
  const location = useLocation();
  const [activeTab, setActiveTab]               = useState("All");
  const [searchQuery, setSearchQuery]           = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [viewPatient, setViewPatient]           = useState(null);
  const [editPatient, setEditPatient]           = useState(null);
  
  const [schedules, setSchedules] = useState([]);
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

 
  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.therapist.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "All") {
      return s.status.toLowerCase() !== "archived" && matchesSearch;
    }

    return s.status.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
  });

  const updateScheduleStatus = (id, newStatus) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleAction = (action, id) => {
    switch (action) {
      case "View": {
        const patient = schedules.find((s) => s.id === id);
        if (patient) setViewPatient(patient);
        break;
      }
      case "Edit": {
        const patient = schedules.find((s) => s.id === id);
        if (patient) setEditPatient(patient);
        break;
      }
      case "Accept":
       
        updateScheduleStatus(id, "confirmed");
        break;
      case "Reject":
      
        updateScheduleStatus(id, "canceled");
        break;
      case "Archive":
        
        updateScheduleStatus(id, "archived");
        break;
      case "Unarchive":
        
        updateScheduleStatus(id, "pending");
        break;
      case "Done":
        
        updateScheduleStatus(id, "done");
        break;
      default:
        break;
    }
  };

 
  const handleAddPatient = (values) => {
    const newPatient = {
      ...values,
      id:     Date.now(), 
      name:   values.patientName,
      status: "pending",
    };
   
    setSchedules((prev) => [...prev, newPatient]);
  };

 
  const handleEditPatient = (id, values) => {
  
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...values, name: values.patientName } : s
      )
    );
  };

  return (
    <div className="flex min-h-screen bg-surface-bg font-body">

   
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPatient}
        />
      )}
      {viewPatient && (
        <ViewPatientModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
        />
      )}
      {editPatient && (
        <EditPatientModal
          patient={editPatient}
          onClose={() => setEditPatient(null)}
          onSubmit={handleEditPatient}
        />
      )}

    
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    
      <aside
        className={`fixed top-0 left-0 h-screen z-30 w-64 bg-bading border-r border-gray-100 flex flex-col
          transition-transform duration-300
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
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 px-2">
            General
          </p>
          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, path }) => {
              const isActive = location.pathname === path;
              return (
                <li key={label}>
                  <Link
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                      ${isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-primary"
                      }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

 
      <div className="flex-1 flex flex-col min-w-0">

     
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-[73px] flex items-center justify-between gap-4 sticky top-0 z-10">
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
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-primary leading-tight">Rehab</p>
                  <p className="text-xs text-gray-400 leading-tight">Rehabilitation Frontdesk</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-100 z-50 py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer">
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

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-montserrat">
                Schedule Management
              </h1>
              <p className="text-sm font-semibold text-accent font-montserrat mt-0.5">
                Rehabilitation
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Patient"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-primary placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                           transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map((label) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px whitespace-nowrap
                  ${activeTab === label
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-primary hover:border-gray-300"
                  }`}
              >
                <Calendar size={14} />
                {label}
              </button>
            ))}

            <div className="ml-auto pb-1 shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                           text-white text-sm font-semibold
                           transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Patient</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
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
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{s.name}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{s.date}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{s.startTime} – {s.endTime}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{s.therapist}</td>
                        <td className={`px-6 py-4 text-center text-sm font-semibold ${statusColor(s.status)}`}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <ActionDropdown
                            status={s.status}
                            onAction={(action) => handleAction(action, s.id)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <Calendar size={40} className="text-gray-200" />
                          <p className="text-sm font-medium">No schedules yet</p>
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