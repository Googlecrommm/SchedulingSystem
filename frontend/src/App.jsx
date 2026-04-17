import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loginpage                from "./components/auth/Loginpage";
import UserManagement           from "./components/admin/UserManagement";
import DepartmentManagement     from "./components/admin/DepartmentManagement";
import RoleManagement           from "./components/admin/RoleManagement";
import MachineManagement        from "./components/admin/MachineManagement";
import RehabScheduleManagement  from "./components/frontdesk/RehabScheduleManagement";
import RehabilitationDashboard  from "./components/frontdesk/RehabDashboard";
import RadioScheduleManagement  from "./components/frontdesk/RadioScheduleManagement";
import RadiologyDashboard       from "./components/frontdesk/RadioDashboard";
import RadioMachineManagement   from "./components/frontdesk/RadioMachineManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Auth ── */}
        <Route path="/"              element={<Loginpage />} />

        {/* ── Redirects ── */}
        <Route path="/user-management" element={<Navigate to="/admin/user-management" replace />} />

        {/* ── Admin ── */}
        <Route path="/admin/user-management"       element={<UserManagement />} />
        <Route path="/admin/department-management" element={<DepartmentManagement />} />
        <Route path="/admin/role-management"       element={<RoleManagement />} />
        <Route path="/admin/machine-management"    element={<MachineManagement />} />

        {/* ── Rehabilitation Frontdesk ── */}
        <Route path="/frontdesk/rehab-dashboard" element={<RehabilitationDashboard />} />
        <Route path="/frontdesk/rehab-schedules" element={<RehabScheduleManagement />} />

        {/* ── Radiology Frontdesk ── */}
        <Route path="/radiology/dashboard" element={<RadiologyDashboard />} />
        <Route path="/radiology/schedules" element={<RadioScheduleManagement />} />
        <Route path="/radiology/machine"   element={<RadioMachineManagement />} />

      </Routes>
    </BrowserRouter>
  );
}