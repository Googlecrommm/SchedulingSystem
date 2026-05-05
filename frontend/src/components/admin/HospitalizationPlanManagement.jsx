import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ClipboardList, Archive, Pencil, RefreshCw } from "lucide-react";
import axios from "../../config/axiosInstance";
import { toast } from "../ui/Toast";

import {
  AdminLayout,
  TabBar,
  DataTable,
  ActionDropdown,
  Modal,
  ModalFooter,
  FormField,
  useInputClass,
  ConfirmDialog,
} from "../ui";

const TABS = [
  { label: "All",     icon: ClipboardList },
  { label: "Archive", icon: Archive       },
];

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const planSchema = Yup.object({
  code:        Yup.string().required("Code is required"),
  companyName: Yup.string().required("Company name is required"),
});

const PAGE_SIZE = 10;

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function PlanForm({ initialCode = "", initialCompanyName = "", submitLabel = "Submit", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { code: initialCode, companyName: initialCompanyName },
    validationSchema: planSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch {
     
      } finally {
        setSubmitting(false);
      }
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Code" error={formik.touched.code && formik.errors.code}>
        <input
          type="text"
          placeholder="Code"
          className={ic("code")}
          {...formik.getFieldProps("code")}
        />
      </FormField>
      <FormField label="Description" error={formik.touched.companyName && formik.errors.companyName}>
        <input
          type="text"
          placeholder="Description"
          className={ic("companyName")}
          {...formik.getFieldProps("companyName")}
        />
      </FormField>
      <ModalFooter
        onClear={() => formik.resetForm()}
        submitLabel={submitLabel}
        submitting={formik.isSubmitting}
      />
    </form>
  );
}


function mapPlan(p) {
  return {
    id:          p.planId,
    code:        p.code,
    companyName: p.companyName,
    archived:    p.planStatus === "Archived",
  };
}

export default function HospitalizationPlanManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editPlan,      setEditPlan]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [plans,         setPlans]         = useState([]);
  const [loading,       setLoading]       = useState(false);

  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchPlans();
  }, [activeTab, searchQuery, page]);

  async function fetchPlans() {
    setLoading(true);
    try {
      const statusParam = activeTab === "Archive" ? "Archived" : "Active";

  
      const url = searchQuery.trim()
        ? `/api/searchPlans/${encodeURIComponent(searchQuery.trim())}`
        : `/api/getPlans`;

      const params = {
        page,
        size: PAGE_SIZE,
        sort: "code,asc",
        ...(searchQuery.trim() ? {} : { planStatus: statusParam }),
      };

      const res = await axios.get(url, {
        headers: getAuthHeader(),
        params,
      });

      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setPlans(content.map(mapPlan));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch hospitalization plans:", err);
      setPlans([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  const filtered = searchQuery.trim()
    ? plans.filter((p) => (activeTab === "Archive" ? p.archived : !p.archived))
    : plans;

  function handleAction(action, plan) {
    if (action === "Edit")      return setEditPlan(plan);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   plan });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", plan });
  }

  async function applyConfirm() {
    const { type, plan } = confirmAction;
    try {
      
      const endpoint =
        type === "archive"
          ? `/api/archivePlan/${plan.id}`
          : `/api/restorePlan/${plan.id}`;

      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });

      toast(
        type === "archive"
          ? `Plan "${plan.code}" has been archived.`
          : `Plan "${plan.code}" has been restored.`,
        type === "archive" ? "warning" : "success"
      );
      await fetchPlans();
    } catch (err) {
      console.error(`Failed to ${type} hospitalization plan:`, err);
      toast(`Failed to ${type} plan.`, "error");
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Hospitalization Plans Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Hospitalization plan"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Plan"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Code", "Description", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={ClipboardList}
        emptyText={activeTab === "Archive" ? "No archived plans" : "No hospitalization plans found"}
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(plan) => (
          <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{plan.code}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{plan.companyName}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archive" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, plan)}
              />
            </td>
          </tr>
        )}
      />

      {showCreate && (
        <Modal title="Add Hospitalization Plan" onClose={() => setShowCreate(false)}>
          <PlanForm
            submitLabel="Submit"
            onSubmit={async (values) => {
             
              await axios.post(
                "/api/createPlan",
                { code: values.code, companyName: values.companyName },
                { headers: getAuthHeader() }
              );
              toast(`Plan "${values.code}" has been created.`);
              await fetchPlans();
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editPlan && (
        <Modal title="Edit Hospitalization Plan" onClose={() => setEditPlan(null)}>
          <PlanForm
            initialCode={editPlan.code}
            initialCompanyName={editPlan.companyName}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              
              await axios.put(
                `/api/updatePlan/${editPlan.id}`,
                {
                  code:        values.code,
                  companyName: values.companyName,
                },
                { headers: getAuthHeader() }
              );
              toast(`Plan "${values.code}" has been updated.`);
              await fetchPlans();
            }}
            onClose={() => setEditPlan(null)}
          />
        </Modal>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Plan?" : "Unarchive Plan?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.plan.code}" will be moved to the archive.`
              : `"${confirmAction.plan.code}" will be restored to active.`
          }
          confirmLabel={confirmAction.type === "archive" ? "Archive" : "Unarchive"}
          danger={confirmAction.type === "archive"}
          onConfirm={applyConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}