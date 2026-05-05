import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "./components/ui/Toast"; // adjust path to wherever you place Toast.jsx

// ── JWT helpers ───────────────────────────────────────────────────────────────

function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}

function getRoleFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return localStorage.getItem("userRole") ?? "";

  const raw = payload.role ?? payload.roles ?? payload.authorities ?? payload.authority;
  if (!raw) return localStorage.getItem("userRole") ?? "";

  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === "object") return (first.authority ?? "").replace(/^ROLE_/i, "");
    return String(first).replace(/^ROLE_/i, "");
  }
  return String(raw).replace(/^ROLE_/i, "");
}

function clearAuth() {
  ["token", "userName", "userRole", "departmentName"].forEach((k) =>
    localStorage.removeItem(k)
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
import Loginpage from "./components/auth/Loginpage";

// ── Admin ─────────────────────────────────────────────────────────────────────
import AdminDashboard                     from "./components/admin/AdminDashboard";
import AdminScheduleManagement           from "./components/admin/AdminScheduleManagement";
import UserManagement                    from "./components/admin/UserManagement";
import DepartmentManagement              from "./components/admin/DepartmentManagement";
import RoleManagement                    from "./components/admin/RoleManagement";
import MachineManagement                 from "./components/admin/MachineManagement";
import ModalityManagement                from "./components/admin/ModalityManagement";
import ProfessionalManagement            from "./components/admin/ProfessionalManagement";
import HospitalizationPlanManagement     from "./components/admin/HospitalizationPlanManagement";
import HospitalizationCaseTypeManagement from "./components/admin/HospitalizationCaseTypeManagement";
import PatientManagement                 from "./components/admin/PatientManagement";
import RoomManagement                    from "./components/admin/RoomManagement";
import ActivityLogs                      from "./components/admin/ActivityLogs";

// ── Frontdesk ─────────────────────────────────────────────────────────────────
import FrontdeskDashboard              from "./components/frontdesk/FrontdeskDashboard";
import FrontdeskScheduleManagement     from "./components/frontdesk/FrontdeskScheduleManagement";
import FrontdeskProfessionalManagement from "./components/frontdesk/FrontdeskProfessionalManagement";
import FrontdeskMachineManagement      from "./components/frontdesk/FrontdeskMachineManagement";
import FrontdeskRoomManagement         from "./components/frontdesk/FrontdeskRoomManagement";


class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("React error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <p className="text-2xl font-bold text-red-500 mb-2">Something went wrong</p>
            <p className="text-sm text-gray-500 mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) { clearAuth(); return <Navigate to="/" replace />; }
  if (isTokenExpired(token)) { clearAuth(); return <Navigate to="/" replace />; }

  const role = getRoleFromToken(token).toLowerCase();
  if (role !== "admin" && role !== "administrator") {
    return <Navigate to="/frontdesk/dashboard" replace />;
  }

  return children;
}

function FrontdeskRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) { clearAuth(); return <Navigate to="/" replace />; }
  if (isTokenExpired(token)) { clearAuth(); return <Navigate to="/" replace />; }

  const role = getRoleFromToken(token).toLowerCase();
  if (role === "admin" || role === "administrator") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        {/* Global toast portal — renders above everything */}
        <ToastContainer />

        <Routes>

          {/* ── Auth ── */}
          <Route path="/" element={<Loginpage />} />

          {/* ── Redirects ── */}
          <Route path="/user-management" element={<Navigate to="/admin/user-management" replace />} />

          {/* ── Admin ── */}
          <Route path="/admin/dashboard"             element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/schedules"             element={<AdminRoute><AdminScheduleManagement /></AdminRoute>} />
          <Route path="/admin/user-management"       element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/department-management" element={<AdminRoute><DepartmentManagement /></AdminRoute>} />
          <Route path="/admin/role-management"       element={<AdminRoute><RoleManagement /></AdminRoute>} />
          <Route path="/admin/machine-management"    element={<AdminRoute><MachineManagement /></AdminRoute>} />
          <Route path="/admin/modality-management"   element={<AdminRoute><ModalityManagement /></AdminRoute>} />
          <Route path="/admin/medical-professionals" element={<AdminRoute><ProfessionalManagement /></AdminRoute>} />
          <Route path="/admin/hospitalization-plans" element={<AdminRoute><HospitalizationPlanManagement /></AdminRoute>} />
          <Route path="/admin/hospitalization-types" element={<AdminRoute><HospitalizationCaseTypeManagement /></AdminRoute>} />
          <Route path="/admin/patient-management"    element={<AdminRoute><PatientManagement /></AdminRoute>} />
          <Route path="/admin/room-management"       element={<AdminRoute><RoomManagement /></AdminRoute>} />
          <Route path="/admin/activity-logs"         element={<AdminRoute><ActivityLogs /></AdminRoute>} />

          {/* ── Frontdesk ── */}
          <Route path="/frontdesk/dashboard"     element={<FrontdeskRoute><FrontdeskDashboard /></FrontdeskRoute>} />
          <Route path="/frontdesk/schedules"     element={<FrontdeskRoute><FrontdeskScheduleManagement /></FrontdeskRoute>} />
          <Route path="/frontdesk/professionals" element={<FrontdeskRoute><FrontdeskProfessionalManagement /></FrontdeskRoute>} />
          <Route path="/frontdesk/machines"      element={<FrontdeskRoute><FrontdeskMachineManagement /></FrontdeskRoute>} />
          <Route path="/frontdesk/rooms"         element={<FrontdeskRoute><FrontdeskRoomManagement /></FrontdeskRoute>} />

          {/* ── Legacy redirects ── */}
          <Route path="/radiology/dashboard"           element={<Navigate to="/frontdesk/dashboard"     replace />} />
          <Route path="/radiology/schedules"           element={<Navigate to="/frontdesk/schedules"     replace />} />
          <Route path="/radiology/machine"             element={<Navigate to="/frontdesk/machines"      replace />} />
          <Route path="/radiology/professionals"       element={<Navigate to="/frontdesk/professionals" replace />} />
          <Route path="/frontdesk/rehab-dashboard"     element={<Navigate to="/frontdesk/dashboard"     replace />} />
          <Route path="/frontdesk/rehab-schedules"     element={<Navigate to="/frontdesk/schedules"     replace />} />
          <Route path="/frontdesk/rehab-professionals" element={<Navigate to="/frontdesk/professionals" replace />} />

          {/* ── 404 catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}