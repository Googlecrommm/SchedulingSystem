import { useState, useEffect, useCallback, useRef } from "react";
import { BedDouble, CheckCircle, Wrench } from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  DataTable,
  ActionDropdown,
  StatusBadge,
  ConfirmDialog,
} from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";
import { useToast } from "../ui/Toast"; // adjust path to wherever you place Toast.jsx


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

function getRoomActions(rawStatus) {
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

const toastMessages = {
  maintenance: (n) => `"${n}" is now Under Maintenance.`,
  available:   (n) => `"${n}" is now Available.`,
};

const STATUS_TABS = [
  { label: "All",               value: "All",               icon: BedDouble    },
  { label: "Available",         value: "Available",         icon: CheckCircle  },
  { label: "Under Maintenance", value: "Under_Maintenance", icon: Wrench       },
];


export default function FrontdeskRoomManagement() {
  const navItems               = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();
  const { showToast }          = useToast();

  const [rooms,         setRooms]         = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [activeTab,     setActiveTab]     = useState("All");

  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchRooms = useCallback(async (currentPage, search, tab) => {
    setLoading(true);
    try {
      const isSearching = search.trim().length > 0;

      let url;
      let params;

      if (isSearching) {
        url = `/api/searchRoom/${encodeURIComponent(search.trim())}`;
        params = { page: currentPage, size: 10, sort: "roomName,asc" };
      } else {
        url = `/api/getRooms`;
        params = {
          page: currentPage,
          size: 10,
          sort: "roomName,asc",
          ...(tab !== "All" && { roomStatus: tab }),
        };
      }

      const res      = await axios.get(url, { headers: getAuthHeader(), params });
      const pageData = res.data;
      let content    = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      content = content.filter((r) => r.roomStatus !== "Archived");

      if (isSearching && tab !== "All") {
        content = content.filter((r) => r.roomStatus === tab);
      }

      setRooms(content);
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setRooms([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms(page, debouncedSearch, activeTab);
  }, [fetchRooms, page, debouncedSearch, activeTab]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
  }, [debouncedSearch, activeTab]);


  function handleAction(action, room) {
    if (action === "Under Maintenance") return setConfirmAction({ type: "maintenance", room });
    if (action === "Available")         return setConfirmAction({ type: "available",   room });
  }

  async function applyConfirm() {
    const { type, room } = confirmAction;
    try {
      const endpointMap = {
        maintenance: `/api/markMaintenance/${room.roomId}`,
        available:   `/api/restoreRoom/${room.roomId}`,
      };
      await axios.put(endpointMap[type], {}, { headers: getAuthHeader() });
      showToast(toastMessages[type](room.roomName), "success");
      await fetchRooms(page, debouncedSearch, activeTab);
    } catch (err) {
      console.error("Failed to update room status:", err);
      showToast("Failed to update room status.", "error");
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
      pageTitle="Room Management"
      pageSubtitle={deptName}
      userRole={userRole}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Room"
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
        columns={["Room", "Status", "Action"]}
        rows={rooms}
        loading={loading}
        emptyIcon={BedDouble}
        emptyText="No rooms found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(room) => (
          <tr key={room.roomId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {room.roomName}
            </td>
            <td className="px-6 py-4 text-center">
              <StatusBadge status={formatStatus(room.roomStatus)} />
            </td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={getRoomActions(room.roomStatus)}
                onAction={(action) => handleAction(action, room)}
              />
            </td>
          </tr>
        )}
      />

      {confirmAction && meta && (
        <ConfirmDialog
          title={meta.title}
          message={meta.msg(confirmAction.room.roomName)}
          confirmLabel={meta.label}
          danger={meta.danger}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}