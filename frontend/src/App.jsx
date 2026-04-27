import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loginpage                from "./components/auth/Loginpage";
import AdminDashboard           from "./components/admin/AdminDashboard";
import UserManagement           from "./components/admin/UserManagement";
import RoleManagement           from "./components/admin/RoleManagement";
import MachineManagement        from "./components/admin/MachineManagement";
import ModalityManagement       from "./components/admin/ModalityManagement";
import ProfessionalManagement   from "./components/admin/ProfessionalManagement";
import HospitalizationPlanManagement from "./components/admin/HospitalizationPlanManagement";
import HospitalizationCaseTypeManagement from "./components/admin/HospitalizationCaseTypeManagement";
import AdminScheduleManagement  from "./components/admin/AdminScheduleManagement";
import RehabScheduleManagement  from "./components/frontdesk/RehabScheduleManagement";
import RehabilitationDashboard  from "./components/frontdesk/RehabDashboard";
import RadioScheduleManagement  from "./components/frontdesk/RadioScheduleManagement";
import RadiologyDashboard       from "./components/frontdesk/RadioDashboard";
import RadioMachineManagement   from "./components/frontdesk/RadioMachineManagement";
import RadioProfessionalManagement  from "./components/frontdesk/RadioProfessionalManagement";
import RehabProfessionalManagement  from "./components/frontdesk/RehabProfessionalManagement";
import PatientManagement from "./components/admin/PatientManagement";
import RoomManagement from "./components/admin/RoomManagement";
import ActivityLogs from "./components/admin/ActivityLogs";





export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Auth ── */}
        <Route path="/"              element={<Loginpage />} />

        {/* ── Redirects ── */}
        <Route path="/user-management" element={<Navigate to="/admin/user-management" replace />} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard"             element={<AdminDashboard />} />
        <Route path="/admin/schedules"             element={<AdminScheduleManagement />} />
        <Route path="/admin/user-management"       element={<UserManagement />} />
        <Route path="/admin/role-management"       element={<RoleManagement />} />
        <Route path="/admin/machine-management"    element={<MachineManagement />} />
        <Route path="/admin/modality-management"   element={<ModalityManagement />} /> 
        <Route path="/admin/medical-professionals" element={<ProfessionalManagement />} />
        <Route path="/admin/hospitalization-plans" element={<HospitalizationPlanManagement />} />
        <Route path="/admin/hospitalization-types" element={<HospitalizationCaseTypeManagement />} />
        <Route path="/admin/patient-management"    element={<PatientManagement />} />
        <Route path="/admin/room-management" element={<RoomManagement />} />
        <Route path="/admin/activity-logs" element={<ActivityLogs />} />

        {/* ── Rehabilitation Frontdesk ── */}
        <Route path="/frontdesk/rehab-dashboard" element={<RehabilitationDashboard />} />
        <Route path="/frontdesk/rehab-schedules" element={<RehabScheduleManagement />} />
        <Route path="/frontdesk/rehab-professionals" element={<RehabProfessionalManagement />} />

        {/* ── Radiology Frontdesk ── */}
        <Route path="/radiology/dashboard" element={<RadiologyDashboard />} />
        <Route path="/radiology/schedules" element={<RadioScheduleManagement />} />
        <Route path="/radiology/machine"   element={<RadioMachineManagement />} />
        <Route path="/radiology/professionals" element={<RadioProfessionalManagement />} />

      </Routes>
    </BrowserRouter>
  );
}