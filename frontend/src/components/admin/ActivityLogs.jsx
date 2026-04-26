import { useState, useEffect, useCallback } from "react";
import {
  History, Plus, CheckCircle, XCircle, Clock,
  Archive, RefreshCw, MinusCircle, CalendarCheck, Pencil,
} from "lucide-react";
import axios from "../../config/axiosInstance";
import { AdminLayout, TabBar } from "../ui";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const TABS = [
  { label: "All",       icon: History       },
  { label: "Added",     icon: Plus          },
  { label: "Updated",   icon: Pencil        },
  { label: "Scheduled", icon: Clock         },
  { label: "Confirmed", icon: CalendarCheck },
  { label: "Done",      icon: CheckCircle   },
  { label: "Cancelled", icon: XCircle       },
  { label: "Restored",  icon: RefreshCw     },
  { label: "Archived",  icon: Archive       },
  { label: "Disabled",  icon: MinusCircle   },
  { label: "Activated", icon: CheckCircle   },
];

const TAB_TO_HEADER = {
  All:       null,
  Added:     "Added",
  Updated:   "Updated",
  Scheduled: "Scheduled",
  Confirmed: "Confirmed",
  Done:      "Done",
  Cancelled: "Cancelled",
  Restored:  "Restored",
  Archived:  "Archived",
  Disabled:  "Disabled",
  Activated: "Activated",
};

// Keywords that render the header in red (accent color)
const DANGER_KEYWORDS = ["cancelled", "disabled", "archived"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month:  "long",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isDanger(logHeader = "") {
  const lower = logHeader.toLowerCase();
  return DANGER_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function LogCard({ log }) {
  const danger = isDanger(log.logHeader);

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-start gap-6">
      {/* Header label — fixed width so descriptions align */}
      <p
        className={`text-sm font-bold whitespace-nowrap shrink-0 w-52
          ${danger ? "text-accent" : "text-primary"}`}
      >
        {log.logHeader}:
      </p>

      {/* Description + timestamp */}
      <p className="text-sm text-gray-600">
        {log.description}
        {log.createdAt && (
          <span className="text-gray-400 ml-1">
            ({formatDateTime(log.createdAt)})
          </span>
        )}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 flex flex-col items-center gap-3">
      <History size={36} className="text-gray-300" />
      <p className="text-sm text-gray-400">No activity logs found</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-center gap-6"
        >
          <div className="h-4 bg-gray-200 rounded w-44 shrink-0" />
          <div className="h-4 bg-gray-100 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-center gap-3 mt-5">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200
                   text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed
                   transition-colors cursor-pointer text-lg leading-none"
      >
        ‹
      </button>
      <span className="text-sm font-semibold text-primary">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200
                   text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed
                   transition-colors cursor-pointer text-lg leading-none"
      >
        ›
      </button>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ActivityLogs() {
  const [activeTab,   setActiveTab]   = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  // Reset to page 1 on tab/search change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [activeTab, searchQuery, page]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const logHeader = TAB_TO_HEADER[activeTab] ?? null;

      const params = {
        page: page - 1,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
        ...(logHeader          && { logHeader }),
        ...(searchQuery.trim() && { logHeader: searchQuery.trim() }),
      };

      const res      = await axios.get("/api/getLogs", {
        headers: getAuthHeader(),
        params,
      });

      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setLogs(content);
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  return (
    <AdminLayout
      pageTitle="Activity Logs"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search logs"
    >
      {/* Tabs — no Add button */}
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
      />

      {/* Log cards */}
      <div className="space-y-3 mt-2">
        {loading ? (
          <LoadingSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          logs.map((log) => (
            <LogCard key={log.logId} log={log} />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && logs.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(p - 1, 1))}
          onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        />
      )}
    </AdminLayout>
  );
}