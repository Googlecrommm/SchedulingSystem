import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loginpage from "./components/auth/Loginpage";
 
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Loginpage />} />
      </Routes>
    </BrowserRouter>
  );
}
 