import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Cross, Archive, Pencil, RefreshCw, ChevronDown } from "lucide-react";

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
  { label: "All",      icon: Cross },
  { label: "Archived", icon: Archive     },
];

const PAGE_SIZE = 10;

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const professionalSchema = Yup.object({
  fullName:     Yup.string().required("Full name is required"),
  departmentId: Yup.string().required("Department is required"),
});

function ProfessionalForm({
  initialFullName = "",
  initialDepartmentId = "",
  submitLabel = "Submit",
  onSubmit,
  onClose,
  departments,
}) {
  const formik = useFormik({
    initialValues: { fullName: initialFullName, departmentId: initialDepartmentId },
    validationSchema: professionalSchema,
    onSubmit: (values, { setSubmitting }) => {
      onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Full name" error={formik.touched.fullName && formik.errors.fullName}>
        <input
          type="text"
          placeholder=""
          className={ic("fullName")}
          {...formik.getFieldProps("fullName")}
        />
      </FormField>

      <FormField label="Department" error={formik.touched.departmentId && formik.errors.departmentId}>
        <div className="relative">
          <select
            className={`${ic("departmentId")} appearance-none cursor-pointer`}
            {...formik.getFieldProps("departmentId")}
          >
            <option value="" disabled>Select Department</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </FormField>

      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}

export default function ProfessionalManagement() {
  const [activeTab,      setActiveTab]      = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [showCreate,     setShowCreate]     = useState(false);
  const [editProfessional,  setEditProfessional]  = useState(null);
  const [confirmAction,  setConfirmAction]  = useState(null);
  const [professionals,  setProfessionals]  = useState([]);
  const [departments,    setDepartments]    = useState([]);
  const [loading,        setLoading]        = useState(false);

 
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchProfessionals();
  }, [activeTab, page]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchProfessionals() {
    setLoading(true);
    try {
     
    } catch (err) {
      console.error("Failed to fetch professionals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
    
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }


  const filtered = professionals.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.departmentName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleAction(action, professional) {
    if (action === "Edit")      return setEditProfessional(professional);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   professional });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", professional });
  }

  async function applyConfirm() {
    const { type, professional } = confirmAction;
    try {
 
    } catch (err) {
      console.error(`Failed to ${type} professional:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Medical Professionals Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Medical professionals"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Professionals"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Full Name", "Department", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Cross}
        emptyText={activeTab === "Archived" ? "No archived professionals" : "No professionals found"}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        renderRow={(professional) => (
          <tr key={professional.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{professional.fullName}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{professional.departmentName ?? "—"}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archived" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, professional)}
              />
            </td>
          </tr>
        )}
      />

      
      {showCreate && (
        <Modal title="Add Professionals" onClose={() => setShowCreate(false)}>
          <ProfessionalForm
            submitLabel="Submit"
            departments={departments}
            onSubmit={async (values) => {
              try {
                
              } catch (err) {
                console.error("Failed to create professional:", err);
              }
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      
      {editProfessional && (
        <Modal title="Edit Professionals" onClose={() => setEditProfessional(null)}>
          <ProfessionalForm
            initialFullName={editProfessional.fullName}
            initialDepartmentId={
              departments.find((d) => d.departmentName === editProfessional.departmentName)?.departmentId?.toString() ?? ""
            }
            submitLabel="Edit"
            departments={departments}
            onSubmit={async (values) => {
              try {
                
              } catch (err) {
                console.error("Failed to update professional:", err);
              } finally {
                setEditProfessional(null);
              }
            }}
            onClose={() => setEditProfessional(null)}
          />
        </Modal>
      )}

    
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Professional?" : "Unarchive Professional?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.professional.fullName}" will be moved to the archive.`
              : `"${confirmAction.professional.fullName}" will be restored to active.`
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
