import { useState, useEffect, useCallback } from "react";
import { Layers } from "lucide-react";
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

export default function FrontdeskModalityManagement() {
  const navItems           = useFrontdeskNav();
  const { deptName, userRole } = useDeptMeta();

  const [modalities,  setModalities]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { fetchModalities(); }, [debouncedSearch, page]);

  // Generic endpoint — backend filters by dept from JWT, Active only
  const fetchModalities = useCallback(async () => {
    setLoading(true);
    try {
      const url = debouncedSearch.trim()
        ? `/api/searchModality/${encodeURIComponent(debouncedSearch.trim())}`
        : `/api/getModalities`;

      const res = await axios.get(url, {
        headers: getAuthHeader(),
        params: {
          page,
          size: 10,
          sort: "modalityName,asc",
          ...(!debouncedSearch.trim() && { modalityStatus: "Active" }),
        },
      });

      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];
      setModalities(content.filter((m) => m.modalityStatus !== "Archived"));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch modalities:", err);
      setModalities([]); setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  return (
    <AdminLayout
      navItems={navItems}
      pageTitle="Modality Management"
      pageSubtitle={deptName}
      userRole={userRole}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Modality"
    >
      {/* Static single tab */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        <div className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary
          border-b-2 border-primary -mb-px">
          <Layers size={15} className="shrink-0" />
          All
        </div>
      </div>

      <DataTable
        columns={["Modality", "Department"]}
        rows={modalities}
        loading={loading}
        emptyIcon={Layers}
        emptyText="No modalities found"
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(modality) => (
          <tr key={modality.modalityId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
              {modality.modalityName}
            </td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">
              {modality.departmentName ?? "—"}
            </td>
          </tr>
        )}
      />
    </AdminLayout>
  );
}
