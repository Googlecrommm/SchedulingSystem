import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive, CheckCircle,
  Eye, UserCheck, UserX, Pencil, Trash2, RefreshCw, ChevronDown,
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
  ConfirmDialog,
} from "../ui";



const TABS = [
  { label: "All",       icon: Calendar      },
  { label: "Confirmed", icon: CalendarCheck },
  { label: "Cancelled", icon: CalendarX     },
  { label: "Scheduled", icon: Clock         },
  { label: "Archived",  icon: Archive       },
  { label: "Done",      icon: CheckCircle   },
];

const COLUMNS = ["Full Name", "Date", "Time", "Therapist", "Status", "Action"];

const BLANK_PATIENT = {
  therapist:    "",
  date:         "",   
  startTime:    "",   
  endTime:      "",   
  patientName:  "",
  dob:          "",
  contactNo:    "",
  sex:          "",
  occupation:   "",
  address:      "",
  hospPlan:     "",
  hospCaseType: "",
  remarks:      "",
};

const confirmMeta = {
  accept:    { title: "Confirm Schedule?",   label: "Confirm",   danger: false, msg: (n) => `"${n}" will be marked as confirmed.`  },
  reject:    { title: "Cancel Schedule?",    label: "Cancel",    danger: true,  msg: (n) => `"${n}" will be marked as cancelled.`  },
  archive:   { title: "Archive Schedule?",   label: "Archive",   danger: true,  msg: (n) => `"${n}" will be moved to the archive.` },
  unarchive: { title: "Unarchive Schedule?", label: "Unarchive", danger: false, msg: (n) => `"${n}" will be restored to pending.`  },
  done:      { title: "Mark as Done?",       label: "Done",      danger: false, msg: (n) => `"${n}" will be marked as done.`       },
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
  return {
    date: datePart ?? "",
    time: timePart?.slice(0, 5) ?? "",   
  };
}


function formatDatetime(iso) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
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
      { label: "View",    icon: Eye       },
      { label: "Confirm", icon: UserCheck },
      { label: "Cancel",  icon: UserX     },
      { label: "Edit",    icon: Pencil    },
      { label: "Archive", icon: Trash2, danger: true },
    ];
  }
}


const patientSchema = Yup.object({
  therapist:    Yup.string().required("Therapist is required"),
  date:         Yup.string().required("Date is required"),
  startTime:    Yup.string().required("Start time is required"),
  endTime:      Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  patientName:  Yup.string().required("Patient name is required"),
  dob:          Yup.string().required("Date of birth is required"),
  contactNo:    Yup.string()
    .matches(/^\+?[0-9]{7,15}$/, "Enter a valid contact number")
    .required("Contact number is required"),
  sex:          Yup.string().required("Sex is required"),
  occupation:   Yup.string().required("Occupation is required"),
  address:      Yup.string().required("Address is required"),
  hospPlan:     Yup.string(),
  hospCaseType: Yup.string(),
  remarks:      Yup.string(),
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


function PatientForm({ initialValues, submitLabel, onSubmit, onClose, therapists, hospPlans, hospCaseTypes }) {
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
        <FormField label="Therapist" error={formik.touched.therapist && formik.errors.therapist}>
          <SelectField
            formik={formik}
            field="therapist"
            placeholder="Select Therapist"
            options={therapists}
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
        <input
          type="text"
          placeholder="Full Name"
          className={ic("patientName")}
          {...formik.getFieldProps("patientName")}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Date of Birth" error={formik.touched.dob && formik.errors.dob}>
          <input
            type="date"
            className={ic("dob")}
            {...formik.getFieldProps("dob")}
          />
        </FormField>

        <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
          <input
            type="tel"
            placeholder="63+9XXXXXXXXX"
            className={ic("contactNo")}
            {...formik.getFieldProps("contactNo")}
          />
        </FormField>
      </div>

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
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </FormField>

        <FormField label="Occupation" error={formik.touched.occupation && formik.errors.occupation}>
          <input
            type="text"
            placeholder="Occupation"
            className={ic("occupation")}
            {...formik.getFieldProps("occupation")}
          />
        </FormField>
      </div>

      <FormField label="Address" error={formik.touched.address && formik.errors.address}>
        <input
          type="text"
          placeholder="City, Province"
          className={ic("address")}
          {...formik.getFieldProps("address")}
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

  function displayDatetime(datetime) {
    if (!datetime) return "—";
    const d = new Date(datetime.replace(" ", "T"));
    const date = d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${date}    ${time}`;
  }

  return (
    <Modal title="View Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Therapist</label>
            <div className="relative">
              <input readOnly value={patient.therapistName ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Date</label>
            <input
              readOnly
              value={patient.start_datetime ? new Date(patient.start_datetime.replace(" ", "T")).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
              className={ro}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Start Time</label>
            <input readOnly value={displayDatetime(patient.start_datetime)} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">End Time</label>
            <input readOnly value={displayDatetime(patient.end_datetime)} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Patient Name</label>
            <input readOnly value={patient.patientName ?? "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Status</label>
            <input readOnly value={patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : "—"} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Date of Birth</label>
            <input readOnly value={patient.dob ?? "—"} className={ro} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Contact No.</label>
            <input readOnly value={patient.contactNo ?? "—"} className={ro} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Sex</label>
            <div className="relative">
              <input readOnly value={patient.sex ?? "—"} className={`${ro} pr-10`} />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Occupation</label>
            <input readOnly value={patient.occupation ?? "—"} className={ro} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary mb-1.5">Address</label>
          <input readOnly value={patient.address ?? "—"} className={ro} />
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
          View
        </button>
      </div>
    </Modal>
  );
}


export default function RehabScheduleManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [viewPatient,   setViewPatient]   = useState(null);
  const [editPatient,   setEditPatient]   = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [schedules,     setSchedules]     = useState([]);
  const [loading,       setLoading]       = useState(false);

  const [therapists,    setTherapists]    = useState([]);
  const [hospPlans,     setHospPlans]     = useState([]);
  const [hospCaseTypes, setHospCaseTypes] = useState([]);

  useEffect(() => {
    fetchSchedules();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  

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
    const matchesSearch =
      s.patientName?.toLowerCase().includes(q) ||
      s.therapistName?.toLowerCase().includes(q);

    if (activeTab === "All") return s.status?.toLowerCase() !== "archived" && matchesSearch;
    return s.status?.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
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
      dob:           values.dob,
      sex:           values.sex,
      contactNo:     values.contactNo,
      address:       values.address,
      occupation:    values.occupation,
      remarks:       values.remarks,
      start_datetime: buildDatetime(values.date, values.startTime),
      end_datetime:   buildDatetime(values.date, values.endTime),
      doctor:                  { doctorId: Number(values.therapist) },
      hospitalizationPlan:     values.hospPlan     ? { planId:     Number(values.hospPlan)     } : null,
      hospitalizationCaseType: values.hospCaseType ? { caseTypeId: Number(values.hospCaseType) } : null,
    };
   
    console.log("Create payload:", payload);
    await fetchSchedules();
  }

  async function handleEdit(values) {
    const payload = {
      patientName:   values.patientName,
      dob:           values.dob,
      sex:           values.sex,
      contactNo:     values.contactNo,
      address:       values.address,
      occupation:    values.occupation,
      remarks:       values.remarks,
      start_datetime: buildDatetime(values.date, values.startTime),
      end_datetime:   buildDatetime(values.date, values.endTime),
      doctor:                  { doctorId: Number(values.therapist) },
      hospitalizationPlan:     values.hospPlan     ? { planId:     Number(values.hospPlan)     } : null,
      hospitalizationCaseType: values.hospCaseType ? { caseTypeId: Number(values.hospCaseType) } : null,
    };
    
    console.log("Edit payload:", payload);
    await fetchSchedules();
  }

 

  function toEditInitial(s) {
    const { date, time: startTime } = splitDatetime(s.start_datetime);
    const { time: endTime }         = splitDatetime(s.end_datetime);
    return {
      therapist:    String(s.doctorId    ?? ""),
      date,
      startTime,
      endTime,
      patientName:  s.patientName  ?? "",
      dob:          s.dob          ?? "",
      contactNo:    s.contactNo    ?? "",
      sex:          s.sex          ?? "",
      occupation:   s.occupation   ?? "",
      address:      s.address      ?? "",
      hospPlan:     String(s.hospPlanId     ?? ""),
      hospCaseType: String(s.hospCaseTypeId ?? ""),
      remarks:      s.remarks      ?? "",
    };
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

 

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
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.therapistName ?? "—"}</td>
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
            therapists={therapists}
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
            therapists={therapists}
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