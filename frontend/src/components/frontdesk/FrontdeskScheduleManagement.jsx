import { useState, useEffect, useRef, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive, CheckCircle,
  Eye, UserCheck, UserX, Pencil, Trash2, RefreshCw, ChevronDown, Search, X,
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
  readonlyInputClass,
  scheduleStatusColor,
  ConfirmDialog,
} from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";


const TABS = [
  { label: "All",       icon: Calendar      },
  { label: "Confirmed", icon: CalendarCheck },
  { label: "Cancelled", icon: CalendarX     },
  { label: "Scheduled", icon: Clock         },
  { label: "Archived",  icon: Archive       },
  { label: "Done",      icon: CheckCircle   },
];

const COLUMNS = ["Full Name", "Date", "Time", "Medical Professional", "Machine", "Room", "Status", "Action"];

const INACTIVE_STATUSES = ["Cancelled", "Done", "Archived"];

const confirmMeta = {
  accept:    { title: "Confirm Schedule?",   msg: (n) => `"${n}" will be marked as confirmed.`,  label: "Confirm",   danger: false },
  reject:    { title: "Cancel Schedule?",    msg: (n) => `"${n}" will be marked as cancelled.`,  label: "Cancel",    danger: true  },
  archive:   { title: "Archive Schedule?",   msg: (n) => `"${n}" will be moved to the archive.`, label: "Archive",   danger: true  },
  unarchive: { title: "Unarchive Schedule?", msg: (n) => `"${n}" will be restored to pending.`,  label: "Unarchive", danger: false },
  done:      { title: "Mark as Done?",       msg: (n) => `"${n}" will be marked as done.`,       label: "Done",      danger: false },
};

const BLANK_FORM = {
  professional: "",
  procedure:    "",
  modality:     "",
  machine:      "",
  room:         "",
  date:         new Date().toLocaleDateString("en-CA"),
  startTime:    "",
  endTime:      "",
  firstName:    "",
  middleName:   "",
  lastName:     "",
  patientId:    "",
  patientFullName: "",
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

function formatTimeAMPM(hhmm) {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function getActions(status) {
  switch (status?.toLowerCase()) {
    case "confirmed": return [{ label: "View", icon: Eye }, { label: "Edit", icon: Pencil }, { label: "Cancel", icon: UserX }, { label: "Done", icon: UserCheck }];
    case "cancelled": return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default: return [
      { label: "View",    icon: Eye                   },
      { label: "Edit",    icon: Pencil                },
      { label: "Confirm", icon: UserCheck             },
      { label: "Cancel",  icon: UserX                 },
      { label: "Archive", icon: Trash2, danger: true  },
    ];
  }
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
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

  const label = value === "all"
    ? "All Modalities"
    : modalities.find((m) => m.modalityName === value)?.modalityName ?? "All Modalities";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
      >
        {label}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-auto bg-white rounded-xl shadow-card border border-gray-100 py-1 z-50">
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
              ${value === "all"
                ? "text-primary font-semibold bg-primary/5"
                : "text-gray-600 hover:bg-primary/5 hover:text-primary"}`}
          >
            All Modalities
          </button>
          {modalities.map((m) => (
            <button
              key={m.modalityId}
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


function toMins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toSlot(mins) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

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

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh     = String(h).padStart(2, "0");
      const mm     = String(m).padStart(2, "0");
      const value  = `${hh}:${mm}`;
      const period = h < 12 ? "AM" : "PM";
      const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
      opts.push({ value, label: `${h12}:${mm} ${period}` });
    }
  }
  return opts;
})();


function TimeDropdown({ formik, field, startBlocked = new Set(), endBlocked = new Set(), selectedDate = "" }) {
  const ic         = useInputClass(formik);
  const startTime  = formik.values.startTime;
  const blockedSet = field === "startTime" ? startBlocked : endBlocked;
  const today      = new Date().toLocaleDateString("en-CA");
  const isToday    = selectedDate === today;
  const isPastDate = selectedDate && selectedDate < today;
  const nowMins    = isPastDate ? 24 * 60 : isToday
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
          const isPast        = (isToday || isPastDate) && toMins(opt.value) <= nowMins;
          const disabled      = isBlocked || isBeforeStart || isPast;
          if (isPast || (isPastDate && disabled)) return null;
          return (
            <option key={opt.value} value={opt.value} disabled={disabled}>
              {opt.label}{isBlocked ? " (Booked)" : ""}
            </option>
          );
        })}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// FIX: added `required` prop — when true, placeholder is disabled (required fields);
//      when false/omitted, placeholder is selectable (optional fields, acts as clear).
function SelectField({ formik, field, placeholder, options, keyProp, valueProp, labelProp, disabled, required }) {
  const ic = useInputClass(formik);
  return (
    <div className="relative">
      <select
        className={`${ic(field)} appearance-none cursor-pointer`}
        {...formik.getFieldProps(field)}
        disabled={disabled}
      >
        <option value="" disabled={required}>{placeholder}</option>
        {options.map((o) => (
          <option key={o[keyProp]} value={o[valueProp]}>{o[labelProp]}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}


function SectionGroup({ title, children }) {
  return (
    <fieldset className="border border-gray-200 rounded-xl px-4 pt-2 pb-4">
      <legend className="px-2 text-xs font-semibold text-primary uppercase tracking-wide">
        {title}
      </legend>
      <div className="space-y-3 mt-1">{children}</div>
    </fieldset>
  );
}


function PatientSearchableInput({ formik }) {
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState([]);
  const [open,       setOpen]       = useState(false);
  const [searching,  setSearching]  = useState(false);
  const [isExisting, setIsExisting] = useState(!!formik.values.patientId);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setIsExisting(!!formik.values.patientId);
    if (!formik.values.patientId) setQuery("");
  }, [formik.values.patientId]);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setIsExisting(false);
    formik.setFieldValue("patientId", "");

    if (!val.trim()) { setResults([]); setOpen(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await axios.get(`/api/SearchName/${encodeURIComponent(val.trim())}`, {
          headers: getAuthHeader(),
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setResults(list);
        setOpen(list.length > 0);
      } catch {
        setResults([]); setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  function handleSelect(patient) {
    setIsExisting(true); setOpen(false); setResults([]);
    setQuery(patient.fullName ?? "");
    formik.setFieldValue("patientId",       String(patient.patientId ?? ""));
    formik.setFieldValue("patientFullName", patient.fullName          ?? "");

    formik.setFieldValue("firstName",  "");
    formik.setFieldValue("middleName", "");
    formik.setFieldValue("lastName",   "");
    formik.setFieldValue("sex",        patient.sex           ?? "");
    formik.setFieldValue("dob",        patient.birthDate      ?? "");
    formik.setFieldValue("contactNo",  patient.contactNumber  ?? "");
    formik.setFieldValue("address",    patient.address        ?? "");
  }

  function handleClear() {
    setQuery(""); setIsExisting(false); setResults([]); setOpen(false);
    ["firstName","middleName","lastName","patientId","patientFullName","sex","dob","contactNo","address"].forEach(
      (f) => formik.setFieldValue(f, "")
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search size={15} />
        </span>
        <input
          type="text" value={query} onChange={handleInputChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search existing patient…"
          className={`w-full py-2.5 pl-9 pr-9 rounded-xl border bg-surface-input
            text-primary placeholder-gray-400 text-sm
            focus:outline-none focus:ring-2 focus:border-primary
            transition-all duration-200
            ${isExisting ? "border-green-400 focus:ring-green-200" : "border-surface-border focus:ring-primary/30"}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {searching
            ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
            : query
            ? <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={15} /></button>
            : null}
        </span>
      </div>

      {isExisting && (
        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
          <CheckCircle size={12} /> Existing patient — info auto-filled
        </p>
      )}
      {!isExisting && (
        <p className="text-xs text-blue-500 font-medium mt-1">Or fill in the name fields below for a new patient</p>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-card border border-gray-100 py-1 max-h-52 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.patientId} type="button" onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <span className="font-medium">{p.fullName}</span>
              {p.birthDate     && <span className="ml-2 text-xs text-gray-400">DOB: {p.birthDate}</span>}
              {p.contactNumber && <span className="ml-2 text-xs text-gray-400">{p.contactNumber}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function useDateSchedules(selectedDate) {
  const [dateSchedules, setDateSchedules] = useState([]);
  useEffect(() => {
    if (!selectedDate) { setDateSchedules([]); return; }
    let cancelled = false;
    axios
      .get("/api/getSchedules", {
        headers: getAuthHeader(),
        params:  { page: 0, size: 500 },
      })
      .then((res) => {
        if (!cancelled) {
          const all = res.data?.content ?? [];
          setDateSchedules(
            all.filter((s) =>
              s.startDateTime?.toString().slice(0, 10) === selectedDate &&
              !INACTIVE_STATUSES.includes(s.scheduleStatus)
            )
          );
        }
      })
      .catch(() => { if (!cancelled) setDateSchedules([]); });
    return () => { cancelled = true; };
  }, [selectedDate]);
  return dateSchedules;
}

function useBookedRanges({ dateSchedules, selectedProfName, selectedMachineName, selectedRoomName, selectedDate, excludeId }) {
  return useMemo(() => {
    if (!selectedDate) return [];
    return dateSchedules
      .filter((s) => {
        if (excludeId != null && s.scheduleId === excludeId) return false;
        if (!s.startDateTime || !s.endDateTime) return false;
        return (
          (selectedProfName    && s.doctorFullName === selectedProfName)    ||
          (selectedMachineName && s.machineName    === selectedMachineName) ||
          (selectedRoomName    && s.roomName       === selectedRoomName)
        );
      })
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [dateSchedules, selectedProfName, selectedMachineName, selectedRoomName, selectedDate, excludeId]);
}


// FIX: hospPlan and hospCaseType are now required in both schemas
const scheduleSchema = Yup.object({
  professional: Yup.string().required("Medical professional is required"),
  procedure:    Yup.string().required("Procedure is required"),
  modality:     Yup.string(),
  machine:      Yup.string(),
  room:         Yup.string(),
  date:         Yup.string().required("Date is required")
    .test("not-past", "Date cannot be in the past", (val) => !val || val >= new Date().toLocaleDateString("en-CA")),
  startTime:    Yup.string().required("Start time is required"),
  endTime:      Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (v) {
      return !this.parent.startTime || !v || v > this.parent.startTime;
    }),
  patientId:    Yup.string(),
  firstName:    Yup.string().when("patientId", { is: (v) => !v, then: (s) => s.required("First name is required"), otherwise: (s) => s }),
  middleName:   Yup.string(),
  lastName:     Yup.string().when("patientId", { is: (v) => !v, then: (s) => s.required("Last name is required"),  otherwise: (s) => s }),
  sex:          Yup.string().when("patientId", { is: (v) => !v, then: (s) => s.required("Sex is required"),         otherwise: (s) => s }),
  dob:          Yup.string().when("patientId", { is: (v) => !v, then: (s) => s.required("Date of birth is required"), otherwise: (s) => s }),
  contactNo:    Yup.string().when("patientId", {
    is: (v) => !v,
    then: (s) => s.matches(/^\+?[0-9]{7,15}$/, "Enter a valid contact number").required("Contact number is required"),
    otherwise: (s) => s,
  }),
  address:      Yup.string().when("patientId", { is: (v) => !v, then: (s) => s.required("Address is required"), otherwise: (s) => s }),
  hospPlan:     Yup.string().required("Hospitalization plan is required"),
  hospCaseType: Yup.string().required("Case type is required"),
  remarks:      Yup.string().required("Remarks is required"),
});

const editScheduleSchema = Yup.object({
  professional: Yup.string().required("Medical professional is required"),
  procedure:    Yup.string().required("Procedure is required"),
  modality:     Yup.string(),
  machine:      Yup.string(),
  room:         Yup.string(),
  date:         Yup.string().required("Date is required")
    .test("not-past", "Date cannot be in the past", (val) => !val || val >= new Date().toLocaleDateString("en-CA")),
  startTime:    Yup.string().required("Start time is required"),
  endTime:      Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (v) {
      return !this.parent.startTime || !v || v > this.parent.startTime;
    }),
  hospPlan:     Yup.string().required("Hospitalization plan is required"),
  hospCaseType: Yup.string().required("Case type is required"),
  remarks:      Yup.string().required("Remarks is required"),
});


function ScheduleForm({ initialValues, submitLabel, onSubmit, onClose, professionals, modalities, machines, rooms, hospPlans, hospCaseTypes }) {
  const formik = useFormik({
    initialValues,
    validationSchema: scheduleSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try { await onSubmit(values); onClose(); }
      catch (err) { console.error("Form submit error:", err); }
      finally { setSubmitting(false); }
    },
  });
  const ic = useInputClass(formik);

  const prevModalityRef = useRef(initialValues.modality);
  useEffect(() => {
    if (prevModalityRef.current !== formik.values.modality) {
      formik.setFieldValue("machine", "");
      prevModalityRef.current = formik.values.modality;
    }
  }, [formik.values.modality]);

  const selectedProfId      = formik.values.professional;
  const selectedMachineId   = formik.values.machine;
  const selectedRoomId      = formik.values.room;
  const selectedDate        = formik.values.date;

  const selectedProfName    = professionals.find((p) => String(p.doctorId) === String(selectedProfId))?.fullName ?? null;
  const selectedMachineName = machines.find((m) => String(m.machineId) === String(selectedMachineId))?.machineName ?? null;
  const selectedRoomName    = rooms.find((r) => String(r.roomId) === String(selectedRoomId))?.roomName ?? null;

  const dateSchedules = useDateSchedules(selectedDate);
  const bookedRanges  = useBookedRanges({ dateSchedules, selectedProfName, selectedMachineName, selectedRoomName, selectedDate, excludeId: null });
  const { startBlocked, endBlocked } = useMemo(() => buildBlockedSets(bookedRanges), [bookedRanges]);

  const prevProfRef    = useRef(selectedProfId);
  const prevMachRef    = useRef(selectedMachineId);
  const prevRoomRef    = useRef(selectedRoomId);
  const prevDateRef    = useRef(selectedDate);
  useEffect(() => {
    if (
      prevProfRef.current  !== selectedProfId    ||
      prevMachRef.current  !== selectedMachineId ||
      prevRoomRef.current  !== selectedRoomId    ||
      prevDateRef.current  !== selectedDate
    ) {
      formik.setFieldValue("startTime", "");
      formik.setFieldValue("endTime",   "");
      prevProfRef.current  = selectedProfId;
      prevMachRef.current  = selectedMachineId;
      prevRoomRef.current  = selectedRoomId;
      prevDateRef.current  = selectedDate;
    }
  }, [selectedProfId, selectedMachineId, selectedRoomId, selectedDate]);

  const filteredMachines = formik.values.modality
    ? machines.filter((m) =>
        modalities.find((mod) => String(mod.modalityId) === String(formik.values.modality))?.modalityName === m.modalityName
      )
    : machines;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

      <SectionGroup title="Schedule Details">
        {/* FIX: required prop added — placeholder is disabled */}
        <FormField label="Medical Professional" error={formik.touched.professional && formik.errors.professional}>
          <SelectField formik={formik} field="professional" placeholder="Select Medical Professional"
            options={professionals} keyProp="doctorId" valueProp="doctorId" labelProp="fullName" required />
        </FormField>

        <FormField label="Procedure" error={formik.touched.procedure && formik.errors.procedure}>
          <input type="text" placeholder="e.g. Physical Therapy"
            className={ic("procedure")} {...formik.getFieldProps("procedure")} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* No required prop — placeholder is selectable (acts as clear) */}
          <FormField label="Modality" error={formik.touched.modality && formik.errors.modality}>
            <SelectField formik={formik} field="modality" placeholder="Select Modality (optional)"
              options={modalities} keyProp="modalityId" valueProp="modalityId" labelProp="modalityName" />
          </FormField>
          <FormField label="Machine" error={formik.touched.machine && formik.errors.machine}>
            <SelectField formik={formik} field="machine" placeholder="Select Machine (optional)"
              options={filteredMachines} keyProp="machineId" valueProp="machineId" labelProp="machineName" />
          </FormField>
        </div>

        <FormField label="Room" error={formik.touched.room && formik.errors.room}>
          <SelectField formik={formik} field="room" placeholder="Select Room (optional)"
            options={rooms} keyProp="roomId" valueProp="roomId" labelProp="roomName" />
        </FormField>

        <FormField label="Date" error={formik.touched.date && formik.errors.date}>
          <input type="date" min={new Date().toLocaleDateString("en-CA")}
            className={ic("date")} {...formik.getFieldProps("date")} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
            <TimeDropdown formik={formik} field="startTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
          </FormField>
          <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
            <TimeDropdown formik={formik} field="endTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
          </FormField>
        </div>
      </SectionGroup>

      <SectionGroup title="Patient Information">
        <FormField label="Search Existing Patient">
          <PatientSearchableInput formik={formik} />
        </FormField>

        {formik.values.patientId && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 space-y-3">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Patient Details (Read-only)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Full Name">
                <input readOnly value={formik.values.patientFullName || "—"} className={readonlyInputClass} />
              </FormField>
              <FormField label="Sex">
                <input readOnly value={formik.values.sex || "—"} className={readonlyInputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Date of Birth">
                <input readOnly value={formik.values.dob || "—"} className={readonlyInputClass} />
              </FormField>
              <FormField label="Contact No.">
                <input readOnly value={formik.values.contactNo || "—"} className={readonlyInputClass} />
              </FormField>
            </div>
            <FormField label="Address">
              <input readOnly value={formik.values.address || "—"} className={readonlyInputClass} />
            </FormField>
          </div>
        )}

        {!formik.values.patientId && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="First Name" error={formik.touched.firstName && formik.errors.firstName}>
                <input type="text" placeholder="First name"
                  className={ic("firstName")} {...formik.getFieldProps("firstName")} />
              </FormField>
              <FormField label="Middle Name" error={formik.touched.middleName && formik.errors.middleName}>
                <input type="text" placeholder="Middle name (optional)"
                  className={ic("middleName")} {...formik.getFieldProps("middleName")} />
              </FormField>
              <FormField label="Last Name" error={formik.touched.lastName && formik.errors.lastName}>
                <input type="text" placeholder="Last name"
                  className={ic("lastName")} {...formik.getFieldProps("lastName")} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Sex" error={formik.touched.sex && formik.errors.sex}>
                <div className="relative">
                  <select className={`${ic("sex")} appearance-none cursor-pointer`} {...formik.getFieldProps("sex")}>
                    <option value="" disabled>Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </FormField>
              <FormField label="Date of Birth" error={formik.touched.dob && formik.errors.dob}>
                <input type="date" className={ic("dob")} {...formik.getFieldProps("dob")} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
                <input type="text" placeholder="e.g. 09123456789"
                  className={ic("contactNo")} {...formik.getFieldProps("contactNo")} />
              </FormField>
              <FormField label="Address" error={formik.touched.address && formik.errors.address}>
                <input type="text" placeholder="Full address"
                  className={ic("address")} {...formik.getFieldProps("address")} />
              </FormField>
            </div>
          </>
        )}
      </SectionGroup>

      <SectionGroup title="Hospitalization">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* FIX: required prop added — placeholder is disabled */}
          <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
            <SelectField formik={formik} field="hospPlan" placeholder="Select Plan"
              options={hospPlans} keyProp="planId" valueProp="planId" labelProp="companyName" required />
          </FormField>
          <FormField label="Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
            <SelectField formik={formik} field="hospCaseType" placeholder="Select Case Type"
              options={hospCaseTypes} keyProp="typeId" valueProp="typeId" labelProp="typeName" required />
          </FormField>
        </div>

        <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
          <textarea rows={3} placeholder="Additional notes…"
            className={`${ic("remarks")} resize-none`} {...formik.getFieldProps("remarks")} />
        </FormField>
      </SectionGroup>

      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}


function EditScheduleModal({ schedule, professionals, modalities, machines, rooms, hospPlans, hospCaseTypes, onSubmit, onClose }) {
  const { date: initDate, time: initStartTime } = splitDatetime(schedule.startDateTime);
  const { time: initEndTime }                   = splitDatetime(schedule.endDateTime);

  const initProfId     = String(professionals.find((p) => p.fullName === schedule.doctorFullName)?.doctorId              ?? "");
  const matchedMachine = machines.find((m) => m.machineName === schedule.machineName);
  const initMachineId  = String(matchedMachine?.machineId ?? "");
  const initModalityId = String(modalities.find((mod) => mod.modalityName === matchedMachine?.modalityName)?.modalityId ?? "");
  const initRoomId     = String(rooms.find((r) => r.roomName === schedule.roomName)?.roomId ?? "");
  const initHospPlanId = String(hospPlans.find((p) => p.companyName === schedule.hospitalizationPlan)?.planId ?? "");
  const initHospTypeId = String(hospCaseTypes.find((c) => c.typeName === schedule.hospitalizationType)?.typeId ?? "");

  const formik = useFormik({
    initialValues: {
      professional: initProfId,
      procedure:    schedule.procedureName ?? "",
      modality:     initModalityId,
      machine:      initMachineId,
      room:         initRoomId,
      date:         initDate,
      startTime:    initStartTime,
      endTime:      initEndTime,
      hospPlan:     initHospPlanId,
      hospCaseType: initHospTypeId,
      remarks:      schedule.remarks ?? "",
    },
    validationSchema: editScheduleSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try { await onSubmit(values); onClose(); }
      catch (err) { console.error("Edit submit error:", err); }
      finally { setSubmitting(false); }
    },
  });
  const ic = useInputClass(formik);

  const prevModalityRef = useRef(formik.values.modality);
  useEffect(() => {
    if (prevModalityRef.current !== formik.values.modality) {
      formik.setFieldValue("machine", "");
      prevModalityRef.current = formik.values.modality;
    }
  }, [formik.values.modality]);

  const selectedProfId      = formik.values.professional;
  const selectedMachineId   = formik.values.machine;
  const selectedRoomId      = formik.values.room;
  const selectedDate        = formik.values.date;
  const selectedProfName    = professionals.find((p) => String(p.doctorId) === String(selectedProfId))?.fullName ?? null;
  const selectedMachineName = machines.find((m) => String(m.machineId) === String(selectedMachineId))?.machineName ?? null;
  const selectedRoomName    = rooms.find((r) => String(r.roomId) === String(selectedRoomId))?.roomName ?? null;

  const dateSchedules = useDateSchedules(selectedDate);
  const bookedRanges  = useBookedRanges({
    dateSchedules, selectedProfName, selectedMachineName, selectedRoomName,
    selectedDate, excludeId: schedule.scheduleId,
  });
  const { startBlocked, endBlocked } = useMemo(() => buildBlockedSets(bookedRanges), [bookedRanges]);

  const prevProfRef  = useRef(selectedProfId);
  const prevMachRef  = useRef(selectedMachineId);
  const prevRoomRef  = useRef(selectedRoomId);
  const prevDateRef  = useRef(selectedDate);
  useEffect(() => {
    if (
      prevProfRef.current !== selectedProfId    ||
      prevMachRef.current !== selectedMachineId ||
      prevRoomRef.current !== selectedRoomId    ||
      prevDateRef.current !== selectedDate
    ) {
      formik.setFieldValue("startTime", "");
      formik.setFieldValue("endTime",   "");
      prevProfRef.current = selectedProfId;
      prevMachRef.current = selectedMachineId;
      prevRoomRef.current = selectedRoomId;
      prevDateRef.current = selectedDate;
    }
  }, [selectedProfId, selectedMachineId, selectedRoomId, selectedDate]);

  const filteredMachines = formik.values.modality
    ? machines.filter((m) =>
        modalities.find((mod) => String(mod.modalityId) === String(formik.values.modality))?.modalityName === m.modalityName
      )
    : machines;

  return (
    <Modal title="Edit Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

        <SectionGroup title="Schedule Details">
          <FormField label="Patient Name">
            <input readOnly value={schedule.patientFullName ?? "—"} className={readonlyInputClass} />
          </FormField>

          <FormField label="Procedure" error={formik.touched.procedure && formik.errors.procedure}>
            <input type="text" placeholder="e.g. Physical Therapy"
              className={ic("procedure")} {...formik.getFieldProps("procedure")} />
          </FormField>

          {/* FIX: required prop added */}
          <FormField label="Medical Professional" error={formik.touched.professional && formik.errors.professional}>
            <SelectField formik={formik} field="professional" placeholder="Select Medical Professional"
              options={professionals} keyProp="doctorId" valueProp="doctorId" labelProp="fullName" required />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Modality" error={formik.touched.modality && formik.errors.modality}>
              <SelectField formik={formik} field="modality" placeholder="Select Modality (optional)"
                options={modalities} keyProp="modalityId" valueProp="modalityId" labelProp="modalityName" />
            </FormField>
            <FormField label="Machine" error={formik.touched.machine && formik.errors.machine}>
              <SelectField formik={formik} field="machine" placeholder="Select Machine (optional)"
                options={filteredMachines} keyProp="machineId" valueProp="machineId" labelProp="machineName" />
            </FormField>
          </div>

          <FormField label="Room" error={formik.touched.room && formik.errors.room}>
            <SelectField formik={formik} field="room" placeholder="Select Room (optional)"
              options={rooms} keyProp="roomId" valueProp="roomId" labelProp="roomName" />
          </FormField>

          <FormField label="Date" error={formik.touched.date && formik.errors.date}>
            <input type="date" min={new Date().toLocaleDateString("en-CA")}
              className={ic("date")} {...formik.getFieldProps("date")} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
              <TimeDropdown formik={formik} field="startTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
            </FormField>
            <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
              <TimeDropdown formik={formik} field="endTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
            </FormField>
          </div>
        </SectionGroup>

        <SectionGroup title="Hospitalization">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* FIX: required prop added */}
            <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
              <SelectField formik={formik} field="hospPlan" placeholder="Select Plan"
                options={hospPlans} keyProp="planId" valueProp="planId" labelProp="companyName" required />
            </FormField>
            <FormField label="Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
              <SelectField formik={formik} field="hospCaseType" placeholder="Select Case Type"
                options={hospCaseTypes} keyProp="typeId" valueProp="typeId" labelProp="typeName" required />
            </FormField>
          </div>

          <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
            <textarea rows={3} placeholder="Additional notes…"
              className={`${ic("remarks")} resize-none`} {...formik.getFieldProps("remarks")} />
          </FormField>
        </SectionGroup>

        <ModalFooter onClear={() => formik.resetForm()} submitLabel="Save Changes" submitting={formik.isSubmitting} />
      </form>
    </Modal>
  );
}


function ViewScheduleModal({ schedule, onClose }) {
  const ro = readonlyInputClass;
  const { date: initDate, time: initStartTime } = splitDatetime(schedule.startDateTime);
  const { time: initEndTime }                   = splitDatetime(schedule.endDateTime);

  return (
    <Modal title="View Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">
        <FormField label="Patient Name">
          <input readOnly value={schedule.patientFullName ?? "—"} className={ro} />
        </FormField>
        <FormField label="Procedure">
          <input readOnly value={schedule.procedureName ?? "—"} className={ro} />
        </FormField>
        <FormField label="Medical Professional">
          <input readOnly value={schedule.doctorFullName ?? "—"} className={ro} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Machine">
            <input readOnly value={schedule.machineName ?? "—"} className={ro} />
          </FormField>
          <FormField label="Room">
            <input readOnly value={schedule.roomName ?? "—"} className={ro} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Status">
            <input readOnly value={schedule.scheduleStatus ?? "—"} className={ro} />
          </FormField>
          <FormField label="Date">
            <input readOnly type="date" value={initDate} className={ro} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Start Time">
            <input readOnly value={formatTimeAMPM(initStartTime)} className={ro} />
          </FormField>
          <FormField label="End Time">
            <input readOnly value={formatTimeAMPM(initEndTime)} className={ro} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Hospitalization Plan">
            <input readOnly value={schedule.hospitalizationPlan ?? "—"} className={ro} />
          </FormField>
          <FormField label="Hospitalization Case Type">
            <input readOnly value={schedule.hospitalizationType ?? "—"} className={ro} />
          </FormField>
        </div>

        <FormField label="Remarks">
          <textarea readOnly rows={4} value={schedule.remarks ?? ""} placeholder="No remarks"
            className={`${ro} resize-none`} />
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


export default function FrontdeskScheduleManagement() {
  const navItems = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [showAdd,       setShowAdd]       = useState(false);
  const [viewSchedule,  setViewSchedule]  = useState(null);
  const [editSchedule,  setEditSchedule]  = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [schedules,     setSchedules]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  const [filters, setFilters] = useState({
    tab:            "All",
    modalityFilter: "all",
    search:         "",
  });

  const [professionals, setProfessionals] = useState([]);
  const [modalities,    setModalities]    = useState([]);
  const [machines,      setMachines]      = useState([]);
  const [rooms,         setRooms]         = useState([]);
  const [hospPlans,     setHospPlans]     = useState([]);
  const [hospCaseTypes, setHospCaseTypes] = useState([]);

  const setTab            = (tab)            => setFilters((f) => ({ ...f, tab }));
  const setModalityFilter = (modalityFilter) => setFilters((f) => ({ ...f, modalityFilter }));
  const setSearch         = (search)         => setFilters((f) => ({ ...f, search }));

  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => { setPage(0); }, [filters.tab, filters.modalityFilter, debouncedSearch]);
  useEffect(() => { fetchSchedules(); }, [filters.tab, filters.modalityFilter, debouncedSearch, page]);
  useEffect(() => { fetchDropdownData(); }, []);

  function buildParams() {
    const patientName  = debouncedSearch.trim() || undefined;
    const modalityName = filters.modalityFilter !== "all" ? filters.modalityFilter : undefined;
    return {
      page,
      size: 10,
      ...(filters.tab !== "All" && { scheduleStatus: filters.tab }),
      ...(patientName  && { patientName }),
      ...(modalityName && { modalityName }),
    };
  }

  async function fetchSchedules() {
    setLoading(true);
    try {
      const res = await axios.get("/api/getSchedules", {
        headers: getAuthHeader(),
        params:  buildParams(),
      });
      setSchedules(res.data?.content    ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setSchedules([]); setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDropdownData() {
    try {
      const headers = getAuthHeader();
      const [profRes, modalityRes, machineRes, roomRes, planRes, typeRes] = await Promise.all([
        axios.get("/api/doctorDropdown",   { headers }),
        axios.get("/api/modalityDropdown", { headers }),
        axios.get("/api/machineDropdown",  { headers }),
        axios.get("/api/roomDropdown",     { headers }),
        axios.get("/api/plansDropdown",    { headers }),
        axios.get("/api/typesDropdown",    { headers }),
      ]);
      const toArray = (d) => Array.isArray(d) ? d : d?.content ?? [];
      setProfessionals(toArray(profRes.data));
      setModalities(   toArray(modalityRes.data));
      setMachines(     toArray(machineRes.data).filter((m) => m.machineStatus !== "Archived"));
      setRooms(        toArray(roomRes.data));
      setHospPlans(    toArray(planRes.data));
      setHospCaseTypes(toArray(typeRes.data));
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }

  async function updateStatus(id, status) {
    const map = {
      Confirmed: `/api/confirmSchedule/${id}`,
      Cancelled: `/api/cancelSchedule/${id}`,
      Archived:  `/api/archiveSchedule/${id}`,
      Scheduled: `/api/restoreSchedule/${id}`,
      Done:      `/api/doneSchedule/${id}`,
    };
    if (!map[status]) return;
    await axios.put(map[status], {}, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  async function applyConfirm() {
    const { type, schedule } = confirmAction;
    const statusMap = { accept: "Confirmed", reject: "Cancelled", archive: "Archived", unarchive: "Scheduled", done: "Done" };
    try {
      await updateStatus(schedule.scheduleId, statusMap[type]);
      setConfirmAction(null);
    } catch (err) {
      console.error(`Failed to ${type} schedule:`, err);
    }
  }

  function handleAction(action, s) {
    switch (action) {
      case "View":      return setViewSchedule(s);
      case "Edit":      return setEditSchedule(s);
      case "Confirm":   return setConfirmAction({ type: "accept",    schedule: s });
      case "Cancel":    return setConfirmAction({ type: "reject",    schedule: s });
      case "Archive":   return setConfirmAction({ type: "archive",   schedule: s });
      case "Unarchive": return setConfirmAction({ type: "unarchive", schedule: s });
      case "Done":      return setConfirmAction({ type: "done",      schedule: s });
    }
  }

  async function handleCreate(values) {
    const isExisting = !!values.patientId;
    const payload = {
      existingPatientId: isExisting ? Number(values.patientId) : null,
      patient: isExisting ? null : {
        firstName:     values.firstName,
        middleName:    values.middleName || null,
        lastName:      values.lastName,
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
        doctor:              { doctorId: Number(values.professional) },
        machine:             values.machine      ? { machineId: Number(values.machine) }      : null,
        room:                values.room         ? { roomId:    Number(values.room)    }      : null,
        hospitalizationPlan: values.hospPlan     ? { planId:    Number(values.hospPlan)    }  : null,
        hospitalizationType: values.hospCaseType ? { typeId:    Number(values.hospCaseType) } : null,
      },
    };
    await axios.post("/api/createScheduleAndPatient", payload, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  async function handleEdit(values) {
    const payload = {
      startDateTime: buildDatetime(values.date, values.startTime),
      endDateTime:   buildDatetime(values.date, values.endTime),
      procedureName: values.procedure,
      remarks:       values.remarks || null,
      doctorId:      Number(values.professional),
      machineId:     values.machine ? Number(values.machine) : null,
      roomId:        values.room    ? Number(values.room)    : null,
    };
    await axios.patch(`/api/updateSchedule/${editSchedule.scheduleId}`, payload, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  const modalityLabel = filters.modalityFilter === "all"
    ? "All Modalities"
    : modalities.find((m) => m.modalityName === filters.modalityFilter)?.modalityName ?? "All Modalities";

  return (
    <AdminLayout
      navItems={navItems}
      pageTitle={
        <span className="flex items-center gap-3">
          {`${deptName} — Schedule Management`}
          {modalities.length > 0 && (
            <ModalityDropdown
              value={filters.modalityFilter}
              onChange={setModalityFilter}
              modalities={modalities}
            />
          )}
        </span>
      }
      pageSubtitle={modalityLabel}
      userRole={userRole}
      searchValue={filters.search}
      onSearchChange={setSearch}
      searchPlaceholder="Search Patient"
    >
      <TabBar
        tabs={TABS}
        activeTab={filters.tab}
        onTabChange={(tab) => setTab(tab)}
        addLabel="Add Patient"
        onAdd={() => setShowAdd(true)}
      />

      <DataTable
        columns={COLUMNS}
        rows={schedules}
        loading={loading}
        emptyIcon={Calendar}
        emptyText="No schedules found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(s) => (
          <tr key={s.scheduleId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.patientFullName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{formatDate(s.startDateTime)}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime && s.endDateTime
                ? `${formatTime(s.startDateTime)} - ${formatTime(s.endDateTime)}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.doctorFullName ?? "—"}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.machineName    ?? "—"}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.roomName       ?? "—"}</td>
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
          <ScheduleForm
            initialValues={BLANK_FORM}
            submitLabel="Submit"
            professionals={professionals}
            modalities={modalities}
            machines={machines}
            rooms={rooms}
            hospPlans={hospPlans}
            hospCaseTypes={hospCaseTypes}
            onSubmit={handleCreate}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {viewSchedule && (
        <ViewScheduleModal schedule={viewSchedule} onClose={() => setViewSchedule(null)} />
      )}

      {editSchedule && (
        <EditScheduleModal
          schedule={editSchedule}
          professionals={professionals}
          modalities={modalities}
          machines={machines}
          rooms={rooms}
          hospPlans={hospPlans}
          hospCaseTypes={hospCaseTypes}
          onSubmit={handleEdit}
          onClose={() => setEditSchedule(null)}
        />
      )}

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.schedule.patientFullName ?? "This schedule")}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}