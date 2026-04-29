/**
 * frontdeskUtils.js
 *
 * Shared helpers for all unified frontdesk pages.
 * The backend scopes every API call by the authenticated user's department,
 * extracted from the JWT token — so the frontend never needs to hardcode a
 * department name. These utilities decode display labels from the JWT.
 */

import { useMemo } from "react";
import {
  LayoutDashboard, Calendar, Cpu, Cross, BedDouble, Layers,
} from "lucide-react";

// ── JWT decoder ───────────────────────────────────────────────────────────────

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

// ── Role extractor ────────────────────────────────────────────────────────────
// Spring Security serialises the `roles` / `authorities` claim in several
// possible shapes depending on the JwtService implementation:
//
//   1. Plain string:          "Frontdesk"
//   2. Array of strings:      ["Frontdesk"]
//   3. Array of objects:      [{ "authority": "ROLE_Frontdesk" }]   ← most common
//
// This function handles all three and always returns a clean string.

function extractRole(payload) {
  // Try the common Spring Security claim names
  const raw = payload.roles ?? payload.role ?? payload.authorities ?? payload.authority;

  if (!raw) {
    // Last resort: check localStorage (saved at login time)
    return localStorage.getItem("userRole") ?? "Frontdesk";
  }

  // Case 3 — array of objects [{ authority: "ROLE_Frontdesk" }]
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
    const authority = raw[0]?.authority ?? "";
    // Strip "ROLE_" prefix that Spring adds automatically
    return authority.replace(/^ROLE_/i, "");
  }

  // Case 2 — array of strings ["Frontdesk"]
  if (Array.isArray(raw) && raw.length > 0) {
    return String(raw[0]).replace(/^ROLE_/i, "");
  }

  // Case 1 — plain string
  return String(raw).replace(/^ROLE_/i, "");
}

// ── Department extractor ──────────────────────────────────────────────────────
// Your JwtService may or may not embed departmentName in the token.
// If it doesn't, fall back to what was saved in localStorage at login.

function extractDept(payload) {
  const fromToken =
    payload.departmentName ??
    payload.department     ??
    payload.dept           ??
    null;

  if (fromToken && typeof fromToken === "string") return fromToken;

  // Saved by Loginpage.jsx at login time
  return localStorage.getItem("departmentName") ?? "Department";
}

// ── Department meta ───────────────────────────────────────────────────────────

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

// ── Nav items ─────────────────────────────────────────────────────────────────

export function useFrontdeskNav() {
  return useMemo(() => [
    { label: "Dashboard",             icon: LayoutDashboard, path: "/frontdesk/dashboard"    },
    { label: "Schedules",             icon: Calendar,        path: "/frontdesk/schedules"     },
    { label: "Medical Professionals", icon: Cross,           path: "/frontdesk/professionals" },
    { label: "Machines",              icon: Cpu,             path: "/frontdesk/machines"      },
    { label: "Modalities",            icon: Layers,          path: "/frontdesk/modalities"    },
    { label: "Rooms",                 icon: BedDouble,       path: "/frontdesk/rooms"         },
  ], []);
}