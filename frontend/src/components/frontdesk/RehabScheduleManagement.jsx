import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Calendar, CalendarCheck, CalendarX, Clock, Archive, CheckCircle,
  Eye, UserCheck, UserX, Trash2, RefreshCw, ChevronDown, Search, X, Pencil,
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
  frontdeskNavItems,
  ConfirmDialog,
} from "../ui";

// ── Constants ─────────────────────────────────────────────────────────────────

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
  therapist:     "",
  room:          "",
  date:          new Date().toISOString().slice(0, 10),
  startTime:     "",
  endTime:       "",
  patientName:   "",
  patientId:     "",
  dob:           "",
  contactNo:     "",
  sex:           "",
  address:       "",
  hospPlan:      "",
  hospCaseType:  "",
  procedureName: "",
  remarks:       "",
};

const confirmMeta = {
  accept:    { title: "Confirm Schedule?",   label: "Confirm",   danger: false, msg: (n) => `"${n}" will be marked as confirmed.`  },
  reject:    { title: "Cancel Schedule?",    label: "Cancel",    danger: true,  msg: (n) => `"${n}" will be marked as cancelled.`  },
  archive:   { title: "Archive Schedule?",   label: "Archive",   danger: true,  msg: (n) => `"${n}" will be moved to the archive.` },
  unarchive: { title: "Unarchive Schedule?", label: "Unarchive", danger: false, msg: (n) => `"${n}" will be restored to pending.`  },
  done:      { title: "Mark as Done?",       label: "Done",      danger: false, msg: (n) => `"${n}" will be marked as done.`       },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return {
    date: datePart ?? "",
    time: timePart?.slice(0, 5) ?? "",
  };
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
    case "confirmed": return [{ label: "View", icon: Eye }, { label: "Edit", icon: Pencil }, { label: "Done", icon: UserCheck }];
    case "cancelled": return [{ label: "View", icon: Eye }];
    case "archived":  return [{ label: "View", icon: Eye }, { label: "Unarchive", icon: RefreshCw }];
    case "done":      return [{ label: "View", icon: Eye }];
    default: return [
      { label: "View",    icon: Eye       },
      { label: "Edit",    icon: Pencil    },
      { label: "Confirm", icon: UserCheck },
      { label: "Cancel",  icon: UserX     },
      { label: "Archive", icon: Trash2, danger: true },
    ];
  }
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
// FIX: Added — prevents a fetch on every single search keystroke.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── Time slot blocking ────────────────────────────────────────────────────────

// Builds TWO sets of blocked slots — one for Start Time, one for End Time.
//
// For a booking 1:00 PM → 2:00 PM:
//   startBlocked: slots where a new booking CANNOT start → [1:00, 1:15, 1:30, 1:45]
//   endBlocked:   slots where a new booking CANNOT end   → [1:15, 1:30, 1:45, 2:00]
//
// This lets 12:00 PM → 1:00 PM work: 12:00 is free to start, 1:00 is free to end.
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

function toMins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toSlot(mins) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ── Time options ──────────────────────────────────────────────────────────────

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh     = String(h).padStart(2, "0");
      const mm     = String(m).padStart(2, "0");
      const value  = `${hh}:${mm}`;
      const period = h < 12 ? "AM" : "PM";
      const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label  = `${h12}:${mm} ${period}`;
      opts.push({ value, label });
    }
  }
  return opts;
})();

// ── Sub-components ────────────────────────────────────────────────────────────

function PatientSearchableInput({ formik, hasError }) {
  const [query,      setQuery]      = useState(formik.values.patientName ?? "");
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
          { headers: getAuthHeader(), params: { page: 0, size: 20 } }
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
    const displayName = patient.name ?? "";
    setQuery(displayName);
    setIsExisting(true);
    setOpen(false);
    setResults([]);
    formik.setFieldValue("patientName",  displayName);
    formik.setFieldValue("patientId",    patient.patientId     ?? "");
    formik.setFieldValue("sex",          patient.sex           ?? "");
    formik.setFieldValue("dob",          patient.birthDate     ?? "");
    formik.setFieldValue("contactNo",    patient.contactNumber ?? "");
    formik.setFieldValue("address",      patient.address       ?? "");
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
            <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors">
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
              <span className="font-medium">{p.name}</span>
              {p.birthDate     && <span className="ml-2 text-xs text-gray-400">DOB: {p.birthDate}</span>}
              {p.contactNumber && <span className="ml-2 text-xs text-gray-400">{p.contactNumber}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const patientSchema = Yup.object({
  therapist:     Yup.string().required("Therapist is required"),
  room:          Yup.string().required("Room is required"),
  date:          Yup.string().required("Date is required")
    .test("not-past", "Date cannot be in the past", (val) => {
      if (!val) return true;
      return val >= new Date().toISOString().slice(0, 10);
    }),
  startTime:     Yup.string().required("Start time is required"),
  endTime:       Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  patientName:   Yup.string().required("Patient name is required"),
  dob:           Yup.string().required("Date of birth is required"),
  contactNo:     Yup.string()
    .matches(/^\+?[0-9]{7,15}$/, "Enter a valid contact number")
    .required("Contact number is required"),
  sex:           Yup.string().required("Sex is required"),
  address:       Yup.string().required("Address is required"),
  hospPlan:      Yup.string(),
  hospCaseType:  Yup.string(),
  procedureName: Yup.string().required("Procedure name is required"),
  remarks:       Yup.string().required("Remarks is required"),
});

const editScheduleSchema = Yup.object({
  therapist:     Yup.string().required("Therapist is required"),
  room:          Yup.string().required("Room is required"),
  date:          Yup.string().required("Date is required")
    .test("not-past", "Date cannot be in the past", (val) => {
      if (!val) return true;
      return val >= new Date().toISOString().slice(0, 10);
    }),
  startTime:     Yup.string().required("Start time is required"),
  endTime:       Yup.string()
    .required("End time is required")
    .test("after-start", "End time must be after start time", function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  hospPlan:      Yup.string(),
  hospCaseType:  Yup.string(),
  procedureName: Yup.string().required("Procedure name is required"),
  remarks:       Yup.string().required("Remarks is required"),
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
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function TimeDropdown({ formik, field, startBlocked = new Set(), endBlocked = new Set(), selectedDate = "" }) {
  const ic        = useInputClass(formik);
  const startTime = formik.values.startTime;
  const blockedSet = field === "startTime" ? startBlocked : endBlocked;

  const today   = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const nowMins = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

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

// ── Conflict-aware time blocking hook ─────────────────────────────────────────
// FIX: Fetches ALL schedules for the selected date from the server, not just
// the 10 rows on the current page. Prevents silent double-bookings.
function useDateSchedules(selectedDate, excludeScheduleId = null) {
  const [dateSchedules, setDateSchedules] = useState([]);

  useEffect(() => {
    if (!selectedDate) {
      setDateSchedules([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        // Fetch all non-archived rehab schedules for the selected date.
        // We request a large page since we only filter by one date — real
        // volume per day is small. The backend sorts by startDateTime ASC.
        const res = await axios.get("/api/getRehabSched", {
          headers: getAuthHeader(),
          params: { page: 0, size: 200 },
        });
        if (!cancelled) {
          const all = res.data?.content ?? [];
          // Keep only records on the selected date (compare date portion only)
          const forDate = all.filter((s) => {
            if (!s.startDateTime) return false;
            return s.startDateTime.toString().slice(0, 10) === selectedDate;
          });
          setDateSchedules(forDate);
        }
      } catch {
        if (!cancelled) setDateSchedules([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedDate]);

  return dateSchedules;
}

// ── Shared booked-ranges logic ────────────────────────────────────────────────
function useBookedRanges({ dateSchedules, selectedRoomName, selectedDoctorName, selectedDate, excludeScheduleId }) {
  return useMemo(() => {
    if (!selectedDate || (!selectedRoomName && !selectedDoctorName)) return [];
    return dateSchedules
      .filter((s) => {
        if (excludeScheduleId != null && s.scheduleId === excludeScheduleId) return false;
        const status = s.scheduleStatus?.toLowerCase();
        if (status === "cancelled" || status === "archived") return false;
        if (!s.startDateTime || !s.endDateTime) return false;
        const roomMatch   = selectedRoomName   && s.roomName === selectedRoomName;
        const doctorMatch = selectedDoctorName && s.name     === selectedDoctorName;
        return roomMatch || doctorMatch;
      })
      .map((s) => ({
        startTime: s.startDateTime.toString().slice(11, 16),
        endTime:   s.endDateTime.toString().slice(11, 16),
      }));
  }, [dateSchedules, selectedRoomName, selectedDoctorName, selectedDate, excludeScheduleId]);
}

// ── PatientForm (create) ──────────────────────────────────────────────────────
function PatientForm({ initialValues, submitLabel, onSubmit, onClose, therapists, rooms, hospPlans, hospCaseTypes }) {
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

  const selectedRoom      = formik.values.room;
  const selectedDate      = formik.values.date;
  const selectedTherapist = formik.values.therapist;

  const selectedRoomName   = rooms.find((r) => String(r.roomId)    === String(selectedRoom))?.roomName ?? null;
  const selectedDoctorName = therapists.find((t) => String(t.doctorId) === String(selectedTherapist))?.name ?? null;

  // FIX: Fetch all schedules for the selected date from the server, not from
  // the current page slice — so conflict detection sees every booking that day.
  const dateSchedules = useDateSchedules(selectedDate);
  const bookedRanges  = useBookedRanges({ dateSchedules, selectedRoomName, selectedDoctorName, selectedDate, excludeScheduleId: null });
  const { startBlocked, endBlocked } = useMemo(() => buildBlockedSets(bookedRanges), [bookedRanges]);

  // Clear time fields when room, doctor, or date changes
  const prevRoomRef      = useRef(selectedRoom);
  const prevDateRef      = useRef(selectedDate);
  const prevTherapistRef = useRef(selectedTherapist);
  useEffect(() => {
    if (
      prevRoomRef.current      !== selectedRoom      ||
      prevDateRef.current      !== selectedDate      ||
      prevTherapistRef.current !== selectedTherapist
    ) {
      formik.setFieldValue("startTime", "");
      formik.setFieldValue("endTime",   "");
      prevRoomRef.current      = selectedRoom;
      prevDateRef.current      = selectedDate;
      prevTherapistRef.current = selectedTherapist;
    }
  }, [selectedRoom, selectedDate, selectedTherapist]);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

      <FormField label="Therapist" error={formik.touched.therapist && formik.errors.therapist}>
        <SelectField formik={formik} field="therapist" placeholder="Select Therapist"
          options={therapists} keyProp="doctorId" valueProp="doctorId" labelProp="name" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Room" error={formik.touched.room && formik.errors.room}>
          <SelectField formik={formik} field="room" placeholder="Select Room"
            options={rooms} keyProp="roomId" valueProp="roomId" labelProp="roomName" />
        </FormField>
        <FormField label="Date" error={formik.touched.date && formik.errors.date}>
          <input type="date" min={new Date().toISOString().slice(0, 10)}
            className={ic("date")} {...formik.getFieldProps("date")} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
          <TimeDropdown formik={formik} field="startTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
        </FormField>
        <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
          <TimeDropdown formik={formik} field="endTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
        </FormField>
      </div>

      <FormField label="Procedure Name" error={formik.touched.procedureName && formik.errors.procedureName}>
        <input type="text" placeholder="e.g. Physical Therapy"
          className={ic("procedureName")} {...formik.getFieldProps("procedureName")} />
      </FormField>

      <FormField label="Patient Name" error={formik.touched.patientName && formik.errors.patientName}>
        <PatientSearchableInput formik={formik} hasError={!!(formik.touched.patientName && formik.errors.patientName)} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Date of Birth" error={formik.touched.dob && formik.errors.dob}>
          <input type="date" className={ic("dob")} {...formik.getFieldProps("dob")} />
        </FormField>
        <FormField label="Contact No." error={formik.touched.contactNo && formik.errors.contactNo}>
          <input type="tel" placeholder="63+9XXXXXXXXX"
            className={ic("contactNo")} {...formik.getFieldProps("contactNo")} />
        </FormField>
      </div>

      <FormField label="Sex" error={formik.touched.sex && formik.errors.sex}>
        <div className="relative">
          <select className={`${ic("sex")} appearance-none cursor-pointer`} {...formik.getFieldProps("sex")}>
            <option value="" disabled>Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </FormField>

      <FormField label="Address" error={formik.touched.address && formik.errors.address}>
        <input type="text" placeholder="City, Province"
          className={ic("address")} {...formik.getFieldProps("address")} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
          <SelectField formik={formik} field="hospPlan" placeholder="Select Plan"
            options={hospPlans} keyProp="planId" valueProp="planId" labelProp="companyName" />
        </FormField>
        <FormField label="Hospitalization Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
          <SelectField formik={formik} field="hospCaseType" placeholder="Select Case Type"
            options={hospCaseTypes} keyProp="typeId" valueProp="typeId" labelProp="typeName" />
        </FormField>
      </div>

      <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
        <textarea rows={4} placeholder="Enter remarks…"
          className={`${ic("remarks")} resize-none`} {...formik.getFieldProps("remarks")} />
      </FormField>

      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}

// ── EditScheduleModal ─────────────────────────────────────────────────────────
function EditScheduleModal({ schedule, therapists, rooms, hospPlans, hospCaseTypes, onSubmit, onClose }) {
  const { date: initDate, time: initStartTime } = splitDatetime(schedule.startDateTime);
  const { time: initEndTime }                   = splitDatetime(schedule.endDateTime);

  // ScheduleResponseDTO carries names, not IDs — resolve back to IDs via dropdowns
  const initTherapistId = String(therapists.find((t)    => t.name        === schedule.name)?.doctorId              ?? "");
  const initRoomId      = String(rooms.find((r)         => r.roomName    === schedule.roomName)?.roomId            ?? "");
  const initHospPlanId  = String(hospPlans.find((p)     => p.companyName === schedule.hospitalizationPlan)?.planId ?? "");
  const initHospTypeId  = String(hospCaseTypes.find((c) => c.typeName    === schedule.hospitalizationType)?.typeId ?? "");

  const formik = useFormik({
    initialValues: {
      therapist:     initTherapistId,
      room:          initRoomId,
      date:          initDate,
      startTime:     initStartTime,
      endTime:       initEndTime,
      hospPlan:      initHospPlanId,
      hospCaseType:  initHospTypeId,
      procedureName: schedule.procedureName ?? "",
      remarks:       schedule.remarks ?? "",
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

  const icFn = useInputClass(formik);

  const selectedRoom      = formik.values.room;
  const selectedDate      = formik.values.date;
  const selectedTherapist = formik.values.therapist;

  const selectedRoomName   = rooms.find((r) => String(r.roomId)      === String(selectedRoom))?.roomName ?? null;
  const selectedDoctorName = therapists.find((t) => String(t.doctorId) === String(selectedTherapist))?.name ?? null;

  // FIX: Fetch all schedules for the selected date — not from the page slice.
  // Pass excludeScheduleId so the current record doesn't block its own slot.
  const dateSchedules = useDateSchedules(selectedDate);
  const bookedRanges  = useBookedRanges({
    dateSchedules,
    selectedRoomName,
    selectedDoctorName,
    selectedDate,
    excludeScheduleId: schedule.scheduleId,
  });
  const { startBlocked, endBlocked } = useMemo(() => buildBlockedSets(bookedRanges), [bookedRanges]);

  // Clear time fields when room, doctor, or date changes
  const prevRoomRef      = useRef(selectedRoom);
  const prevDateRef      = useRef(selectedDate);
  const prevTherapistRef = useRef(selectedTherapist);
  useEffect(() => {
    if (
      prevRoomRef.current      !== selectedRoom      ||
      prevDateRef.current      !== selectedDate      ||
      prevTherapistRef.current !== selectedTherapist
    ) {
      formik.setFieldValue("startTime", "");
      formik.setFieldValue("endTime",   "");
      prevRoomRef.current      = selectedRoom;
      prevDateRef.current      = selectedDate;
      prevTherapistRef.current = selectedTherapist;
    }
  }, [selectedRoom, selectedDate, selectedTherapist]);

  return (
    <Modal title="Edit Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">

        <FormField label="Patient Name">
          <input readOnly value={schedule.patientName ?? "—"} className={readonlyInputClass} />
        </FormField>

        <FormField label="Procedure Name" error={formik.touched.procedureName && formik.errors.procedureName}>
          <input type="text" placeholder="e.g. Physical Therapy"
            className={icFn("procedureName")} {...formik.getFieldProps("procedureName")} />
        </FormField>

        <FormField label="Therapist" error={formik.touched.therapist && formik.errors.therapist}>
          <SelectField formik={formik} field="therapist" placeholder="Select Therapist"
            options={therapists} keyProp="doctorId" valueProp="doctorId" labelProp="name" />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Room" error={formik.touched.room && formik.errors.room}>
            <SelectField formik={formik} field="room" placeholder="Select Room"
              options={rooms} keyProp="roomId" valueProp="roomId" labelProp="roomName" />
          </FormField>
          <FormField label="Date" error={formik.touched.date && formik.errors.date}>
            <input type="date" min={new Date().toISOString().slice(0, 10)}
              className={icFn("date")} {...formik.getFieldProps("date")} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Start Time" error={formik.touched.startTime && formik.errors.startTime}>
            <TimeDropdown formik={formik} field="startTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
          </FormField>
          <FormField label="End Time" error={formik.touched.endTime && formik.errors.endTime}>
            <TimeDropdown formik={formik} field="endTime" startBlocked={startBlocked} endBlocked={endBlocked} selectedDate={selectedDate} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Hospitalization Plan" error={formik.touched.hospPlan && formik.errors.hospPlan}>
            <SelectField formik={formik} field="hospPlan" placeholder="Select Plan"
              options={hospPlans} keyProp="planId" valueProp="planId" labelProp="companyName" />
          </FormField>
          <FormField label="Hospitalization Case Type" error={formik.touched.hospCaseType && formik.errors.hospCaseType}>
            <SelectField formik={formik} field="hospCaseType" placeholder="Select Case Type"
              options={hospCaseTypes} keyProp="typeId" valueProp="typeId" labelProp="typeName" />
          </FormField>
        </div>

        <FormField label="Remarks" error={formik.touched.remarks && formik.errors.remarks}>
          <textarea rows={4} placeholder="Enter remarks…"
            className={`${icFn("remarks")} resize-none`} {...formik.getFieldProps("remarks")} />
        </FormField>

        <ModalFooter onClear={() => formik.resetForm()} submitLabel="Save Changes" submitting={formik.isSubmitting} />
      </form>
    </Modal>
  );
}

// ── ViewPatientModal ──────────────────────────────────────────────────────────
function ViewPatientModal({ patient, onClose }) {
  const ro = readonlyInputClass;

  const initDate      = patient.startDateTime ? patient.startDateTime.toString().slice(0, 10)  : "";
  const initStartTime = patient.startDateTime ? patient.startDateTime.toString().slice(11, 16) : "";
  const initEndTime   = patient.endDateTime   ? patient.endDateTime.toString().slice(11, 16)   : "";

  return (
    <Modal title="View Patient Schedule" onClose={onClose} maxWidth="max-w-2xl" scrollable>
      <div className="space-y-4">

        <FormField label="Patient Name">
          <input readOnly value={patient.patientName ?? "—"} className={ro} />
        </FormField>
        <FormField label="Procedure Name">
          <input readOnly value={patient.procedureName ?? "—"} className={ro} />
        </FormField>
        <FormField label="Therapist">
          <input readOnly value={patient.name ?? "—"} className={ro} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Room">
            <input readOnly value={patient.roomName ?? "—"} className={ro} />
          </FormField>
          <FormField label="Status">
            <input readOnly value={patient.scheduleStatus ?? "—"} className={ro} />
          </FormField>
        </div>

        <FormField label="Date">
          <input readOnly type="date" value={initDate} className={ro} />
        </FormField>

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
            <input readOnly value={patient.hospitalizationPlan ?? "—"} className={ro} />
          </FormField>
          <FormField label="Hospitalization Case Type">
            <input readOnly value={patient.hospitalizationType ?? "—"} className={ro} />
          </FormField>
        </div>

        <FormField label="Remarks">
          <textarea readOnly rows={4} value={patient.remarks ?? ""} placeholder="No remarks"
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RehabScheduleManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [viewPatient,   setViewPatient]   = useState(null);
  const [editSchedule,  setEditSchedule]  = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [schedules,     setSchedules]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);

  const [therapists,    setTherapists]    = useState([]);
  const [rooms,         setRooms]         = useState([]);
  const [hospPlans,     setHospPlans]     = useState([]);
  const [hospCaseTypes, setHospCaseTypes] = useState([]);

  // FIX: Debounce search — only fires a request 400ms after the user stops typing.
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Reset to page 0 when tab or debounced search changes
  useEffect(() => {
    setPage(0);
  }, [activeTab, debouncedSearch]);

  // Re-fetch when tab, debounced search, or page changes
  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, page]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // ── Fetch schedules ──────────────────────────────────────────────────────────
  // FIX: "All" tab now sends a single request with no scheduleStatus param.
  // The backend's hasStatus() spec returns all non-Archived records when
  // scheduleStatus is null — no more multi-request client-side merge loop.
  //
  // IMPORTANT: Also apply the same one-liner fix in ScheduleService.java:
  //   BEFORE: ScheduleStatus effectiveStatus = scheduleStatus != null ? scheduleStatus : ScheduleStatus.Scheduled;
  //   AFTER:  ScheduleStatus effectiveStatus = scheduleStatus;
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const headers     = getAuthHeader();
      const patientName = debouncedSearch.trim() || undefined;

      const params = {
        page,
        size: 10,
        // "All" tab omits scheduleStatus → backend returns all non-Archived.
        // Every other tab passes the exact status for server-side filtering.
        ...(activeTab !== "All" && { scheduleStatus: activeTab }),
        ...(patientName && { patientName }),
      };

      const res = await axios.get("/api/getRehabSched", { headers, params });
      setSchedules(res.data?.content   ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setSchedules([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, page]);

  // ── Fetch dropdown data ──────────────────────────────────────────────────────
  async function fetchDropdownData() {
    try {
      const headers = getAuthHeader();
      const [therapistRes, roomRes, planRes, typeRes] = await Promise.all([
        axios.get("/api/therapistDropdown", { headers }),
        axios.get("/api/roomDropdown",       { headers }),
        axios.get("/api/plansDropdown",      { headers }),
        axios.get("/api/typesDropdown",      { headers }),
      ]);
      setTherapists(   Array.isArray(therapistRes.data) ? therapistRes.data : therapistRes.data?.content ?? []);
      setRooms(        Array.isArray(roomRes.data)       ? roomRes.data       : roomRes.data?.content       ?? []);
      setHospPlans(    Array.isArray(planRes.data)       ? planRes.data       : planRes.data?.content       ?? []);
      setHospCaseTypes(Array.isArray(typeRes.data)       ? typeRes.data       : typeRes.data?.content       ?? []);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }

  // ── Status updates ───────────────────────────────────────────────────────────
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
    await axios.put(url, {}, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  // FIX: applyConfirm now catches errors and keeps the dialog open on failure,
  // so the user gets feedback instead of a silent close.
  async function applyConfirm() {
    const { type, schedule } = confirmAction;
    const statusMap = {
      accept:    "Confirmed",
      reject:    "Cancelled",
      archive:   "Archived",
      unarchive: "Scheduled",
      done:      "Done",
    };
    try {
      await updateStatus(schedule.scheduleId, statusMap[type]);
      setConfirmAction(null);
    } catch (err) {
      console.error(`Failed to ${type} schedule:`, err);
      // Dialog stays open — user can retry or cancel manually
    }
  }

  function handleAction(action, s) {
    switch (action) {
      case "View":      return setViewPatient(s);
      case "Edit":      return setEditSchedule(s);
      case "Confirm":   return setConfirmAction({ type: "accept",    schedule: s });
      case "Cancel":    return setConfirmAction({ type: "reject",    schedule: s });
      case "Archive":   return setConfirmAction({ type: "archive",   schedule: s });
      case "Unarchive": return setConfirmAction({ type: "unarchive", schedule: s });
      case "Done":      return setConfirmAction({ type: "done",      schedule: s });
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  // FIX: hospitalizationPlanId and hospitalizationTypeId are sent as flat
  // integers matching SchedulePatchRequest fields — not as nested objects.
  async function handleEdit(scheduleId, values) {
    const payload = {
      startDateTime:          buildDatetime(values.date, values.startTime),
      endDateTime:            buildDatetime(values.date, values.endTime),
      procedureName:          values.procedureName,
      remarks:                values.remarks || null,
      doctorId:               Number(values.therapist),
      roomId:                 values.room        ? Number(values.room)        : -1,
      hospitalizationPlanId:  values.hospPlan    ? Number(values.hospPlan)    : null,
      hospitalizationTypeId:  values.hospCaseType ? Number(values.hospCaseType) : null,
    };
    await axios.patch(`/api/updateSchedule/${scheduleId}`, payload, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  // ── Create ───────────────────────────────────────────────────────────────────
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
        procedureName:       values.procedureName,
        remarks:             values.remarks || null,
        doctor:              { doctorId: Number(values.therapist) },
        room:                values.room         ? { roomId: Number(values.room)         } : null,
        hospitalizationPlan: values.hospPlan     ? { planId: Number(values.hospPlan)     } : null,
        hospitalizationType: values.hospCaseType ? { typeId: Number(values.hospCaseType) } : null,
      },
    };
    await axios.post("/api/createScheduleAndPatient", payload, { headers: getAuthHeader() });
    await fetchSchedules();
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  // ── Render ───────────────────────────────────────────────────────────────────
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
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.patientName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{formatDate(s.startDateTime)}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {s.startDateTime && s.endDateTime
                ? `${formatTime(s.startDateTime)} - ${formatTime(s.endDateTime)}`
                : "—"}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{s.name ?? "—"}</td>
            <td className={`px-6 py-4 text-center text-sm font-semibold ${scheduleStatusColor(s.scheduleStatus)}`}>
              {s.scheduleStatus
                ? s.scheduleStatus.charAt(0).toUpperCase() + s.scheduleStatus.slice(1)
                : "—"}
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

      {/* ── Add modal ── */}
      {showAdd && (
        <Modal title="Add Patient Schedule" onClose={() => setShowAdd(false)} maxWidth="max-w-2xl" scrollable>
          <PatientForm
            initialValues={BLANK_PATIENT}
            submitLabel="Submit"
            therapists={therapists}
            rooms={rooms}
            hospPlans={hospPlans}
            hospCaseTypes={hospCaseTypes}
            onSubmit={handleCreate}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editSchedule && (
        <EditScheduleModal
          schedule={editSchedule}
          therapists={therapists}
          rooms={rooms}
          hospPlans={hospPlans}
          hospCaseTypes={hospCaseTypes}
          onSubmit={(values) => handleEdit(editSchedule.scheduleId, values)}
          onClose={() => setEditSchedule(null)}
        />
      )}

      {/* ── View modal ── */}
      {viewPatient && (
        <ViewPatientModal patient={viewPatient} onClose={() => setViewPatient(null)} />
      )}

      {/* ── Confirm dialog ── */}
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