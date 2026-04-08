import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loginpage from "./components/auth/Loginpage";
import UserManagement from "./components/admin/UserManagement";
import ScheduleManagement from "./components/frontdesk/ScheduleManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/user-management" replace />} />
        <Route path="/login" element={<Loginpage />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/frontdesk/schedules" element={<ScheduleManagement />} />
      </Routes>
    </BrowserRouter>
  );
}