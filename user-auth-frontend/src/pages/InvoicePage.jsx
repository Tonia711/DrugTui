import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FileText, Search, Upload, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge";

const invoicesData = [
  {
    id: "INV-001",
    invoiceNumber: "INV-2025-001",
    supplier: "MediSupply Co.",
    date: "2025-01-15",
    amount: "12,450.00",
    status: "Pending",
    poNumber: "PO-2025-001",
  },
  {
    id: "INV-002",
    invoiceNumber: "INV-2025-002",
    supplier: "PharmaDirect Ltd.",
    date: "2025-01-18",
    amount: "8,320.50",
    status: "Completed",
    poNumber: "PO-2025-002",
  },
  {
    id: "INV-003",
    invoiceNumber: "INV-2025-003",
    supplier: "HealthCare Supplies",
    date: "2025-01-20",
    amount: "15,780.00",
    status: "Discrepancy",
    poNumber: "PO-2025-003",
  },
  {
    id: "INV-004",
    invoiceNumber: "INV-2025-004",
    supplier: "GlobalMed Supply",
    date: "2025-01-23",
    amount: "10,215.80",
    status: "Pending",
    poNumber: "PO-2025-004",
  },
  {
    id: "INV-005",
    invoiceNumber: "INV-2025-005",
    supplier: "PharmaCorp Ltd",
    date: "2025-01-25",
    amount: "9,890.00",
    status: "Completed",
    poNumber: "PO-2025-005",
  },
];

function InvoicePage() {
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
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

  const stats = useMemo(() => {
    const byStatus = (status) =>
      invoicesData.filter((invoice) => invoice.status === status).length;

    return [
      { label: "Total Invoices", value: invoicesData.length, status: null },
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
    ];
  }, []);

  const statusOptions = ["All Status", "Pending", "Discrepancy", "Completed"];

  const filteredInvoices = useMemo(() => {
    const baseData = selectedStatus
      ? invoicesData.filter((invoice) => invoice.status === selectedStatus)
      : invoicesData;

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return baseData;

    return baseData.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(normalizedKeyword) ||
        invoice.supplier.toLowerCase().includes(normalizedKeyword) ||
        invoice.poNumber.toLowerCase().includes(normalizedKeyword),
    );
  }, [keyword, selectedStatus]);

  const getStatusClassName = (status) => {
    if (status === "Pending") return "bg-amber-100 text-amber-700";
    if (status === "Discrepancy") return "bg-red-100 text-red-700";
    if (status === "Completed") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
                placeholder="Search by invoice number, supplier, or PO number..."
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
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1">
                  {statusOptions.map((status) => {
                    const isAll = status === "All Status";
                    const isActive =
                      (isAll && !selectedStatus) || selectedStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
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
              {!filteredInvoices.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-xs text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.supplier}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.poNumber}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      {invoice.date}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                      ${invoice.amount}
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <StatusBadge
                        label={invoice.status}
                        toneClass={getStatusClassName(invoice.status)}
                        widthClass="min-w-[140px]"
                        textClass="text-xs"
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
                Select an invoice file to upload. Supported formats: PDF, JPG, PNG
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
