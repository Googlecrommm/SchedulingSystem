import { useMemo } from "react";
import {
  LayoutDashboard, Calendar, Cpu, Cross, BedDouble,
} from "lucide-react";


function decodeJwtPayload() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return {};
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}



function extractRole(payload) {
  const raw = payload.roles ?? payload.role ?? payload.authorities ?? payload.authority;

  if (!raw) {
    return localStorage.getItem("userRole") ?? "Frontdesk";
  }

  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
    const authority = raw[0]?.authority ?? "";
    return authority.replace(/^ROLE_/i, "");
  }

  if (Array.isArray(raw) && raw.length > 0) {
    return String(raw[0]).replace(/^ROLE_/i, "");
  }

  return String(raw).replace(/^ROLE_/i, "");
}



function extractDept(payload) {
  const fromToken =
    payload.departmentName ??
    payload.department     ??
    payload.dept           ??
    null;

  if (fromToken && typeof fromToken === "string") return fromToken;

  return localStorage.getItem("departmentName") ?? "Department";
}


export function useDeptMeta() {
  return useMemo(() => {
    const payload  = decodeJwtPayload();
    const deptName = extractDept(payload);
    const userRole = extractRole(payload);
    const userName =
      payload.name ??
      payload.sub  ??
      localStorage.getItem("userName") ??
      "User";

    return { deptName, userRole, userName };
  }, []);
}


export function useFrontdeskNav() {
  return useMemo(() => [
    { label: "Dashboard",             icon: LayoutDashboard, path: "/frontdesk/dashboard"    },
    { label: "Schedules",             icon: Calendar,        path: "/frontdesk/schedules"     },
    { label: "Medical Professionals", icon: Cross,           path: "/frontdesk/professionals" },
    { label: "Machines",              icon: Cpu,             path: "/frontdesk/machines"      },
    { label: "Rooms",                 icon: BedDouble,       path: "/frontdesk/rooms"         },
  ], []);
}