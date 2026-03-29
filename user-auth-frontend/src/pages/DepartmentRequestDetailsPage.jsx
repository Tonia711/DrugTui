import { useMemo, useState } from "react";
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
import {
  departmentRequestById,
  departmentRequestDetails,
} from "../data/departmentRequests";

function DepartmentRequestDetailsPage() {
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const { requestId } = useParams();

  const request = useMemo(() => {
    if (!requestId) {
      return departmentRequestDetails[0];
    }

    if (departmentRequestById[requestId]) {
      return departmentRequestById[requestId];
    }

    if (requestId.startsWith("REQ-2025-")) {
      const normalizedId = requestId.replace("REQ-2025-", "REQ-");
      if (departmentRequestById[normalizedId]) {
        return departmentRequestById[normalizedId];
      }
    }

    return departmentRequestDetails[0];
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

  const getStepState = (stepIndex) => {
    if (stepIndex === 0) return "finished";

    if (stepIndex === 1) {
      if (request.acceptedBy) return "finished";
      if (request.status === "Pending Acceptance") return "in-progress";
      return "waiting";
    }

    if (stepIndex === 2) {
      if (request.readyBy) return "finished";
      if (request.status === "Ready for Delivery") return "in-progress";
      return "waiting";
    }

    if (stepIndex === 3) {
      if (request.dispatchedBy) return "finished";
      if (request.status === "Dispatched") return "in-progress";
      return "waiting";
    }

    if (request.completedBy) return "finished";
    if (request.status === "Completed") return "in-progress";
    return "waiting";
  };

  const getProgressPercentage = () => {
    const states = [0, 1, 2, 3, 4].map(getStepState);
    const finishedStepCount = states.filter((state) => state === "finished").length;
    return Math.max(0, ((finishedStepCount - 1) / 4) * 100);
  };

  const timelineSteps = [
    {
      id: 1,
      title: "Pending Acceptance",
      subtitle: request.requestedBy,
      time: `${request.requestedDate} ${request.requestedTime}`,
      state: getStepState(0),
    },
    {
      id: 2,
      title: "Accepted / Processing",
      subtitle:
        request.acceptedBy || (getStepState(1) === "in-progress" ? "In Progress" : null),
      time: request.acceptedTime || "",
      state: getStepState(1),
    },
    {
      id: 3,
      title: "Ready for Delivery",
      subtitle: request.readyBy || (getStepState(2) === "in-progress" ? "Ready" : null),
      time: request.readyTime || "",
      state: getStepState(2),
    },
    {
      id: 4,
      title: "Dispatched",
      subtitle:
        request.dispatchedBy ||
        (getStepState(3) === "in-progress" ? "Dispatched" : null),
      time: request.dispatchedBy && request.dispatchedTime ? `${request.dispatchedDate} ${request.dispatchedTime}` : "",
      state: getStepState(3),
    },
    {
      id: 5,
      title: "Completed",
      subtitle:
        request.completedBy ||
        (getStepState(4) === "in-progress" ? "Completed" : null),
      time: request.completedBy && request.completedTime ? `${request.completedDate} ${request.completedTime}` : "",
      state: getStepState(4),
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
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

      {/* Progress Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" style={{ left: '20px', right: '20px' }}>
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ 
                width: `${getProgressPercentage()}%` 
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {timelineSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center" style={{ minWidth: '120px' }}>
                {/* Circle */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 transition-all
                  ${step.state === 'finished'
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border-2 border-gray-300 text-gray-400'}
                `}>
                  {step.state === 'finished' ? (
                    <Check size={20} />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <p className={`mb-1 text-center text-xs ${
                  step.state === 'waiting' ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {step.title}
                </p>

                {/* Person and Time */}
                {step.subtitle && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600">{step.subtitle}</p>
                    {step.time && (
                      <p className="text-xs text-gray-500">{step.time}</p>
                    )}
                  </div>
                )}

                {step.state === 'waiting' && !step.subtitle && (
                  <p className="text-xs text-gray-400">Waiting</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-gray-900 mb-2">{request.id}</h1>
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
          <div className="flex gap-2">
            {request.status === 'Pending Acceptance' && (
              <>
                <button 
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors"
                >
                  Reject Request
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                >
                  Accept Request
                </button>
              </>
            )}
            {request.status === 'Accepted / Processing' && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                Mark Ready for Delivery
              </button>
            )}
            {request.status === 'Ready for Delivery' && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                Dispatch
              </button>
            )}
            {request.status === 'Dispatched' && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>

        {/* Request Info Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Building2 size={12} />
              Department
            </div>
            <div className="text-xs text-gray-900">{request.department}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <User size={12} />
              Requested By
            </div>
            <div className="text-xs text-gray-900">{request.requestedBy}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar size={12} />
              Request Date
            </div>
            <div className="text-xs text-gray-900">{request.requestedDate}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Clock size={12} />
              Request Time
            </div>
            <div className="text-xs text-gray-900">{request.requestedTime}</div>
          </div>
        </div>

        {/* Dispatch Info - Only show dispatch and completion info */}
        {request.dispatchedBy && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Package size={12} />
                  Dispatched By
                </div>
                <div className="text-xs text-gray-900">{request.dispatchedBy}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Dispatch Time
                </div>
                <div className="text-xs text-gray-900">{`${request.dispatchedDate} ${request.dispatchedTime}`}</div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Info */}
        {request.completedBy && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Completed By
                </div>
                <div className="text-xs text-gray-900">{request.completedBy}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Completion Time
                </div>
                <div className="text-xs text-gray-900">{`${request.completedDate} ${request.completedTime}`}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm text-gray-900">Request Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Medicine Name</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Specification</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Requested Qty</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Available Stock</th>
                {request.medicines[0]?.approvedQty !== undefined && (
                  <th className="px-5 py-2.5 text-left text-xs text-gray-600">Approved Qty</th>
                )}
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Batch Number</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-600">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {request.medicines.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 text-xs text-gray-900 align-middle">{item.name}</td>
                  <td className="px-5 py-3 text-xs text-gray-900 align-middle">{item.specification}</td>
                  <td className="px-5 py-3 text-xs text-gray-900 align-middle">{item.requestedQty}</td>
                  <td className="px-5 py-3 text-xs align-middle">
                    <span className={item.availableStock < item.requestedQty ? 'text-red-600' : 'text-gray-900'}>
                      {item.availableStock}
                    </span>
                  </td>
                  {item.approvedQty !== undefined && (
                    <td className="px-5 py-3 text-xs text-green-600 align-middle">{item.approvedQty}</td>
                  )}
                  <td className="px-5 py-3 text-xs text-gray-900 align-middle">{item.batchNumber}</td>
                  <td className="px-5 py-3 text-xs text-gray-900 align-middle">{item.expiryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Section - show for pending or active statuses */}
      {request.status !== 'Completed' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm text-gray-900 mb-4">
            {request.status === 'Pending Acceptance' ? 'Add Comment (Optional)' : 'Notes'}
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={request.status === 'Pending Acceptance' ? 'Enter acceptance or rejection comments...' : 'Add any notes...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
        </div>
      )}
    </div>
  );
}

export default DepartmentRequestDetailsPage;
