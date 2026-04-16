import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loginpage from "./components/auth/Loginpage";
import UserManagement from "./components/admin/UserManagement";
import RehabScheduleManagement from "./components/frontdesk/RehabScheduleManagement";
import RehabilitationDashboard from "./components/frontdesk/RehabDashboard";
import DepartmentManagement from "./components/admin/DepartmentManagement";
import RoleManagement from "./components/admin/RoleManagement";
import MachineManagement from "./components/admin/MachineManagement";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/user-management" element={<Navigate to="/admin/user-management" replace />} />
        <Route path="/" element={<Loginpage />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/frontdesk/rehab-schedules" element={<RehabScheduleManagement />} />
        <Route path="/frontdesk/rehab-dashboard" element={<RehabilitationDashboard />} />
        <Route path="/admin/department-management" element={<DepartmentManagement />} />
        <Route path="/admin/role-management" element={<RoleManagement />} />
         <Route path="/admin/machine-management" element={<MachineManagement />} />
   
      </Routes>
    </BrowserRouter>
  );
}