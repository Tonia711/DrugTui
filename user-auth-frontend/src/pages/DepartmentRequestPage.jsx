import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, PackageOpen, Plus, Search, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { departmentApi, departmentRequestApi } from "../util/api";

const initialCreateForm = {
  requestNumber: "",
  status: "Pending Acceptance",
  departmentId: "",
  requestedAt: "",
  notes: "",
  itemDescription: "",
  quantityRequested: 1,
  quantityApproved: 0,
};

const defaultStatuses = [
  "Pending Acceptance",
  "Rejected",
  "Accepted / Processing",
  "Accepted - Awaiting Restock",
  "Ready for Delivery",
  "Dispatched",
  "Completed",
];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.title || fallback;
};

function DepartmentRequestPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const statusDropdownRef = useRef(null);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await departmentRequestApi.getAll();
      setRequests(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load department requests."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await departmentApi.getAll();
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  useEffect(() => {
    loadRequests();
    loadDepartments();
  }, []);

  const requestsData = useMemo(
    () =>
      requests.map((item) => ({
        id: item.requestNumber,
        department: item.departmentName,
        description: `${item.itemCount} item(s), requested ${item.quantityRequestedTotal}`,
        requestedBy: item.requestedByUsername || "-",
        time: formatDateTime(item.requestedAt),
        status: item.status,
      })),
    [requests],
  );

  const statuses = useMemo(() => {
    const fromData = Array.from(
      new Set(requestsData.map((item) => item.status)),
    );
    return fromData.length ? fromData : defaultStatuses;
  }, [requestsData]);

  const stats = useMemo(() => {
    const countByStatus = (status) =>
      requestsData.filter((item) => item.status === status).length;

    return [
      { label: "Total Requests", status: null, value: requestsData.length },
      {
        label: "Pending Acceptance",
        status: "Pending Acceptance",
        value: countByStatus("Pending Acceptance"),
      },
      {
        label: "Rejected",
        status: "Rejected",
        value: countByStatus("Rejected"),
        isHighlighted: true,
      },
      {
        label: "Accepted / Processing",
        status: "Accepted / Processing",
        value: countByStatus("Accepted / Processing"),
      },
      {
        label: "Accepted - Awaiting Restock",
        status: "Accepted - Awaiting Restock",
        value: countByStatus("Accepted - Awaiting Restock"),
        isHighlighted: true,
      },
      {
        label: "Ready for Delivery",
        status: "Ready for Delivery",
        value: countByStatus("Ready for Delivery"),
      },
      {
        label: "Dispatched",
        status: "Dispatched",
        value: countByStatus("Dispatched"),
      },
      {
        label: "Completed",
        status: "Completed",
        value: countByStatus("Completed"),
      },
    ];
  }, [requestsData]);

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return requestsData.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.id.toLowerCase().includes(normalizedKeyword) ||
        item.department.toLowerCase().includes(normalizedKeyword) ||
        item.requestedBy.toLowerCase().includes(normalizedKeyword);

      const matchesStatus = !selectedStatus || item.status === selectedStatus;

      return matchesKeyword && matchesStatus;
    });
  }, [keyword, selectedStatus, requestsData]);

  const handleCreateRequest = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!createForm.departmentId) {
      setError("Please select a department.");
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentRequestApi.create({
        requestNumber: createForm.requestNumber.trim(),
        status: createForm.status,
        departmentId: Number(createForm.departmentId),
        requestedAt: createForm.requestedAt
          ? new Date(createForm.requestedAt).toISOString()
          : null,
        notes: createForm.notes.trim() || null,
        items: [
          {
            medicationId: null,
            description: createForm.itemDescription.trim(),
            quantityRequested: Number(createForm.quantityRequested),
            quantityApproved: Number(createForm.quantityApproved),
          },
        ],
      });

      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      setMessage("Department request created successfully.");
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create department request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClassName = (status) => {
    if (status === "Rejected" || status === "Accepted - Awaiting Restock") {
      return "bg-red-100 text-red-700";
    }
    if (status === "Pending Acceptance" || status === "Accepted / Processing") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <PackageOpen size={14} />
          <span>Department Request</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={14} />
          <span className="text-xs">Add New Request</span>
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const isActive =
            (stat.status === null && selectedStatus === null) ||
            stat.status === selectedStatus;

          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => setSelectedStatus(stat.status)}
              className={`bg-white border rounded-lg p-4 text-left transition-all ${
                isActive
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : stat.isHighlighted
                    ? "border-red-300 bg-red-50 hover:border-red-400"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-[10px] text-gray-600 mb-1">{stat.label}</div>
              <div className="text-sm text-gray-900">{stat.value}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm text-gray-900 mb-3">
            Department Request List
          </h2>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by Request ID, Department, or Requester..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
              >
                {selectedStatus || "All Status"}
                <ChevronDown size={12} />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1">
                  <button
                    type="button"
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                      !selectedStatus
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedStatus(null);
                      setShowStatusDropdown(false);
                    }}
                  >
                    All Status
                  </button>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                        selectedStatus === status
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Request ID
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Department
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Description
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Requested By
                </th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                  Time
                </th>
                <th className="px-5 py-2.5 text-center text-xs text-gray-600 w-52">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-xs text-gray-500">
                    Loading department requests...
                  </td>
                </tr>
              ) : !filteredData.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-xs text-gray-500">
                    No requests found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/department-request/${row.id}`)}
                  >
                    <td className="px-5 py-3 text-xs text-gray-900">
                      {row.id}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900">
                      {row.department}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900">
                      {row.description}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900">
                      {row.requestedBy}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900">
                      {row.time}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <StatusBadge
                        label={row.status}
                        toneClass={getStatusClassName(row.status)}
                        widthClass="w-40"
                        paddingClass="px-3 py-1"
                        className="min-h-7 rounded-md"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateRequest}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm text-gray-900">
                Add New Department Request
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Request Number"
                value={createForm.requestNumber}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    requestNumber: e.target.value,
                  }))
                }
                required
              />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                {defaultStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                value={createForm.departmentId}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    departmentId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                value={createForm.requestedAt}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    requestedAt: e.target.value,
                  }))
                }
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Item Description"
                value={createForm.itemDescription}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    itemDescription: e.target.value,
                  }))
                }
                required
              />
              <input
                type="number"
                min="1"
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Quantity Requested"
                value={createForm.quantityRequested}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    quantityRequested: e.target.value,
                  }))
                }
                required
              />
              <input
                type="number"
                min="0"
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Quantity Approved"
                value={createForm.quantityApproved}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    quantityApproved: e.target.value,
                  }))
                }
              />
              <textarea
                rows={3}
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-xs"
                placeholder="Notes"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default DepartmentRequestPage;
