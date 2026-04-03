import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loginpage from "./components/auth/Loginpage";
import UserManagement from "./components/admin/UserManagement";
import Dashboard from "./components/admin/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/user-management" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard/>}/>
        <Route path="/login" element={<Loginpage />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
      </Routes>
    </BrowserRouter>
  );
}