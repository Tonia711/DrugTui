import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, PackageOpen, Plus, Search } from "lucide-react";
import {
  departmentRequestList,
  departmentRequestStatuses,
} from "../data/departmentRequests";

const requestsData = departmentRequestList;
const statuses = departmentRequestStatuses;
function DepartmentRequestPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusDropdownRef = useRef(null);

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
  }, []);

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
  }, [keyword, selectedStatus]);

  const getStatusClassName = (status) => {
    if (status === "Rejected" || status === "Accepted - Awaiting Restock") {
      return "bg-red-100 text-red-700";
    }
    if (
      status === "Pending Acceptance" ||
      status === "Accepted / Processing"
    ) {
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
        <button className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
          <Plus size={14} />
          <span className="text-xs">Add New Request</span>
        </button>
      </div>

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
          <h2 className="text-sm text-gray-900 mb-3">Department Request List</h2>

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
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Request ID</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Department</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Description</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Requested By</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Time</th>
                <th className="px-5 py-2.5 text-center text-xs text-gray-600 w-52">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!filteredData.length ? (
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
                    <td className="px-5 py-3 text-xs text-gray-900">{row.id}</td>
                    <td className="px-5 py-3 text-xs text-gray-900">{row.department}</td>
                    <td className="px-5 py-3 text-xs text-gray-900">{row.description}</td>
                    <td className="px-5 py-3 text-xs text-gray-900">{row.requestedBy}</td>
                    <td className="px-5 py-3 text-xs text-gray-900">{row.time}</td>
                    <td className="px-5 py-3 text-xs">
                      <span
                        className={`inline-flex w-40 min-h-7 items-center justify-center rounded-md px-3 py-1 text-xs whitespace-nowrap ${getStatusClassName(
                          row.status,
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DepartmentRequestPage;
