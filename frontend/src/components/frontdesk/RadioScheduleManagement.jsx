import { useState, useEffect, useRef, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive, CheckCircle,
  Eye, UserCheck, UserX, Pencil, Trash2, RefreshCw, ChevronDown, Search, X,
} from "lucide-react";
import { LayoutDashboard, Cpu, Cross } from "lucide-react";
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

const COLUMNS = ["Full Name", "Date", "Time", "Radiologist", "Machine", "Status", "Action"];

// Statuses excluded from conflict-blocking checks
const INACTIVE_STATUSES = ["Cancelled", "Done", "Archived"];



const confirmMeta = {
  accept:    { title: "Confirm Schedule?",   msg: (n) => `"${n}" will be marked as confirmed.`,  label: "Confirm",   danger: false },
  reject:    { title: "Cancel Schedule?",    msg: (n) => `"${n}" will be marked as cancelled.`,  label: "Cancel",    danger: true  },
  archive:   { title: "Archive Schedule?",   msg: (n) => `"${n}" will be moved to the archive.`, label: "Archive",   danger: true  },
  unarchive: { title: "Unarchive Schedule?", msg: (n) => `"${n}" will be restored to pending.`,  label: "Unarchive", danger: false },
  done:      { title: "Mark as Done?",       msg: (n) => `"${n}" will be marked as done.`,       label: "Done",      danger: false },
};



const BLANK_PATIENT = {
  radiologist:  "",
  procedure:    "",
  modality:     "",   // used to filter machine dropdown; not sent in payload
  machine:      "",
  date:         new Date().toISOString().slice(0, 10),
  startTime:    "",
  endTime:      "",
  patientName:  "",
  patientId:    "",
  sex:          "",
  dob:          "",
  contactNo:    "",
  address:      "",
  hospPlan:     "",
  hospCaseType: "",
  remarks:      "",
};



function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}


function buildDatetime(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}:00`;
}


function splitDatetime(datetime) {
  if (!datetime) return { date: "", time: "" };
  const [datePart, timePart] = datetime.replace("T", " ").split(" ");
  return { date: datePart ?? "", time: timePart?.slice(0, 5) ?? "" };
}

// ─── Time options (every 15 min, 12-hour label) ───────────────────────────
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh    = String(h).padStart(2, "0");
      const mm    = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const period = h < 12 ? "AM" : "PM";
      const h12   = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${h12}:${mm} ${period}`;
      opts.push({ value, label });
    }
  }
  return opts;
})();

function toMins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toSlot(mins) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Builds blocked sets for start + end time dropdowns from booked ranges.
// For a booking 1:00→2:00: startBlocked=[1:00..1:45], endBlocked=[1:15..2:00]
// This allows back-to-back: end at 1:00 is fine, start at 1:00 is fine.
function buildBlockedSets(bookedRanges) {
  const startBlocked = new Set();
  const endBlocked   = new Set();
  for (const { startTime, endTime } of bookedRanges) {
    const startMins = toMins(startTime);
    const endMins   = toMins(endTime);
    for (let m = startMins; m < endMins; m += 15) {
      const slot = toSlot(m);
      startBlocked.add(slot);
      if (m > startMins) endBlocked.add(slot);
    }
    endBlocked.add(toSlot(endMins));
  }
  return { startBlocked, endBlocked };
}

// ─── Time dropdown (with booked-slot blocking + past-time blocking) ──────────
function TimeDropdown({ formik, field, startBlocked = new Set(), endBlocked = new Set(), selectedDate = "" }) {
  const ic = useInputClass(formik);
  const startTime  = formik.values.startTime;
  const blockedSet = field === "startTime" ? startBlocked : endBlocked;

  // Compute the current time slot rounded down to the nearest 15-min mark
  const today    = new Date().toISOString().slice(0, 10);
  const isToday  = selectedDate === today;
  const nowMins  = isToday
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : -1;

  return (
    <div className="relative">
      <select
        className={`${ic(field)} appearance-none cursor-pointer`}
        {...formik.getFieldProps(field)}
      >
        <option value="" disabled>Select time</option>
        {TIME_OPTIONS.map((opt) => {
          const isBlocked     = blockedSet.has(opt.value);
          const isBeforeStart = field === "endTime" && startTime && opt.value <= startTime;
          // Block past times when today is selected
          const isPast        = isToday && toMins(opt.value) <= nowMins;
          const disabled      = isBlocked || isBeforeStart || isPast;
          return (
            <option key={opt.value} value={opt.value} disabled={disabled}>
              {opt.label}{isBlocked ? " (Booked)" : isPast ? " (Past)" : ""}
            </option>
          );
        })}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleDateString("en-CA", {
    month: "2-digit", day: "2-digit", year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function ModalityDropdown({ value, onChange, modalities }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = value === ""
    ? "All Modality"
    : modalities.find((m) => m.modalityName === value)?.modalityName ?? "All Modality";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
      >
        {label}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-auto min-w-[160px] bg-white rounded-xl shadow-card border border-gray-100 py-1 z-50">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
              ${value === ""
                ? "text-primary font-semibold bg-primary/5"
                : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Modality
          </button>
          {modalities.map((m) => (
            <button
              key={m.modalityId}
              type="button"
              onClick={() => { onChange(m.modalityName); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${value === m.modalityName
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
            >
              {m.modalityName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
        const res = await axios.get(
          `/api/SearchPatient/${encodeURIComponent(val.trim())}`,
          { headers: getAuthHeader() }
        );
        const list = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
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
    // PatientResponseDTO fields: name, patientId, birthDate, contactNumber, sex, address
    const displayName = patient.name ?? "";
    setQuery(displayName);
    setIsExisting(true);
    setOpen(false);
    setResults([]);

    formik.setFieldValue("patientName", displayName);
    formik.setFieldValue("patientId",   patient.patientId      ?? "");
    formik.setFieldValue("sex",         patient.sex            ?? "");
    formik.setFieldValue("dob",         patient.birthDate       ?? "");
    formik.setFieldValue("contactNo",   patient.contactNumber  ?? "");
    formik.setFieldValue("address",     patient.address        ?? "");
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
    formik.setFieldValue("address",     "");
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
              {/* PatientResponseDTO uses `name` (not patientName) */}
              <span className="font-medium">{p.name}</span>
              {p.birthDate && (
                <span className="ml-2 text-xs text-gray-400">DOB: {p.birthDate}</span>
              )}
              {p.contactNumber && (
                <span className="ml-2 text-xs text-gray-400">{p.contactNumber}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



const patientSchema = Yup.object({
  radiologist:  Yup.string().required("Radiologist is required"),
  procedure:    Yup.string().required("Procedure is required"),
  modality:     Yup.string(),   // optional — filters machine list only
  machine:      Yup.string().required("Machine is required"),
  date:         Yup.string().required("Date is required")
    .test("not-past", "Date cannot be in the past", (val) => {
      if (!val) return true;
      return val >= new Date().toISOString().slice(0, 10);
    }),
  startTime:    Yup.string().required("Start time is required"),
  endTime:      Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  patientName:  Yup.string().required("Patient name is required"),
  sex:          Yup.string().required("Sex is required"),
  dob:          Yup.string().required("Date of birth is required"),
  contactNo:    Yup.string()
    .matches(/^\+?[0-9]{7,15}$/, "Enter a valid contact number")
    .required("Contact number is required"),
  address:      Yup.string().required("Address is required"),
  hospPlan:     Yup.string(),
  hospCaseType: Yup.string(),
  remarks:      Yup.string().required("Remarks is required"),
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
  schedules = [],
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

  // Clear machine selection when modality changes
  const prevModalityRef = useRef(initialValues.modality);
  useEffect(() => {
    if (prevModalityRef.current !== formik.values.modality) {
      formik.setFieldValue("machine", "");
      prevModalityRef.current = formik.values.modality;
    }
  }, [formik.values.modality]);

  // ─── Conflict blocking: mirrors backend validateNoConflict (Radiology) ───
  // Fetches ALL active schedules for the selected date from the server so
  // blocking is never limited by the current page/tab.
  const selectedRadiologistId = formik.values.radiologist;
  const selectedMachineId     = formik.values.machine;
  const selectedPatientId     = formik.values.patientId;
  const selectedDate          = formik.values.date;

  const selectedRadiologistName = radiologists.find(
    (r) => String(r.doctorId) === String(selectedRadiologistId)
  )?.name ?? null;

  const selectedMachineName = machines.find(
    (m) => String(m.machineId) === String(selectedMachineId)
  )?.machineName ?? null;

  const [allDateSchedules, setAllDateSchedules] = useState([]);

  // Fetch every active radiology schedule on the selected date (all pages)
  useEffect(() => {
    if (!selectedDate) { setAllDateSchedules([]); return; }
    const token = localStorage.getItem("token");
    axios
      .get("/api/getRadiologySched", {
        headers: { Authorization: `Bearer ${token}` },
        params:  { page: 0, size: 1000 },
      })
      .then((res) => {
        const all = res.data?.content ?? [];
        setAllDateSchedules(
          all.filter((s) => {
            if (INACTIVE_STATUSES.includes(s.scheduleStatus)) return false;
            return s.startDateTime?.toString().slice(0, 10) === selectedDate;
          })
        );
      })
      .catch(() => setAllDateSchedules([]));
  }, [selectedDate]);

  // 1. Doctor conflicts
  const doctorBookedRanges = useMemo(() => {
    if (!selectedRadiologistName) return [];
    return allDateSchedules
      .filter((s) => s.name === selectedRadiologistName)
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [allDateSchedules, selectedRadiologistName]);

  // 2. Machine conflicts
  const machineBookedRanges = useMemo(() => {
    if (!selectedMachineName) return [];
    return allDateSchedules
      .filter((s) => s.machineName === selectedMachineName)
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [allDateSchedules, selectedMachineName]);

  // 3. Patient conflicts
  const patientBookedRanges = useMemo(() => {
    if (!selectedPatientId) return [];
    return allDateSchedules
      .filter((s) => String(s.patientId) === String(selectedPatientId))
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [allDateSchedules, selectedPatientId]);

  // Merge all three — a slot is blocked if any resource conflicts
  const { startBlocked, endBlocked } = useMemo(() => {
    const { startBlocked: dS, endBlocked: dE } = buildBlockedSets(doctorBookedRanges);
    const { startBlocked: mS, endBlocked: mE } = buildBlockedSets(machineBookedRanges);
    const { startBlocked: pS, endBlocked: pE } = buildBlockedSets(patientBookedRanges);
    return {
      startBlocked: new Set([...dS, ...mS, ...pS]),
      endBlocked:   new Set([...dE, ...mE, ...pE]),
    };
  }, [doctorBookedRanges, machineBookedRanges, patientBookedRanges]);

  // Clear time fields whenever any blocking dimension changes
  const prevRadiologistRef = useRef(selectedRadiologistId);
  const prevMachineRef     = useRef(selectedMachineId);
  const prevPatientRef     = useRef(selectedPatientId);
  const prevDateRef        = useRef(selectedDate);
  useEffect(() => {
    if (
      prevRadiologistRef.current !== selectedRadiologistId ||
      prevMachineRef.current     !== selectedMachineId     ||
      prevPatientRef.current     !== selectedPatientId     ||
      prevDateRef.current        !== selectedDate
    ) {
      formik.setFieldValue("startTime", "");
      formik.setFieldValue("endTime",   "");
      prevRadiologistRef.current = selectedRadiologistId;
      prevMachineRef.current     = selectedMachineId;
      prevPatientRef.current     = selectedPatientId;
      prevDateRef.current        = selectedDate;
    }
  }, [selectedRadiologistId, selectedMachineId, selectedPatientId, selectedDate]);


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
          {/* ModalityResponseDTO: modalityId, modalityName — filters machine list */}
          <SelectField
            formik={formik}
            field="modality"
            placeholder="Select Modality"
            options={modalities}
            keyProp="modalityId"
            valueProp="modalityId"
            labelProp="modalityName"
            disabled={false}
          />
        </FormField>

        <FormField label="Machine" error={formik.touched.machine && formik.errors.machine}>
          {/* MachineResponseDTO: machineId, machineName, modalityName — filtered by selected modality */}
          <SelectField
            formik={formik}
            field="machine"
            placeholder="Select Machine"
            options={
              formik.values.modality
                ? machines.filter(
                    (m) =>
                      modalities.find(
                        (mod) => String(mod.modalityId) === String(formik.values.modality)
                      )?.modalityName === m.modalityName
                  )
                : machines
            }
            keyProp="machineId"
            valueProp="machineId"
            labelProp="machineName"
          />
        </FormField>
      </div>

      <FormField label="Date" error={formik.touched.date && formik.errors.date}>
        <input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          className={ic("date")}
          {...formik.getFieldProps("date")}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
          <TimeDropdown formik={formik} field="startTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
        </FormField>

        <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
          <TimeDropdown formik={formik} field="endTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
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
              <option value="" disabled>Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
          <input
            type="text"
            placeholder="e.g. 09123456789"
            className={ic("contactNo")}
            {...formik.getFieldProps("contactNo")}
          />
        </FormField>

        <FormField label="Address" error={formik.touched.address && formik.errors.address}>
          <input
            type="text"
            placeholder="Full address"
            className={ic("address")}
            {...formik.getFieldProps("address")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
          <SelectField
            formik={formik}
            field="hospPlan"
            placeholder="Select Plan"
            options={hospPlans}
            keyProp="planId"
            valueProp="planId"
            labelProp="companyName"
          />
        </FormField>

        <FormField label="Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
          <SelectField
            formik={formik}
            field="hospCaseType"
            placeholder="Select Case Type"
            options={hospCaseTypes}
            keyProp="typeId"
            valueProp="typeId"
            labelProp="typeName"
          />
        </FormField>
      </div>

      <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
        <textarea
          rows={3}
          placeholder="Additional notes…"
          className={`${ic("remarks")} resize-none`}
          {...formik.getFieldProps("remarks")}
        />
      </FormField>

      <ModalFooter
        submitLabel={submitLabel}
        onCancel={onClose}
        isSubmitting={formik.isSubmitting}
      />
    </form>
  );
}



function formatTimeAMPM(hhmm) {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function ViewPatientModal({ patient, onClose }) {
  const ro = readonlyInputClass;
  const { date: initDate, time: initStartTime } = splitDatetime(patient.startDateTime);
  const { time: initEndTime }                   = splitDatetime(patient.endDateTime);

  return (
    <Modal title="View Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

        {/* Patient Name */}
        <FormField label="Patient Name">
          <input readOnly value={patient.patientName ?? "—"} className={ro} />
        </FormField>

        {/* Procedure */}
        <FormField label="Procedure">
          <input readOnly value={patient.procedureName ?? "—"} className={ro} />
        </FormField>

        {/* Radiologist */}
        <FormField label="Radiologist">
          <input readOnly value={patient.name ?? "—"} className={ro} />
        </FormField>

        {/* Machine + Status side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Machine">
            <input readOnly value={patient.machineName ?? "—"} className={ro} />
          </FormField>
          <FormField label="Status">
            <input
              readOnly
              value={patient.scheduleStatus ?? "—"}
              className={ro}
            />
          </FormField>
        </div>

        {/* Date */}
        <FormField label="Date">
          <input readOnly type="date" value={initDate} className={ro} />
        </FormField>

        {/* Start Time + End Time with AM/PM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Start Time">
            <input readOnly value={formatTimeAMPM(initStartTime)} className={ro} />
          </FormField>
          <FormField label="End Time">
            <input readOnly value={formatTimeAMPM(initEndTime)} className={ro} />
          </FormField>
        </div>

        {/* Hosp Plan + Case Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Hospitalization Plan">
            <input readOnly value={patient.hospitalizationPlan ?? "—"} className={ro} />
          </FormField>
          <FormField label="Hospitalization Case Type">
            <input readOnly value={patient.hospitalizationType ?? "—"} className={ro} />
          </FormField>
        </div>

        {/* Remarks */}
        <FormField label="Remarks">
          <textarea
            readOnly
            rows={4}
            value={patient.remarks ?? ""}
            placeholder="No remarks"
            className={`${ro} resize-none`}
          />
        </FormField>

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





// ─── Separate Edit modal — patient info read-only, schedule fields editable ──
const editScheduleSchema = Yup.object({
  radiologist:  Yup.string().required("Radiologist is required"),
  procedure:    Yup.string().required("Procedure is required"),
  modality:     Yup.string(),
  machine:      Yup.string().required("Machine is required"),
  date:         Yup.string().required("Date is required")
    .test("not-past", "Date cannot be in the past", (val) => {
      if (!val) return true;
      return val >= new Date().toISOString().slice(0, 10);
    }),
  startTime:    Yup.string().required("Start time is required"),
  endTime:      Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  hospPlan:     Yup.string(),
  hospCaseType: Yup.string(),
  remarks:      Yup.string().required("Remarks is required"),
});

function EditScheduleModal({
  schedule,
  radiologists,
  modalities,
  machines,
  hospPlans,
  hospCaseTypes,
  schedules,
  onSubmit,
  onClose,
}) {
  const { date: initDate, time: initStartTime } = splitDatetime(schedule.startDateTime);
  const { time: initEndTime }                   = splitDatetime(schedule.endDateTime);

  const initRadiologistId = String(radiologists.find((r) => r.name === schedule.name)?.doctorId ?? "");
  const matchedMachine    = machines.find((m) => m.machineName === schedule.machineName);
  const initMachineId     = String(matchedMachine?.machineId ?? "");
  const initModalityId    = String(modalities.find((mod) => mod.modalityName === matchedMachine?.modalityName)?.modalityId ?? "");
  const initHospPlanId    = String(hospPlans.find((p) => p.companyName === schedule.hospitalizationPlan)?.planId ?? "");
  const initHospTypeId    = String(hospCaseTypes.find((c) => c.typeName === schedule.hospitalizationType)?.typeId ?? "");

  const formik = useFormik({
    initialValues: {
      radiologist:  initRadiologistId,
      procedure:    schedule.procedureName ?? "",
      modality:     initModalityId,
      machine:      initMachineId,
      date:         initDate,
      startTime:    initStartTime,
      endTime:      initEndTime,
      hospPlan:     initHospPlanId,
      hospCaseType: initHospTypeId,
      remarks:      schedule.remarks ?? "",
    },
    validationSchema: editScheduleSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch (err) {
        console.error("Edit submit error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const ic = useInputClass(formik);

  // Clear machine when modality changes
  const prevModalityRef = useRef(formik.values.modality);
  useEffect(() => {
    if (prevModalityRef.current !== formik.values.modality) {
      formik.setFieldValue("machine", "");
      prevModalityRef.current = formik.values.modality;
    }
  }, [formik.values.modality]);


  // ─── Conflict blocking: mirrors backend validateNoConflict (Radiology) ───
  // Fetches ALL active schedules for the selected date from the server so
  // blocking is never limited by the current page/tab. Excludes this schedule (edit mode).
  const selectedRadiologistId   = formik.values.radiologist;
  const selectedMachineId       = formik.values.machine;
  const selectedDate            = formik.values.date;
  const selectedRadiologistName = radiologists.find(
    (r) => String(r.doctorId) === String(selectedRadiologistId)
  )?.name ?? null;

  const selectedMachineName = machines.find(
    (m) => String(m.machineId) === String(selectedMachineId)
  )?.machineName ?? null;

  const [allDateSchedules, setAllDateSchedules] = useState([]);

  // Fetch every active radiology schedule on the selected date (all pages)
  useEffect(() => {
    if (!selectedDate) { setAllDateSchedules([]); return; }
    const token = localStorage.getItem("token");
    axios
      .get("/api/getRadiologySched", {
        headers: { Authorization: `Bearer ${token}` },
        params:  { page: 0, size: 1000 },
      })
      .then((res) => {
        const all = res.data?.content ?? [];
        setAllDateSchedules(
          all.filter((s) => {
            if (INACTIVE_STATUSES.includes(s.scheduleStatus)) return false;
            if (s.scheduleId === schedule.scheduleId)         return false; // exclude self
            return s.startDateTime?.toString().slice(0, 10) === selectedDate;
          })
        );
      })
      .catch(() => setAllDateSchedules([]));
  }, [selectedDate]);

  // 1. Doctor conflicts (exclude self)
  const doctorBookedRanges = useMemo(() => {
    if (!selectedRadiologistName) return [];
    return allDateSchedules
      .filter((s) => s.name === selectedRadiologistName)
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [allDateSchedules, selectedRadiologistName]);

  // 2. Machine conflicts (exclude self)
  const machineBookedRanges = useMemo(() => {
    if (!selectedMachineName) return [];
    return allDateSchedules
      .filter((s) => s.machineName === selectedMachineName)
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [allDateSchedules, selectedMachineName]);

  // 3. Patient conflicts (exclude self — patient is fixed in edit mode)
  const patientBookedRanges = useMemo(() => {
    if (!schedule.patientId) return [];
    return allDateSchedules
      .filter((s) => String(s.patientId) === String(schedule.patientId))
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [allDateSchedules, schedule.patientId]);

  // Merge all three
  const { startBlocked, endBlocked } = useMemo(() => {
    const { startBlocked: dS, endBlocked: dE } = buildBlockedSets(doctorBookedRanges);
    const { startBlocked: mS, endBlocked: mE } = buildBlockedSets(machineBookedRanges);
    const { startBlocked: pS, endBlocked: pE } = buildBlockedSets(patientBookedRanges);
    return {
      startBlocked: new Set([...dS, ...mS, ...pS]),
      endBlocked:   new Set([...dE, ...mE, ...pE]),
    };
  }, [doctorBookedRanges, machineBookedRanges, patientBookedRanges]);

  const prevRadiologistRef = useRef(selectedRadiologistId);
  const prevMachineRef     = useRef(selectedMachineId);
  const prevDateRef        = useRef(selectedDate);
  useEffect(() => {
    if (
      prevRadiologistRef.current !== selectedRadiologistId ||
      prevMachineRef.current     !== selectedMachineId     ||
      prevDateRef.current        !== selectedDate
    ) {
      formik.setFieldValue("startTime", "");
      formik.setFieldValue("endTime",   "");
      prevRadiologistRef.current = selectedRadiologistId;
      prevMachineRef.current     = selectedMachineId;
      prevDateRef.current        = selectedDate;
    }
  }, [selectedRadiologistId, selectedMachineId, selectedDate]);


  return (
    <Modal title="Edit Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

        {/* Patient Name — read-only */}
        <FormField label="Patient Name">
          <input readOnly value={schedule.patientName ?? "—"} className={readonlyInputClass} />
        </FormField>

        {/* Procedure */}
        <FormField label="Procedure" error={formik.touched.procedure && formik.errors.procedure}>
          <input
            type="text"
            placeholder="e.g. Brain MRI"
            className={ic("procedure")}
            {...formik.getFieldProps("procedure")}
          />
        </FormField>

        {/* Radiologist */}
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

        {/* Modality + Machine */}
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
              options={
                formik.values.modality
                  ? machines.filter(
                      (m) =>
                        modalities.find(
                          (mod) => String(mod.modalityId) === String(formik.values.modality)
                        )?.modalityName === m.modalityName
                    )
                  : machines
              }
              keyProp="machineId"
              valueProp="machineId"
              labelProp="machineName"
            />
          </FormField>
        </div>

        {/* Date */}
        <FormField label="Date" error={formik.touched.date && formik.errors.date}>
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            className={ic("date")}
            {...formik.getFieldProps("date")}
          />
        </FormField>

        {/* Start + End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
            <TimeDropdown formik={formik} field="startTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
          </FormField>
          <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
            <TimeDropdown formik={formik} field="endTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
          </FormField>
        </div>

        {/* Hosp Plan + Case Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
            <SelectField
              formik={formik}
              field="hospPlan"
              placeholder="Select Plan"
              options={hospPlans}
              keyProp="planId"
              valueProp="planId"
              labelProp="companyName"
            />
          </FormField>
          <FormField label="Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
            <SelectField
              formik={formik}
              field="hospCaseType"
              placeholder="Select Case Type"
              options={hospCaseTypes}
              keyProp="typeId"
              valueProp="typeId"
              labelProp="typeName"
            />
          </FormField>
        </div>

        {/* Remarks */}
        <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
          <textarea
            rows={3}
            placeholder="Additional notes…"
            className={`${ic("remarks")} resize-none`}
            {...formik.getFieldProps("remarks")}
          />
        </FormField>

        <ModalFooter
          submitLabel="Save Changes"
          onCancel={onClose}
          isSubmitting={formik.isSubmitting}
        />
      </form>
    </Modal>
  );
}

export default function RadioScheduleManagement() {
  const [activeTab,      setActiveTab]      = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
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

  const [page,           setPage]           = useState(0);
  const [totalPages,     setTotalPages]     = useState(1);
  const [modalityFilter, setModalityFilter] = useState("");

  // Reset search and modality when tab changes
  useEffect(() => { setSearchQuery(""); setModalityFilter(""); }, [activeTab]);

  // Reset to page 0 whenever tab, search, or modality filter changes
  useEffect(() => { setPage(0); }, [activeTab, searchQuery, modalityFilter]);

  // Re-fetch whenever tab, search, modality filter, or page changes
  useEffect(() => { fetchSchedules(); }, [activeTab, searchQuery, modalityFilter, page]);

  useEffect(() => { fetchDropdownData(); }, []);

  // ─── Fetch schedules (server-side filtered + paginated) ──────────────────
  // GET /api/getRadiologySched
  //   scheduleStatus = tab filter (omit for All)
  //   patientName    = patient name search
  //   page / size    = Spring Pageable params
  async function fetchSchedules() {
    setLoading(true);
    try {
      const headers     = getAuthHeader();
      const patientName = searchQuery.trim() || undefined;

      if (activeTab === "All") {
        // Fetch every page for each status using the backend's own pagination,
        // then merge and paginate client-side. No hardcoded size cap.
        async function fetchAllPages(status) {
          const records = [];
          let pageNum   = 0;
          while (true) {
            const res = await axios.get("/api/getRadiologySched", {
              headers,
              params: {
                scheduleStatus: status,
                page: pageNum,
                size: 50,
                ...(patientName && { patientName }),
              },
            });
            records.push(...(res.data?.content ?? []));
            if (res.data?.last !== false) break;
            pageNum++;
          }
          return records;
        }

        const ALL_STATUSES = ["Scheduled", "Confirmed", "Cancelled", "Done"];
        const results = await Promise.all(ALL_STATUSES.map(fetchAllPages));

        // Merge and sort by status priority then date
        const merged = results.flat();
        const STATUS_PRIORITY = { Scheduled: 0, Confirmed: 1, Cancelled: 2, Done: 3 };
        merged.sort((a, b) => {
          const pa = STATUS_PRIORITY[a.scheduleStatus] ?? 99;
          const pb = STATUS_PRIORITY[b.scheduleStatus] ?? 99;
          if (pa !== pb) return pa - pb;
          const da = a.startDateTime ? new Date(String(a.startDateTime).replace(" ", "T")) : 0;
          const db = b.startDateTime ? new Date(String(b.startDateTime).replace(" ", "T")) : 0;
          return da - db;
        });

        // Apply modality filter on the complete dataset before paginating
        const afterModality = modalityFilter
          ? merged.filter((s) => {
              const machine = machines.find((m) => m.machineName === s.machineName);
              return machine?.modalityName === modalityFilter;
            })
          : merged;

        const PAGE_SIZE = 10;
        const totalPgs  = Math.max(1, Math.ceil(afterModality.length / PAGE_SIZE));
        const safePage  = Math.min(page, totalPgs - 1);
        setSchedules(afterModality.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE));
        setTotalPages(totalPgs);
      } else if (modalityFilter) {
        // Modality filter active on a specific tab — must fetch all pages to filter correctly,
        // then paginate client-side on the filtered result.
        const records = [];
        let pageNum   = 0;
        while (true) {
          const res = await axios.get("/api/getRadiologySched", {
            headers,
            params: {
              scheduleStatus: activeTab,
              page: pageNum,
              size: 50,
              ...(patientName && { patientName }),
            },
          });
          records.push(...(res.data?.content ?? []));
          if (res.data?.last !== false) break;
          pageNum++;
        }
        const afterModality = records.filter((s) => {
          const machine = machines.find((m) => m.machineName === s.machineName);
          return machine?.modalityName === modalityFilter;
        });
        const PAGE_SIZE = 10;
        const totalPgs  = Math.max(1, Math.ceil(afterModality.length / PAGE_SIZE));
        const safePage  = Math.min(page, totalPgs - 1);
        setSchedules(afterModality.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE));
        setTotalPages(totalPgs);
      } else {
        // No modality filter — let the server paginate directly
        const res = await axios.get("/api/getRadiologySched", {
          headers,
          params: {
            scheduleStatus: activeTab,
            page,
            size: 10,
            ...(patientName && { patientName }),
          },
        });
        setSchedules(res.data?.content    ?? []);
        setTotalPages(res.data?.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Fetch dropdown data ──────────────────────────────────────────────────
  // Dropdown endpoints return plain Lists (not paginated), same pattern as Rehab.
  async function fetchDropdownData() {
    try {
      const headers = getAuthHeader();

      const [radioRes, modalityRes, machineRes, planRes, typeRes] = await Promise.all([
        // GET /api/radiologistDropdown → List<DoctorsResponseDTO> (doctorId, name)
        axios.get("/api/radiologistDropdown", { headers }),
        // GET /api/modalityDropdown → List<ModalityResponseDTO> (modalityId, modalityName)
        axios.get("/api/modalityDropdown", { headers }),
        // GET /api/machineDropdown → List<MachineResponseDTO> (machineId, machineName, machineStatus, modalityName)
        axios.get("/api/machineDropdown", { headers }),
        // GET /api/plansDropdown → List<HospitalizationPlanResponseDTO> (planId, companyName, code)
        axios.get("/api/plansDropdown", { headers }),
        // GET /api/typesDropdown → List<HospitalizationTypeResponseDTO> (typeId, typeName)
        axios.get("/api/typesDropdown", { headers }),
      ]);

      // Dropdown endpoints return plain Lists, not paginated
      setRadiologists( Array.isArray(radioRes.data)    ? radioRes.data    : radioRes.data?.content    ?? []);
      setModalities(   Array.isArray(modalityRes.data)  ? modalityRes.data  : modalityRes.data?.content  ?? []);
      // Only show non-archived machines
      setMachines(
        (Array.isArray(machineRes.data) ? machineRes.data : machineRes.data?.content ?? [])
          .filter((m) => m.machineStatus !== "Archived")
      );
      setHospPlans(    Array.isArray(planRes.data)      ? planRes.data      : planRes.data?.content      ?? []);
      setHospCaseTypes(Array.isArray(typeRes.data)      ? typeRes.data      : typeRes.data?.content      ?? []);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }

  // Modality filtering is now handled inside fetchSchedules;
  // schedules already contains the correctly filtered + paginated result.
  const filtered = schedules;

  // ─── Status update (Confirm / Cancel / Archive / Unarchive / Done) ─────────
  async function updateStatus(id, status) {
    const endpointMap = {
      Confirmed: `/api/confirmSchedule/${id}`,
      Cancelled: `/api/cancelSchedule/${id}`,
      Archived:  `/api/archiveSchedule/${id}`,
      Scheduled: `/api/restoreSchedule/${id}`,
      Done:      `/api/doneSchedule/${id}`,
    };
    const url = endpointMap[status];
    if (!url) return;
    try {
      await axios.put(url, {}, { headers: getAuthHeader() });
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

  // ─── Create schedule ───────────────────────────────────────────────────────
  // Backend: POST /api/createScheduleAndPatient → CreatePatientWithScheduleResponseDTO
  //   existingPatientId  → looks up existing patient by ID
  //   patient            → creates new patient (ignored when existingPatientId is set)
  //   schedules          → schedule with nested doctor/machine/hospPlan/hospType
  async function handleCreate(values) {
    const isExisting = !!values.patientId;

    const payload = {
      existingPatientId: isExisting ? Number(values.patientId) : null,

      patient: isExisting ? null : {
        name:          values.patientName,
        birthDate:     values.dob,
        sex:           values.sex,
        contactNumber: values.contactNo,
        address:       values.address,
      },

      schedules: {
        startDateTime:       buildDatetime(values.date, values.startTime),
        endDateTime:         buildDatetime(values.date, values.endTime),
        procedureName:       values.procedure,
        remarks:             values.remarks || null,
        doctor:              { doctorId: Number(values.radiologist) },
        machine:             values.machine ? { machineId: Number(values.machine) } : null,
        hospitalizationPlan: values.hospPlan     ? { planId: Number(values.hospPlan) }     : null,
        hospitalizationType: values.hospCaseType ? { typeId: Number(values.hospCaseType) } : null,
      },
    };

    await axios.post("/api/createScheduleAndPatient", payload, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  // ─── Edit schedule ─────────────────────────────────────────────────────────
  // Backend: PATCH /api/updateSchedule/{id} → SchedulePatchRequest
  async function handleEdit(values) {
    const payload = {
      startDateTime:  buildDatetime(values.date, values.startTime),
      endDateTime:    buildDatetime(values.date, values.endTime),
      procedureName:  values.procedure,
      remarks:        values.remarks || null,
      doctorId:       Number(values.radiologist),
      machineId:      values.machine ? Number(values.machine) : -1,
    };

    await axios.patch(
      `/api/updateSchedule/${editPatient.scheduleId}`,
      payload,
      { headers: getAuthHeader() }
    );
    await fetchSchedules();
  }

  function toEditInitial(s) {
    // ScheduleResponseDTO fields: startDateTime, endDateTime, name (doctor), procedureName, machineName
    const { date, time: startTime } = splitDatetime(s.startDateTime);
    const { time: endTime }         = splitDatetime(s.endDateTime);

    // Resolve names back to IDs using the dropdown lists
    const initRadiologistId = String(radiologists.find((r) => r.name        === s.name)?.doctorId    ?? "");
    const matchedMachine    = machines.find((m)    => m.machineName        === s.machineName);
    const initMachineId     = String(matchedMachine?.machineId ?? "");
    // Resolve modality from the matched machine's modalityName
    const initModalityId    = String(modalities.find((mod) => mod.modalityName === matchedMachine?.modalityName)?.modalityId ?? "");
    const initHospPlanId    = String(hospPlans.find((p)     => p.companyName === s.hospitalizationPlan)?.planId ?? "");
    const initHospTypeId    = String(hospCaseTypes.find((c) => c.typeName    === s.hospitalizationType)?.typeId ?? "");

    return {
      radiologist:  initRadiologistId,
      procedure:    s.procedureName ?? "",
      modality:     initModalityId,
      machine:      initMachineId,
      date,
      startTime,
      endTime,
      patientName:  s.patientName   ?? "",
      patientId:    "",
      sex:          s.sex           ?? "",
      dob:          s.birthDate     ?? "",
      contactNo:    s.contactNumber ?? "",
      address:      s.address       ?? "",
      hospPlan:     initHospPlanId,
      hospCaseType: initHospTypeId,
      remarks:      s.remarks       ?? "",
    };
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  return (
    <AdminLayout
      navItems={radiologyNavItems}
      pageTitle={
        <span className="flex items-center gap-3">
          Schedule Management
          {modalities.length > 0 && (
            <ModalityDropdown
              value={modalityFilter}
              onChange={setModalityFilter}
              modalities={modalities}
            />
          )}
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
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(s) => (
          <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            {/* ScheduleResponseDTO: patientName */}
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.patientName}</td>
            {/* ScheduleResponseDTO: startDateTime */}
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {formatDate(s.startDateTime)}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime && s.endDateTime
                ? `${formatTime(s.startDateTime)} - ${formatTime(s.endDateTime)}`
                : "—"}
            </td>
            {/* ScheduleResponseDTO: name = doctor name */}
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.name ?? "—"}</td>
            {/* ScheduleResponseDTO: machineName */}
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.machineName ?? "—"}</td>
            {/* ScheduleResponseDTO: scheduleStatus */}
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.scheduleStatus)}`}>
              {s.scheduleStatus ? s.scheduleStatus.charAt(0).toUpperCase() + s.scheduleStatus.slice(1) : "—"}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getActions(s.scheduleStatus)}
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
            schedules={schedules}
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
        <EditScheduleModal
          schedule={editPatient}
          radiologists={radiologists}
          modalities={modalities}
          machines={machines}
          hospPlans={hospPlans}
          hospCaseTypes={hospCaseTypes}
          schedules={schedules}
          onSubmit={handleEdit}
          onClose={() => setEditPatient(null)}
        />
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