/*
import { useState } from "react";
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { Link } from "react-router-dom";
import hospitalBg from "../../assets/hospital-bg.jpg";

// validation
const signUpSchema = Yup.object({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});


function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
       {message}
    </p>
  );
}

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  
  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: signUpSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await axios.post("/auth/register", {
          username: values.username,
          email: values.email,
          password: values.password,
        });

        console.log("Sign up response:", response.data);
       

      } catch (error) {
        setServerError("Registration failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  
  const inputClass = (field) =>
    `w-full py-3 rounded-xl border bg-surface-input text-primary placeholder-gray-400 text-sm
     focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200
     ${formik.touched[field] && formik.errors[field]
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

     
      <div className="relative z-10 w-full max-w-lg mx-4 my-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card px-10 py-10">

   
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold font-montserrat text-accent leading-tight">
              Hospital
            </h1>
            <h2 className="text-xl font-semibold font-montserrat text-primary mt-1 tracking-wide">
              Scheduling System
            </h2>
          </div>

     
          <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">

        
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-primary mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={17} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter Username"
                  className={`${inputClass("username")} pl-10 pr-4`}
                  {...formik.getFieldProps("username")}
                />
              </div>
              <FieldError message={formik.touched.username && formik.errors.username} />
            </div>

      
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-primary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={17} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter Email Address"
                  
                  className={`${inputClass("email")} pl-10 pr-4`}

                  {...formik.getFieldProps("email")}
                />
              </div>
              <FieldError message={formik.touched.email && formik.errors.email} />
            </div>

       
            <div className="space-y-5">

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-primary mb-1.5">
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

             
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-primary mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={17} />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className={`${inputClass("confirmPassword")} pl-10 pr-11`}
                    {...formik.getFieldProps("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <FieldError message={formik.touched.confirmPassword && formik.errors.confirmPassword} />
              </div>

            </div>

          
            {serverError && (
              <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3">
                ⚠ {serverError}
              </div>
            )}

        
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary-light active:bg-primary-dark
                         text-white font-semibold text-base tracking-wide
                         shadow-md hover:shadow-lg
                         transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer active:translate-y-0
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {formik.isSubmitting ? "Signing up…" : "Sign Up"}
            </button>
          </form>

       
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent hover:text-accent-dark transition-colors duration-200">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

*/