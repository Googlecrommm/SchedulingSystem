import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Tag, Archive, Pencil, RefreshCw } from "lucide-react";
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
  { label: "All",     icon: Tag     },
  { label: "Archive", icon: Archive },
];

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const caseTypeSchema = Yup.object({
  typeName: Yup.string().required("Description is required"),
});

const PAGE_SIZE = 10;

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function CaseTypeForm({ initialTypeName = "", submitLabel = "Submit", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { typeName: initialTypeName },
    validationSchema: caseTypeSchema,
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
      <FormField label="Description" error={formik.touched.typeName && formik.errors.typeName}>
        <input
          type="text"
          placeholder="Description"
          className={ic("typeName")}
          {...formik.getFieldProps("typeName")}
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


function mapCaseType(c) {
  return {
    id:       c.typeId,
    typeName: c.typeName,
    archived: c.typeStatus === "Archived",
  };
}

export default function HospitalizationCaseTypeManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editCaseType,  setEditCaseType]  = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [caseTypes,     setCaseTypes]     = useState([]);
  const [loading,       setLoading]       = useState(false);

  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchCaseTypes();
  }, [activeTab, searchQuery, page]);

  async function fetchCaseTypes() {
    setLoading(true);
    try {
      const statusParam = activeTab === "Archive" ? "Archived" : "Active";

     
      const url = searchQuery.trim()
        ? `/api/searchTypes/${encodeURIComponent(searchQuery.trim())}`
        : `/api/getTypes`;

      const params = {
        page,
        size: PAGE_SIZE,
        sort: "typeName,asc",
        ...(searchQuery.trim() ? {} : { typeStatus: statusParam }),
      };

      const res = await axios.get(url, {
        headers: getAuthHeader(),
        params,
      });

      const pageData = res.data;
      const content  = Array.isArray(pageData) ? pageData : pageData?.content ?? [];

      setCaseTypes(content.map(mapCaseType));
      setTotalPages(pageData?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch hospitalization case types:", err);
      setCaseTypes([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  const filtered = searchQuery.trim()
    ? caseTypes.filter((c) => (activeTab === "Archive" ? c.archived : !c.archived))
    : caseTypes;

  function handleAction(action, caseType) {
    if (action === "Edit")      return setEditCaseType(caseType);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   caseType });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", caseType });
  }

  async function applyConfirm() {
    const { type, caseType } = confirmAction;
    try {
      
      const endpoint =
        type === "archive"
          ? `/api/archiveType/${caseType.id}`
          : `/api/restoreType/${caseType.id}`;

      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });

      toast(
        type === "archive"
          ? `"${caseType.typeName}" has been archived.`
          : `"${caseType.typeName}" has been restored.`,
        type === "archive" ? "warning" : "success"
      );
      await fetchCaseTypes();
    } catch (err) {
      console.error(`Failed to ${type} hospitalization case type:`, err);
      toast(`Failed to ${type} case type.`, "error");
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Hospitalization Case Type Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Hospitalization case"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Case Type"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Description", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Tag}
        emptyText={activeTab === "Archive" ? "No archived case types" : "No hospitalization case types found"}
        page={page + 1}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        renderRow={(caseType) => (
          <tr key={caseType.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{caseType.typeName}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archive" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, caseType)}
              />
            </td>
          </tr>
        )}
      />

      {showCreate && (
        <Modal title="Add Hospitalization Case" onClose={() => setShowCreate(false)}>
          <CaseTypeForm
            submitLabel="Submit"
            onSubmit={async (values) => {
            
              await axios.post(
                "/api/createType",
                { typeName: values.typeName },
                { headers: getAuthHeader() }
              );
              toast(`Case type "${values.typeName}" has been created.`);
              await fetchCaseTypes();
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editCaseType && (
        <Modal title="Edit Hospitalization Case" onClose={() => setEditCaseType(null)}>
          <CaseTypeForm
            initialTypeName={editCaseType.typeName}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
            
              await axios.put(
                `/api/updateType/${editCaseType.id}`,
                { typeName: values.typeName },
                { headers: getAuthHeader() }
              );
              toast(`Case type "${values.typeName}" has been updated.`);
              await fetchCaseTypes();
            }}
            onClose={() => setEditCaseType(null)}
          />
        </Modal>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Case Type?" : "Unarchive Case Type?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.caseType.typeName}" will be moved to the archive.`
              : `"${confirmAction.caseType.typeName}" will be restored to active.`
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