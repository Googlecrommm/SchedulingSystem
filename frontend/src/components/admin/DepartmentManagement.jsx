import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Building2, Archive, Pencil, RefreshCw } from "lucide-react";
import axios from "../../config/axiosInstance";

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
  { label: "All",     icon: Building2 },
  { label: "Archive", icon: Archive   },
];

const activeActions  = [{ label: "Edit", icon: Pencil }, { label: "Archive", icon: Archive, danger: true }];
const archiveActions = [{ label: "Unarchive", icon: RefreshCw }];

const deptSchema = Yup.object({
  name: Yup.string().required("Department name is required"),
});

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function DeptForm({ initialName = "", submitLabel = "Submit", onSubmit, onClose }) {
  const formik = useFormik({
    initialValues: { name: initialName },
    validationSchema: deptSchema,
    onSubmit: (values, { setSubmitting }) => {
      onSubmit(values);
      setSubmitting(false);
      onClose();
    },
  });
  const ic = useInputClass(formik);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <FormField label="Department Name" error={formik.touched.name && formik.errors.name}>
        <input
          type="text"
          className={ic("name")}
          {...formik.getFieldProps("name")}
        />
      </FormField>
      <ModalFooter onClear={() => formik.resetForm()} submitLabel={submitLabel} submitting={formik.isSubmitting} />
    </form>
  );
}


function mapDept(d) {
  return {
    id:       d.departmentId,
    name:     d.departmentName,
    archived: d.departmentStatus === "Archived",
  };
}

export default function DepartmentManagement() {
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editDept,      setEditDept]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [departments,   setDepartments]   = useState([]);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const res = await axios.get("/api/getDepartments", {
        headers: getAuthHeader(),
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setDepartments(data.map(mapDept));
    } catch (err) {
      
      if (err.response?.status === 200 || err.response?.data?.message) {
        setDepartments([]);
      } else {
        console.error("Failed to fetch departments:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  const filtered = departments
    .filter((d) => (activeTab === "Archive" ? d.archived : !d.archived))
    .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  function handleAction(action, dept) {
    if (action === "Edit")      return setEditDept(dept);
    if (action === "Archive")   return setConfirmAction({ type: "archive",   dept });
    if (action === "Unarchive") return setConfirmAction({ type: "unarchive", dept });
  }

  async function applyConfirm() {
    const { type, dept } = confirmAction;
    try {
      const endpoint =
        type === "archive"
          ? `/api/archiveDepartment/${dept.id}`
          : `/api/restoreDepartment/${dept.id}`;

      
      await axios.put(endpoint, null, {
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });

      await fetchDepartments();
    } catch (err) {
      console.error(`Failed to ${type} department:`, err);
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <AdminLayout
      pageTitle="Department Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Department"
    >
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        addLabel="Add Department"
        onAdd={() => setShowCreate(true)}
      />

      <DataTable
        columns={["Department Name", "Action"]}
        rows={filtered}
        loading={loading}
        emptyIcon={Building2}
        emptyText={activeTab === "Archive" ? "No archived departments" : "No departments found"}
        renderRow={(dept) => (
          <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{dept.name}</td>
            <td className="px-6 py-4 text-center">
              <ActionDropdown
                items={activeTab === "Archive" ? archiveActions : activeActions}
                onAction={(action) => handleAction(action, dept)}
              />
            </td>
          </tr>
        )}
      />

      
      {showCreate && (
        <Modal title="Add Department" onClose={() => setShowCreate(false)}>
          <DeptForm
            submitLabel="Submit"
            onSubmit={async (values) => {
              try {
                await axios.post(
                  "/api/createDepartment",
                  { departmentName: values.name },
                  { headers: getAuthHeader() }
                );
                await fetchDepartments();
              } catch (err) {
                console.error("Failed to create department:", err);
              }
            }}
            onClose={() => setShowCreate(false)}
          />
        </Modal>
      )}

      
      {editDept && (
        <Modal title="Edit Department" onClose={() => setEditDept(null)}>
          <DeptForm
            initialName={editDept.name}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              try {
                await axios.put(
                  `/api/updateDepartment/${editDept.id}`,
                  {
                    departmentName:   values.name,
                    departmentStatus: editDept.archived ? "Archived" : "Active",
                  },
                  { headers: getAuthHeader() }
                );
                await fetchDepartments();
              } catch (err) {
                console.error("Failed to update department:", err);
              } finally {
                setEditDept(null);
              }
            }}
            onClose={() => setEditDept(null)}
          />
        </Modal>
      )}

   
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive Department?" : "Unarchive Department?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.dept.name}" will be moved to the archive.`
              : `"${confirmAction.dept.name}" will be restored to active.`
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