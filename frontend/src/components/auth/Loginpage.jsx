import { useState } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Navigate } from "react-router-dom";
import hospitalBg from "../../assets/hospital-bg.jpg";
import DGMCLogo from "../../assets/dgmc-logo.png";
import axios from "axios";
import { toast } from "../ui/Toast"; // adjust path to match your project

// ── Auth guard helpers ────────────────────────────────────────────────────────

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

const loginSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

// ── Role → landing page ───────────────────────────────────────────────────────
function getRedirectPath(roleName) {
  if (!roleName) return "/";

  switch (roleName.trim().toLowerCase()) {
    case "admin":
    case "administrator":
      return "/admin/dashboard";

    case "frontdesk":
    case "front desk":
    case "radiology":
    case "rehabilitation":
    case "rehab":
      return "/frontdesk/dashboard";

    default:
      console.warn("Unrecognised roleName — add it to getRedirectPath():", roleName);
      return "/";
  }
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      {message}
    </p>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ── Already logged in? Skip the login page ────────────────────────────────
  const existingToken = localStorage.getItem("token");
  if (existingToken && !isTokenExpired(existingToken)) {
    const role = getRoleFromToken(existingToken).toLowerCase();
    const dest = (role === "admin" || role === "administrator")
      ? "/admin/dashboard"
      : "/frontdesk/dashboard";
    return <Navigate to={dest} replace />;
  }

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const response = await axios.post(
          "http://localhost:8080/auth/login",
          { email: values.username, password: values.password }
        );

        // AuthResponseDTO: { token, name, role (= roleName), departmentName }
        const { token, name, role, departmentName } = response.data;

        // Persist everything the rest of the app needs from localStorage
        localStorage.setItem("token",         token          ?? "");
        localStorage.setItem("userName",       name           ?? "");
        localStorage.setItem("userRole",       role           ?? "");
        localStorage.setItem("departmentName", departmentName ?? "");

        // ✅ Success toast
        toast(`Welcome back, ${name || "User"}!`, "success");

        navigate(getRedirectPath(role), { replace: true });
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Login failed. Please check your credentials.";

        // ❌ Error toast
        toast(message, "error");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const inputClass = (field) =>
    `w-full py-3 rounded-xl border bg-surface-input
     text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary
     transition-all duration-200
     ${
       formik.touched[field] && formik.errors[field]
         ? "border-red-400 focus:ring-red-200"
         : "border-surface-border focus:ring-primary/30"
     }`;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-body overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-md scale-110"
        style={{ backgroundImage: `url(${hospitalBg})` }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#f0f0f0] rounded-2xl shadow-card px-10 py-12">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={DGMCLogo}
              alt="DGMC - Divine Grace Medical Center"
              className="w-[220px] object-contain"
            />
          </div>

          <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-primary mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={17} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter Email"
                  className={`${inputClass("username")} pl-10 pr-4`}
                  {...formik.getFieldProps("username")}
                />
              </div>
              <FieldError message={formik.touched.username && formik.errors.username} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-primary mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={17} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  className={`${inputClass("password")} pl-10 pr-11`}
                  {...formik.getFieldProps("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <FieldError message={formik.touched.password && formik.errors.password} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                         text-white font-semibold text-base tracking-wide shadow-md hover:shadow-lg
                         transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {formik.isSubmitting ? "Validating…" : "Login"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}