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
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await axios.post(
          "http://localhost:8080/auth/login",
          {
            email: values.username,
            password: values.password,
          }
        );

        console.log("Login success:", response.data);
        localStorage.setItem("token",    response.data.token);
        localStorage.setItem("userName", response.data.name);
        localStorage.setItem("userRole", response.data.role);
        navigate("/admin/user-management");
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

    
      <div
        className="absolute inset-0 bg-cover bg-center blur-md scale-110"
        style={{ backgroundImage: `url(${hospitalBg})` }}
      />
      <div className="absolute inset-0 bg-black/40" />

   
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#f0f0f0] rounded-2xl shadow-card px-10 py-12">

         
          <div className="flex justify-center mb-8">
            <img
              src={DGMCLogo}
              alt="DGMC - Divine Grace Medical Center"
              className="w-[220px] object-contain"
            />
          </div>

          <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">

         
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
              <FieldError
                message={formik.touched.username && formik.errors.username}
              />
            </div>

          
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
              <FieldError
                message={formik.touched.password && formik.errors.password}
              />
            </div>

          
            {serverError && (
              <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

           
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