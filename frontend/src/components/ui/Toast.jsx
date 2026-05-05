import { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

// ── Toast context / hook ──────────────────────────────────────────────────────

let _addToast = null;

/** Call anywhere (inside or outside React) to fire a toast. */
export function toast(message, type = "success") {
  _addToast?.({ message, type, id: Date.now() + Math.random() });
}

/** Drop-in hook that returns { showToast } for component-level use. */
export function useToast() {
  const showToast = useCallback((message, type = "success") => {
    toast(message, type);
  }, []);
  return { showToast };
}

// ── Individual toast item ─────────────────────────────────────────────────────

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
};

const COLORS = {
  success: {
    bar:    "bg-green-500",
    icon:   "text-green-500",
    border: "border-green-100",
  },
  error: {
    bar:    "bg-red-500",
    icon:   "text-red-500",
    border: "border-red-100",
  },
  warning: {
    bar:    "bg-yellow-400",
    icon:   "text-yellow-500",
    border: "border-yellow-100",
  },
};

const DURATION = 3500; // ms

function ToastItem({ toast: t, onRemove }) {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);

  // Slide in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Progress bar countdown
  useEffect(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct     = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct === 0) clearInterval(intervalRef.current);
    }, 16);

    const timeout = setTimeout(() => dismiss(), DURATION);
    return () => { clearInterval(intervalRef.current); clearTimeout(timeout); };
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => onRemove(t.id), 300);
  }

  const Icon   = ICONS[t.type]  ?? ICONS.success;
  const colors = COLORS[t.type] ?? COLORS.success;

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 bg-white rounded-xl shadow-lg
        border ${colors.border} overflow-hidden
        transition-all duration-300 ease-in-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bar}`} />

      {/* Icon */}
      <div className={`mt-3.5 ml-4 shrink-0 ${colors.icon}`}>
        <Icon size={18} />
      </div>

      {/* Message */}
      <p className="flex-1 py-3.5 pr-2 text-base text-gray-700 font-medium leading-snug">
        {t.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="mt-3 mr-3 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${colors.bar} transition-none`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── ToastContainer — mount once near the root ─────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  // Wire up the global singleton
  useEffect(() => {
    _addToast = (t) => setToasts((prev) => [...prev, t]);
    return () => { _addToast = null; };
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}