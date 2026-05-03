import { useState, useEffect, useCallback } from "react";
import {
  Cross, CheckCircle, Clock, XCircle,
} from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  TabBar,
  DataTable,
  ActionDropdown,
  ConfirmDialog,
} from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";


const TABS = [
  { label: "All",         icon: Cross,       tabStatus: null          },
  { label: "Available",   icon: CheckCircle, tabStatus: "Available"   },
  { label: "Unavailable", icon: XCircle,     tabStatus: "Unavailable" },
  { label: "On Leave",    icon: Clock,       tabStatus: "On_Leave"    },
];

const confirmMeta = {
  leave: {
    title:  "Mark as On Leave?",
    msg:    (n) => `"${n}" will be marked as On Leave.`,
    label:  "Confirm",
    danger: false,
  },
  unavailable: {
    title:  "Mark as Unavailable?",
    msg:    (n) => `"${n}" will be marked as Unavailable.`,
    label:  "Confirm",
    danger: true,
  },
  available: {
    title:  "Mark as Available?",
    msg:    (n) => `"${n}" will be marked as Available.`,
    label:  "Confirm",
    danger: false,
  },
};


function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function formatStatus(status) {
  if (status === "On_Leave")    return "On Leave";
  if (status === "Unavailable") return "Unavailable";
  if (status === "Available")   return "Available";
  return status ?? "—";
}

function getDoctorActions(status) {
  if (status === "Available") {
    return [
      { label: "On Leave",    icon: Clock   },
      { label: "Unavailable", icon: XCircle },
    ];
  }
  if (status === "On_Leave") {
    return [
      { label: "Available",   icon: CheckCircle },
      { label: "Unavailable", icon: XCircle     },
    ];
  }
  if (status === "Unavailable") {
    return [{ label: "Available", icon: CheckCircle }];
  }
  return [];
}


export default function FrontdeskProfessionalManagement() {
  const navItems               = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [activeTab,     setActiveTab]     = useState("All");
  const [professionals, setProfessionals] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const activeTabStatus = TABS.find((t) => t.label === activeTab)?.tabStatus ?? null;
  const isSearching     = debouncedSearch.trim().length > 0;

  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      if (isSearching) {
      
        const res = await axios.get(
          `/api/searchDoctor/${encodeURIComponent(debouncedSearch.trim())}`,
          {
            headers: getAuthHeader(),
            params: { page: 0, size: 200 }, 
          }
        );

        const all = res.data?.content ?? [];

        const filtered = activeTabStatus
          ? all.filter((d) => d.availabilityStatus === activeTabStatus)
          : all;

        const PAGE_SIZE   = 10;
        const totalItems  = filtered.length;
        const computedPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
        const safePage      = Math.min(page, computedPages);
        const start         = (safePage - 1) * PAGE_SIZE;

        setProfessionals(filtered.slice(start, start + PAGE_SIZE));
        setTotalPages(computedPages);
      } else {
        const res = await axios.get("/api/getDoctors", {
          headers: getAuthHeader(),
          params: {
            page: page - 1, 
            size: 10,
            ...(activeTabStatus && { availabilityStatus: activeTabStatus }),
          },
        });

        setProfessionals(res.data?.content ?? []);
        setTotalPages(res.data?.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch professionals:", err);
      setProfessionals([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTabStatus, page, isSearching]);

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals]);


  function handleAction(action, professional) {
    if (action === "On Leave")    return setConfirmAction({ type: "leave",       professional });
    if (action === "Unavailable") return setConfirmAction({ type: "unavailable", professional });
    if (action === "Available")   return setConfirmAction({ type: "available",   professional });
  }

  async function applyConfirm() {
    const { type, professional } = confirmAction;
    try {
      const endpointMap = {
        leave:       `/api/leaveDoctor/${professional.doctorId}`,
        unavailable: `/api/unavailableDoctor/${professional.doctorId}`,
        available:   `/api/availableDoctor/${professional.doctorId}`,
      };
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      await fetchProfessionals();
    } catch (err) {
      console.error("Failed to apply action:", err);
    } finally {
      setConfirmAction(null);
    }
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];

  return (
    <AdminLayout
      navItems={navItems}
      pageTitle="Medical Professionals"
      pageSubtitle={deptName}
      userRole={userRole}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Medical Professional"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setSearchQuery(""); }}
      />

      <DataTable
        columns={["Full Name", "Role", "Status", "Action"]}
        rows={professionals}
        loading={loading}
        emptyIcon={Cross}
        emptyText="No medical professionals found"
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        renderRow={(professional) => (
          <tr
            key={professional.doctorId}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {professional.fullName}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {professional.roleName ?? "—"}
            </td>
            <td className="px-6 py-4 text-center">
              {(() => {
                const s          = professional.availabilityStatus;
                const label      = formatStatus(s);
                const colorClass =
                  s === "Unavailable" ? "text-red-500 font-bold"
                  : s === "On_Leave"  ? "text-yellow-400 font-bold"
                  :                     "text-green-500 font-bold";
                return <span className={`text-sm ${colorClass}`}>{label}</span>;
              })()}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getDoctorActions(professional.availabilityStatus)}
                onAction={(action) => handleAction(action, professional)}
              />
            </td>
          </tr>
        )}
      />

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.professional.fullName)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}