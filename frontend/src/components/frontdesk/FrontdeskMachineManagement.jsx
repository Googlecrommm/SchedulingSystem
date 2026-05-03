import { useState, useEffect, useCallback, useRef } from "react";
import { Cpu, CheckCircle, Wrench } from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  StatusBadge,
  ConfirmDialog,
} from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";


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

function formatStatus(raw) {
  if (raw === "Under_Maintenance") return "Under Maintenance";
  return raw ?? "—";
}

function getMachineActions(rawStatus) {
  if (rawStatus === "Available")         return [{ label: "Under Maintenance", icon: Wrench      }];
  if (rawStatus === "Under_Maintenance") return [{ label: "Available",         icon: CheckCircle }];
  return [];
}

const confirmMeta = {
  maintenance: {
    title:  "Set Under Maintenance?",
    msg:    (n) => `"${n}" will be marked as Under Maintenance.`,
    label:  "Confirm",
    danger: false,
  },
  available: {
    title:  "Mark as Available?",
    msg:    (n) => `"${n}" will be marked as Available.`,
    label:  "Confirm",
    danger: false,
  },
};

const STATUS_TABS = [
  { label: "All",               value: "All",               icon: Cpu          },
  { label: "Available",         value: "Available",         icon: CheckCircle  },
  { label: "Under Maintenance", value: "Under_Maintenance", icon: Wrench       },
];


export default function FrontdeskMachineManagement() {
  const navItems               = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [machines,      setMachines]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [activeTab,     setActiveTab]     = useState("All");

  const debouncedSearch = useDebounce(searchQuery, 400);


  const fetchMachines = useCallback(async (currentPage, search, tab) => {
    setLoading(true);
    try {
      const isSearching = search.trim().length > 0;

      let url;
      let params;

      if (isSearching) {
   
        url = `/api/searchMachine/${encodeURIComponent(search.trim())}`;
        params = {
          page: currentPage,
          size: 10,
          sort: "machineName,asc",
        };
      } else {

        url = `/api/getMachines`;
        params = {
          page: currentPage,
          size: 10,
          sort: "machineName,asc",
          ...(tab !== "All" && { machineStatus: tab }),
        };
      }

      const res      = await axios.get(url, { headers: getAuthHeader(), params });
      const pageData = res.data;
      let content    = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

    
      content = content.filter((m) => m.machineStatus !== "Archived");

    
      if (isSearching && tab !== "All") {
        content = content.filter((m) => m.machineStatus === tab);
      }

      setMachines(content);
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch machines:", err);
      setMachines([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchMachines(page, debouncedSearch, activeTab);
  }, [fetchMachines, page, debouncedSearch, activeTab]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
  }, [debouncedSearch, activeTab]);


  function handleAction(action, machine) {
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", machine });
    if (action === "Available")         return setConfirmAction({ type: "available",   machine });
  }

  async function applyConfirm() {
    const { type, machine } = confirmAction;
    try {
      const endpointMap = {
        maintenance: `/api/markAsMaintenance/${machine.machineId}`,
        available:   `/api/activateMachine/${machine.machineId}`,
      };
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      await fetchMachines(page, debouncedSearch, activeTab);
    } catch (err) {
      console.error("Failed to update machine status:", err);
    } finally {
      setConfirmAction(null);
    }
  }

  function handleTabChange(tabValue) {
    setSearchQuery("");     
    setActiveTab(tabValue);
    setPage(0);
  }

  const meta = confirmAction && confirmMeta[confirmAction.type];


  return (
    <AdminLayout
      navItems={navItems}
      pageTitle="Machine Management"
      pageSubtitle={deptName}
      userRole={userRole}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Machines"
    >
      <div className="flex items-center border-b border-gray-200 mb-4">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors -mb-px
                ${isActive
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                }`}
            >
              <tab.icon size={15} className="shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <DataTable
        columns={["Machine Name", "Modality", "Status", "Action"]}
        rows={machines}
        loading={loading}
        emptyIcon={Cpu}
        emptyText="No machines found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(machine) => (
          <tr key={machine.machineId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {machine.machineName}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {machine.modalityName ?? "—"}
            </td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={formatStatus(machine.machineStatus)} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getMachineActions(machine.machineStatus)}
                onAction={(action) => handleAction(action, machine)}
              />
            </td>
          </tr>
        )}
      />

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.machine.machineName)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}