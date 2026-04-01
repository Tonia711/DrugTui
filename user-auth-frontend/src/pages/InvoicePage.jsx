import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FileText, Search, Upload, X } from "lucide-react";
import { invoiceApi } from "../util/api";
import StatusBadge from "../components/StatusBadge";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDisplayStatus = (status) =>
  status === "Verified" ? "Completed" : status;

const getStatusClassName = (status) => {
  const displayStatus = getDisplayStatus(status);
  switch (displayStatus) {
    case "Completed":
      return "bg-blue-100 text-blue-700";
    case "Voided":
      return "bg-gray-100 text-gray-700";
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Discrepancy":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

function InvoicePage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await invoiceApi.getAll();
        setInvoices(res.data || []);
      } catch (err) {
        const message =
          typeof err?.response?.data === "string"
            ? err.response.data
            : "Failed to load invoices.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const stats = useMemo(() => {
    const byStatus = (status) => {
      if (status === "Completed") {
        return invoices.filter(
          (invoice) =>
            invoice.status === "Completed" || invoice.status === "Verified",
        ).length;
      }

      return invoices.filter((invoice) => invoice.status === status).length;
    };

    return [
      { label: "Total Invoices", value: invoices.length, status: null },
      { label: "Pending", value: byStatus("Pending"), status: "Pending" },
      {
        label: "Discrepancy",
        value: byStatus("Discrepancy"),
        status: "Discrepancy",
        highlight: true,
      },
      {
        label: "Completed",
        value: byStatus("Completed"),
        status: "Completed",
      },
      {
        label: "Voided",
        value: byStatus("Voided"),
        status: "Voided",
      },
    ];
  }, [invoices]);

  const statusOptions = [
    "All Status",
    "Pending",
    "Discrepancy",
    "Completed",
    "Voided",
  ];

  const filteredInvoices = useMemo(() => {
    const baseData = selectedStatus
      ? invoices.filter((invoice) => {
          if (selectedStatus === "Completed") {
            return (
              invoice.status === "Completed" || invoice.status === "Verified"
            );
          }

          return invoice.status === selectedStatus;
        })
      : invoices;

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return baseData;

    return baseData.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(normalizedKeyword) ||
        (invoice.supplierName || "").toLowerCase().includes(normalizedKeyword) ||
        (invoice.purchaseOrderNumber || "")
          .toLowerCase()
          .includes(normalizedKeyword),
    );
  }, [invoices, keyword, selectedStatus]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setShowUploadModal(false);
    setSelectedFile(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FileText size={14} />
          <span>Invoice Management</span>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={14} />
          <span className="text-xs">Upload Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setSelectedStatus(null)}
          className={`bg-white border rounded-lg p-4 text-left transition-all ${
            selectedStatus === null
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">Total Invoices</p>
              <p className="text-blue-600 mt-1">{stats[0].value}</p>
            </div>
            <FileText size={20} className="text-blue-600" />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus("Pending")}
          className={`bg-white border rounded-lg p-4 text-left transition-all ${
            selectedStatus === "Pending"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">Pending</p>
              <p className="text-yellow-600 mt-1">{stats[1].value}</p>
            </div>
            <FileText size={20} className="text-yellow-600" />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus("Discrepancy")}
          className={`bg-white border rounded-lg p-4 text-left transition-all ${
            selectedStatus === "Discrepancy"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-red-300 bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">Discrepancy</p>
              <p className="text-red-600 mt-1">{stats[2].value}</p>
            </div>
            <FileText size={20} className="text-red-600" />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus("Completed")}
          className={`bg-white border rounded-lg p-4 text-left transition-all ${
            selectedStatus === "Completed"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">Completed</p>
              <p className="text-green-600 mt-1">{stats[3].value}</p>
            </div>
            <FileText size={20} className="text-green-600" />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus("Voided")}
          className={`bg-white border rounded-lg p-4 text-left transition-all ${
            selectedStatus === "Voided"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">Voided</p>
              <p className="text-gray-600 mt-1">{stats[4].value}</p>
            </div>
            <FileText size={20} className="text-gray-600" />
          </div>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm text-gray-900 mb-3">Invoice List</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by Invoice No., Supplier, or PO Number..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>

            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setShowStatusDropdown((prev) => !prev)}
              >
                {selectedStatus || "All Status"}
                <ChevronDown size={12} />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {statusOptions.map((status) => {
                    const isAll = status === "All Status";
                    const isActive =
                      (isAll && !selectedStatus) || selectedStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        } ${
                          status === statusOptions[0]
                            ? "rounded-t-lg"
                            : status === statusOptions[statusOptions.length - 1]
                              ? "rounded-b-lg"
                              : ""
                        }`}
                        onClick={() => {
                          setSelectedStatus(isAll ? null : status);
                          setShowStatusDropdown(false);
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                  Invoice No.
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                  Supplier
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                  PO Number
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                  Date
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                  Amount
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-xs text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-xs text-red-700">
                    {error}
                  </td>
                </tr>
              ) : !filteredInvoices.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-xs text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() =>
                      navigate(`/procurement/invoice/${invoice.id}`, {
                        state: { invoice },
                      })
                    }
                  >
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.supplierName}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.purchaseOrderNumber}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      ${Number(invoice.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <StatusBadge
                        label={getDisplayStatus(invoice.status)}
                        toneClass={getStatusClassName(invoice.status)}
                        widthClass="min-w-[140px]"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm text-gray-900">Upload Invoice</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Select an invoice file to upload. Supported formats: PDF, JPG,
                PNG
              </p>

              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="invoice-file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="invoice-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-xs text-gray-700">
                    {selectedFile ? selectedFile.name : "Click to select file"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    PDF, JPG, PNG up to 10MB
                  </span>
                </label>
              </div>

              {/* Upload Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className={`flex-1 px-4 py-2 text-xs rounded-lg transition-colors ${
                    selectedFile
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Upload & Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicePage;
