import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// ── Frontdesk (unified — works for every department) ─────────────────────────
import FrontdeskDashboard              from "./components/frontdesk/FrontdeskDashboard";
import FrontdeskScheduleManagement     from "./components/frontdesk/FrontdeskScheduleManagement";
import FrontdeskProfessionalManagement from "./components/frontdesk/FrontdeskProfessionalManagement";
import FrontdeskMachineManagement      from "./components/frontdesk/FrontdeskMachineManagement";
import FrontdeskModalityManagement     from "./components/frontdesk/FrontdeskModalityManagement";
import FrontdeskRoomManagement         from "./components/frontdesk/FrontdeskRoomManagement";

// ── Error Boundary ────────────────────────────────────────────────────────────
// Catches any runtime crash and shows a readable message instead of a white screen.
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

// ── Private Route ─────────────────────────────────────────────────────────────
// Redirects unauthenticated users to login instead of showing a white screen.
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>

          {/* ── Auth ── */}
          <Route path="/" element={<Loginpage />} />

          {/* ── Redirects ── */}
          <Route path="/user-management" element={<Navigate to="/admin/user-management" replace />} />

          {/* ── Admin ── */}
          <Route path="/admin/dashboard"             element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/schedules"             element={<PrivateRoute><AdminScheduleManagement /></PrivateRoute>} />
          <Route path="/admin/user-management"       element={<PrivateRoute><UserManagement /></PrivateRoute>} />
          <Route path="/admin/department-management" element={<PrivateRoute><DepartmentManagement /></PrivateRoute>} />
          <Route path="/admin/role-management"       element={<PrivateRoute><RoleManagement /></PrivateRoute>} />
          <Route path="/admin/machine-management"    element={<PrivateRoute><MachineManagement /></PrivateRoute>} />
          <Route path="/admin/modality-management"   element={<PrivateRoute><ModalityManagement /></PrivateRoute>} />
          <Route path="/admin/medical-professionals" element={<PrivateRoute><ProfessionalManagement /></PrivateRoute>} />
          <Route path="/admin/hospitalization-plans" element={<PrivateRoute><HospitalizationPlanManagement /></PrivateRoute>} />
          <Route path="/admin/hospitalization-types" element={<PrivateRoute><HospitalizationCaseTypeManagement /></PrivateRoute>} />
          <Route path="/admin/patient-management"    element={<PrivateRoute><PatientManagement /></PrivateRoute>} />
          <Route path="/admin/room-management"       element={<PrivateRoute><RoomManagement /></PrivateRoute>} />
          <Route path="/admin/activity-logs"         element={<PrivateRoute><ActivityLogs /></PrivateRoute>} />

          {/* ── Frontdesk — single route set for every department ── */}
          <Route path="/frontdesk/dashboard"     element={<PrivateRoute><FrontdeskDashboard /></PrivateRoute>} />
          <Route path="/frontdesk/schedules"     element={<PrivateRoute><FrontdeskScheduleManagement /></PrivateRoute>} />
          <Route path="/frontdesk/professionals" element={<PrivateRoute><FrontdeskProfessionalManagement /></PrivateRoute>} />
          <Route path="/frontdesk/machines"      element={<PrivateRoute><FrontdeskMachineManagement /></PrivateRoute>} />
          <Route path="/frontdesk/modalities"    element={<PrivateRoute><FrontdeskModalityManagement /></PrivateRoute>} />
          <Route path="/frontdesk/rooms"         element={<PrivateRoute><FrontdeskRoomManagement /></PrivateRoute>} />

          {/* ── Legacy redirects — old Radiology / Rehab URLs → unified ── */}
          <Route path="/radiology/dashboard"          element={<Navigate to="/frontdesk/dashboard"     replace />} />
          <Route path="/radiology/schedules"          element={<Navigate to="/frontdesk/schedules"     replace />} />
          <Route path="/radiology/machine"            element={<Navigate to="/frontdesk/machines"      replace />} />
          <Route path="/radiology/professionals"      element={<Navigate to="/frontdesk/professionals" replace />} />
          <Route path="/frontdesk/rehab-dashboard"    element={<Navigate to="/frontdesk/dashboard"     replace />} />
          <Route path="/frontdesk/rehab-schedules"    element={<Navigate to="/frontdesk/schedules"     replace />} />
          <Route path="/frontdesk/rehab-professionals" element={<Navigate to="/frontdesk/professionals" replace />} />

          {/* ── 404 catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}