import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  PackageOpen,
  User,
  Package,
  CheckCircle,
} from "lucide-react";
import useAxios from "../hooks/useAxios";
import { departmentRequestApi } from "../util/api";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDate(value)} ${formatTime(value)}`;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.title || fallback;
};

function DepartmentRequestDetailsPage() {
  const [comment, setComment] = useState("");
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { requestId } = useParams();
  const { data: currentUser } = useAxios({ method: "get", url: "/Users/me" });
  const normalizedRole =
    currentUser?.role === "User" ? "DepartmentMember" : currentUser?.role;
  const canReview = normalizedRole === "Admin" || normalizedRole === "WarehouseStaff";

  const loadRequest = async () => {
    if (!requestId) {
      setError("Missing request ID.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await departmentRequestApi.getByRequestNumber(requestId);
      setRequest(res.data || null);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load department request details."));
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const getStatusBadgeClassName = (status) => {
    if (status === "Rejected" || status === "Accepted - Awaiting Restock") {
      return "bg-red-50 text-red-700 border border-red-200";
    }
    if (status === "Pending Acceptance" || status === "Accepted / Processing") {
      return "bg-amber-50 text-amber-700 border border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border border-blue-200";
  };

  const statusTimeline = useMemo(() => {
    const status = request?.status;
    const isPending = status === "Pending Acceptance";
    const isAccepted = status === "Accepted / Processing";
    const isReady = status === "Ready for Delivery";
    const isDispatched = status === "Dispatched";
    const isCompleted = status === "Completed";

    const acceptedReached = isAccepted || isReady || isDispatched || isCompleted;
    const readyReached = isReady || isDispatched || isCompleted;
    const dispatchedReached = isDispatched || isCompleted;

    const getState = (reached, inProgress) => {
      if (reached) return "finished";
      if (inProgress) return "in-progress";
      return "waiting";
    };

    return [
      {
        id: 1,
        title: "Pending Acceptance",
        subtitle: request?.requestedByUsername || "-",
        time: formatDateTime(request?.requestedAt),
        state: "finished",
      },
      {
        id: 2,
        title: "Accepted / Processing",
        subtitle: acceptedReached ? "Reviewed" : null,
        time: acceptedReached ? "" : "",
        state: getState(acceptedReached, isPending),
      },
      {
        id: 3,
        title: "Ready for Delivery",
        subtitle: readyReached ? "Ready" : null,
        time: "",
        state: getState(readyReached, isAccepted),
      },
      {
        id: 4,
        title: "Dispatched",
        subtitle: dispatchedReached ? "Dispatched" : null,
        time: "",
        state: getState(dispatchedReached, isReady),
      },
      {
        id: 5,
        title: "Completed",
        subtitle: isCompleted ? "Completed" : null,
        time: "",
        state: getState(isCompleted, isDispatched),
      },
    ];
  }, [request]);

  const getProgressPercentage = () => {
    const finishedStepCount = statusTimeline.filter(
      (step) => step.state === "finished",
    ).length;
    return Math.max(0, ((finishedStepCount - 1) / 4) * 100);
  };

  const requestItems = useMemo(() => {
    if (!Array.isArray(request?.items)) return [];
    return request.items.map((item) => {
      const fallbackName = item.description?.split(" - ")?.[0] || item.description || "-";
      return {
        id: item.id,
        name: item.medicationName || fallbackName,
        specification: "-",
        requestedQty: item.quantityRequested,
        approvedQty: item.quantityApproved,
        availableStock: "-",
        batchNumber: "-",
        expiryDate: "-",
      };
    });
  }, [request]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!request?.requestNumber || !canReview || isUpdating) return;

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      await departmentRequestApi.updateStatus(request.requestNumber, {
        status: nextStatus,
        notes: comment.trim() || null,
      });
      setMessage(`Request status updated to ${nextStatus}.`);
      await loadRequest();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update request status."));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          onClick={() => navigate("/department-request")}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <PackageOpen size={14} />
        <span>Department Request / Request Details</span>
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

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Loading request details...
        </div>
      ) : !request ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Request not found.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="relative">
              <div
                className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"
                style={{ left: "20px", right: "20px" }}
              >
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${getProgressPercentage()}%`,
                  }}
                />
              </div>

              <div className="relative flex justify-between">
                {statusTimeline.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex flex-col items-center"
                    style={{ minWidth: "120px" }}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 transition-all
                        ${
                          step.state === "finished"
                            ? "bg-blue-500 text-white"
                            : "bg-white border-2 border-gray-300 text-gray-400"
                        }
                      `}
                    >
                      {step.state === "finished" ? (
                        <Check size={20} />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>

                    <p
                      className={`mb-1 text-center text-xs ${
                        step.state === "waiting" ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </p>

                    {step.subtitle && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">{step.subtitle}</p>
                        {step.time && <p className="text-xs text-gray-500">{step.time}</p>}
                      </div>
                    )}

                    {step.state === "waiting" && !step.subtitle && (
                      <p className="text-xs text-gray-400">Waiting</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-gray-900 mb-2">{request.requestNumber}</h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded text-xs ${getStatusBadgeClassName(
                      request.status,
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
              {canReview && (
                <div className="flex gap-2">
                  {request.status === "Pending Acceptance" && (
                    <>
                      <button
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                        onClick={() => handleUpdateStatus("Rejected")}
                        disabled={isUpdating}
                      >
                        Reject Request
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                        onClick={() => handleUpdateStatus("Accepted / Processing")}
                        disabled={isUpdating}
                      >
                        Accept Request
                      </button>
                    </>
                  )}
                  {request.status === "Accepted / Processing" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => handleUpdateStatus("Ready for Delivery")}
                      disabled={isUpdating}
                    >
                      Mark Ready for Delivery
                    </button>
                  )}
                  {request.status === "Ready for Delivery" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => handleUpdateStatus("Dispatched")}
                      disabled={isUpdating}
                    >
                      Dispatch
                    </button>
                  )}
                  {request.status === "Dispatched" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => handleUpdateStatus("Completed")}
                      disabled={isUpdating}
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Building2 size={12} />
                  Department
                </div>
                <div className="text-xs text-gray-900">{request.departmentName || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <User size={12} />
                  Requested By
                </div>
                <div className="text-xs text-gray-900">{request.requestedByUsername || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Request Date
                </div>
                <div className="text-xs text-gray-900">{formatDate(request.requestedAt)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  Request Time
                </div>
                <div className="text-xs text-gray-900">{formatTime(request.requestedAt)}</div>
              </div>
            </div>

            {request.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-700">
                <span className="text-gray-500">Notes: </span>
                {request.notes}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm text-gray-900">Request Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Medicine Name
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Specification
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Requested Qty
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Available Stock
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Approved Qty
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Batch Number
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Expiry Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!requestItems.length ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-xs text-gray-500">
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    requestItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.name}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.specification}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.requestedQty}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.availableStock}
                        </td>
                        <td className="px-5 py-3 text-xs text-green-600 align-middle">
                          {item.approvedQty}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.batchNumber}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.expiryDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {request.status !== "Completed" && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm text-gray-900 mb-4">
                {request.status === "Pending Acceptance"
                  ? "Add Comment (Optional)"
                  : "Notes"}
              </h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  request.status === "Pending Acceptance"
                    ? "Enter acceptance or rejection comments..."
                    : "Add any notes..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DepartmentRequestDetailsPage;
