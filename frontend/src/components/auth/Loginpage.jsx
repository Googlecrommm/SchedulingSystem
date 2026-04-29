import { useState } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import hospitalBg from "../../assets/hospital-bg.jpg";
import DGMCLogo from "../../assets/dgmc-logo.png";
import axios from "axios";

const loginSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

// ── Role → landing page ───────────────────────────────────────────────────────
// Matches getUser.getRole().getRoleName() from AuthService.java.
// The backend returns the exact roleName string stored in your DB.
// Add any new role names your backend returns inside the switch below.
function getRedirectPath(roleName) {
  if (!roleName) return "/";

  switch (roleName.trim().toLowerCase()) {
    case "admin":
    case "administrator":
      return "/admin/dashboard";

    // All frontdesk-type roles → unified frontdesk dashboard.
    // Backend JWT scopes API data to the user's department automatically.
    case "frontdesk":
    case "front desk":
    case "radiology":
    case "rehabilitation":
    case "rehab":
      return "/frontdesk/dashboard";

    default:
      // Safety net: unknown role goes back to login, never a white screen.
      // Check your browser console for the actual roleName and add it above.
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
  const [serverError,  setServerError]  = useState(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
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

        navigate(getRedirectPath(role), { replace: true });
      } catch (error) {
        setServerError(
          error.response?.data?.message ||
            "Login failed. Please check your credentials."
        );
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

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

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