import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Layers, Archive, Pencil, RefreshCw, ChevronDown } from "lucide-react";

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
  { label: "All",     icon: Layers  },
  { label: "Archive", icon: Archive },
];

const PAGE_SIZE = 10;

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const modalitySchema = Yup.object({
  name:         Yup.string().required("Modality name is required"),
  departmentId: Yup.string().required("Department is required"),
});

function ModalityForm({ initialName = "", initialDepartmentId = "", submitLabel = "Submit", onSubmit, onClose, departments }) {
  const formik = useFormik({
    initialValues: { name: initialName, departmentId: initialDepartmentId },
    validationSchema: modalitySchema,
    onSubmit: (values, { setSubmitting }) => {
      onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Modality" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          placeholder=""
          className={ic("name")}
          {...formik.getFieldProps("name")}
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

export default function ModalityManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editModality,  setEditModality]  = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalities,    setModalities]    = useState([]);
  const [departments,   setDepartments]   = useState([]);
  const [loading,       setLoading]       = useState(false);

 
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

 
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchModalities();
  }, [activeTab, page]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchModalities() {
    setLoading(true);
    try {
    
    } catch (err) {
      console.error("Failed to fetch modalities:", err);
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

 
  const filtered = modalities.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.departmentName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleAction(action, modality) {
    if (action === "Edit")      return setEditModality(modality);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   modality });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", modality });
  }

  async function applyConfirm() {
    const { type, modality } = confirmAction;
    try {
      
    } catch (err) {
      console.error(`Failed to ${type} modality:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Modality Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Unit"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Modality"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Modality", "Department", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Layers}
        emptyText={activeTab === "Archive" ? "No archived modalities" : "No modalities found"}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(p - 1, 1))}
        onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        renderRow={(modality) => (
          <tr key={modality.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{modality.name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-600">{modality.departmentName ?? "—"}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archive" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, modality)}
              />
            </td>
          </tr>
        )}
      />

    
      {showCreate && (
        <Modal title="Add Modality" onClose={() => setShowCreate(false)}>
          <ModalityForm
            submitLabel="Submit"
            departments={departments}
            onSubmit={async (values) => {
              try {
                
              } catch (err) {
                console.error("Failed to create modality:", err);
              }
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

     
      {editModality && (
        <Modal title="Edit Modality" onClose={() => setEditModality(null)}>
          <ModalityForm
            initialName={editModality.name}
            initialDepartmentId={
              departments.find((d) => d.departmentName === editModality.departmentName)?.departmentId?.toString() ?? ""
            }
            submitLabel="Edit"
            departments={departments}
            onSubmit={async (values) => {
              try {
               
              } catch (err) {
                console.error("Failed to update modality:", err);
              } finally {
                setEditModality(null);
              }
            }}
            onClose={() => setEditModality(null)}
          />
        </Modal>
      )}

   
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Modality?" : "Unarchive Modality?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.modality.name}" will be moved to the archive.`
              : `"${confirmAction.modality.name}" will be restored to active.`
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
