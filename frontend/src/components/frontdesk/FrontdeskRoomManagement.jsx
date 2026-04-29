import { useState, useEffect, useCallback } from "react";
import { BedDouble } from "lucide-react";
import axios from "../../config/axiosInstance";

import {
  AdminLayout,
  DataTable,
} from "../ui";
import { useFrontdeskNav, useDeptMeta } from "./frontdeskUtils";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FrontdeskRoomManagement() {
  const navItems           = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [rooms,       setRooms]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { fetchRooms(); }, [debouncedSearch, page]);

  // Generic endpoint — backend filters by dept from JWT, Active only
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const url = debouncedSearch.trim()
        ? `/api/searchRoom/${encodeURIComponent(debouncedSearch.trim())}`
        : `/api/getRooms`;

      const res = await axios.get(url, {
        headers: getAuthHeader(),
        params: {
          page,
          size: 10,
          sort: "roomName,asc",
          ...(!debouncedSearch.trim() && { roomStatus: "Active" }),
        },
      });

      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];
      setRooms(content.filter((r) => r.roomStatus !== "Archived"));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setRooms([]); setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

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
      {/* Static single tab */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        <div className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary
          border-b-2 border-primary -mb-px">
          <BedDouble size={15} className="shrink-0" />
          All
        </div>
      </div>

      <DataTable
        columns={["Room"]}
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
          </tr>
        )}
      />
    </AdminLayout>
  );
}
