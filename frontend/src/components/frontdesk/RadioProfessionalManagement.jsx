import { useState, useEffect, useCallback } from "react";
import {
  Cross,
  CheckCircle,
  Clock,
  XCircle,
  LayoutDashboard,
  Calendar,
  Cpu,
} from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  TabBar,
  DataTable,
  ActionDropdown,
  StatusBadge,
  ConfirmDialog,
} from "../ui";



const radiologyNavItems = [
  { label: "Dashboard",           icon: LayoutDashboard, path: "/radiology/dashboard"    },
  { label: "Schedules",           icon: Calendar,        path: "/radiology/schedules"    },
  { label: "Machine",             icon: Cpu,             path: "/radiology/machine"      },
  { label: "Medical Professionals", icon: Cross,         path: "/radiology/professionals" },
];



function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}


function formatStatus(status) {
  if (status === "On_Leave")    return "On Leave";
  if (status === "Unavailable") return "Unavailable";
  if (status === "Available")   return "Available";
  return status ?? "—";
}



const TABS = [
  { label: "All",         icon: Cross,        tabStatus: null          },
  { label: "Available",   icon: CheckCircle,  tabStatus: "Available"   },
  { label: "Unavailable", icon: XCircle,      tabStatus: "Unavailable" },
  { label: "On Leave",    icon: Clock,        tabStatus: "On_Leave"    },
];



function getDoctorActions(doctor) {
  const s = doctor.availabilityStatus;

  if (s === "Available") {
    return [
      { label: "On Leave",    icon: Clock   },
      { label: "Unavailable", icon: XCircle },
    ];
  }
  if (s === "On_Leave") {
    return [
      { label: "Available",   icon: CheckCircle },
      { label: "Unavailable", icon: XCircle     },
    ];
  }
  if (s === "Unavailable") {
    return [
      { label: "Available", icon: CheckCircle },
    ];
  }
  return [];
}


const confirmMeta = {
  leave: {
    title: "Mark as On Leave?",
    msg:   (n) => `"${n}" will be marked as On Leave.`,
    label: "Confirm",
    danger: false,
  },
  unavailable: {
    title: "Mark as Unavailable?",
    msg:   (n) => `"${n}" will be marked as Unavailable.`,
    label: "Confirm",
    danger: true,
  },
  available: {
    title: "Mark as Available?",
    msg:   (n) => `"${n}" will be marked as Available.`,
    label: "Confirm",
    danger: false,
  },
};



export default function RadioProfessionalManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [serverResults, setServerResults] = useState(null);


  useEffect(() => {
    setPage(1);
    setSearchQuery("");
    setServerResults(null);
  }, [activeTab]);

  
  const activeTabStatus = TABS.find((t) => t.label === activeTab)?.tabStatus ?? null;

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page - 1, 
        size: 10,
        ...(activeTabStatus && { availabilityStatus: activeTabStatus }),
      };
      const res = await axios.get("/api/getDoctors", {
        headers: getAuthHeader(),
        params,
      });
      setProfessionals(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch professionals:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setServerResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          "/api/searchDoctor/" + encodeURIComponent(searchQuery.trim()),
          { headers: getAuthHeader(), params: { page: 0, size: 100 } }
        );
        setServerResults(res.data.content ?? []);
      } catch (err) {
        console.error("Search failed, using local filter:", err);
        setServerResults(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const displayed = serverResults ?? professionals;

 
  function handleAction(action, professional) {
    if (action === "On Leave")    return setConfirmAction({ type: "leave",       professional });
    if (action === "Unavailable") return setConfirmAction({ type: "unavailable", professional });
    if (action === "Available")   return setConfirmAction({ type: "available",   professional });
  }

 
  async function applyConfirm() {
    const { type, professional } = confirmAction;
    try {
      if (type === "leave") {
        await axios.put("/api/leaveDoctor/" + professional.doctorId, {}, { headers: getAuthHeader() });
      } else if (type === "unavailable") {
        await axios.put("/api/unavailableDoctor/" + professional.doctorId, {}, { headers: getAuthHeader() });
      } else if (type === "available") {
        await axios.put("/api/availableDoctor/" + professional.doctorId, {}, { headers: getAuthHeader() });
      }
      await fetchProfessionals();
    } catch (err) {
      console.error("Failed to apply action (" + type + "):", err);
    } finally {
      setConfirmAction(null);
    }
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];


  return (
    <AdminLayout
      navItems={radiologyNavItems}
      pageTitle="Medical Professionals Management"
      pageSubtitle="Radiology"
      userName="Radiology"
      userRole="Radiology Frontdesk"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Radiologist"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
     
      />

      <DataTable
        columns={["Full Name", "Role", "Status", "Action"]}
        rows={displayed}
        loading={loading}
        emptyIcon={Cross}
        emptyText="No professionals found"
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
              {professional.name}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {professional.roleName ?? "—"}
            </td>
            <td className="px-6 py-4 text-center">
              {(() => {
                const s = professional.availabilityStatus;
                const label = formatStatus(s);
                const colorClass =
                  s === "Unavailable" ? "text-red-500 font-bold"
                  : s === "On_Leave"  ? "text-yellow-400 font-bold"
                  :                     "text-green-500 font-bold";
                return <span className={`text-sm ${colorClass}`}>{label}</span>;
              })()}
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getDoctorActions(professional)}
                onAction={(action) => handleAction(action, professional)}
              />
            </td>
          </tr>
        )}
      />

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.professional.name)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}
