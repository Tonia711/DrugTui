import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit2, Package, Save } from "lucide-react";
import { inventoryData } from "../data/inventoryData";

const inferUnitOfMeasure = (drugName) => {
  const value = (drugName || "").toLowerCase();
  if (value.includes("mcg")) return "mcg";
  if (value.includes("mg")) return "mg";
  if (value.includes("ml")) return "ml";
  if (value.includes("iu")) return "IU";
  return "mg";
};

const inferDosageForm = (quantity) => {
  const value = (quantity || "").toLowerCase();
  if (value.includes("tablet")) return "Tablet";
  if (value.includes("capsule")) return "Capsule";
  if (value.includes("syrup")) return "Syrup";
  if (value.includes("vial") || value.includes("ampoule")) return "Injection";
  if (value.includes("cream")) return "Cream";
  return "Tablet";
};

function ItemDetailsPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    genericName: "",
    brandName: "",
    batchNumber: "",
    barcode: "",
    medsafeNo: "",
    dosageForm: "Tablet",
    unit: "box",
    quantity: "",
    expiryDate: "",
    storageCondition: "Ambient",
    hazard: "No special handling",
    location: "Main Shelf",
    supplier: "",
    notes: "",
    reorderLevel: 0,
  });

  const item = useMemo(
    () => inventoryData.find((entry) => String(entry.id) === String(itemId)),
    [itemId],
  );

  const isLoading = false;
  const error = null;
  const isSaving = false;

  useEffect(() => {
    if (!item) return;

    setForm({
      genericName: item.genericName || "",
      brandName: item.drugName || "",
      batchNumber: item.batchNumber || "",
      barcode: "",
      medsafeNo: "",
      dosageForm: inferDosageForm(item.quantity),
      unit: inferUnitOfMeasure(item.drugName),
      quantity: item.quantity || "",
      expiryDate: item.expiryDate || "",
      storageCondition: item.storage || "Ambient",
      hazard: "No special handling",
      location: item.location || "",
      supplier: "",
      notes: "",
      reorderLevel: 0,
    });
  }, [item]);

  const status = item?.status || "In Stock";
  const statusClassName = item?.statusColor || "bg-gray-100 text-gray-700";

  const handleSave = async () => {
    setMessage("");
    setErrorMessage("");

    try {
      setIsEditing(false);
      setMessage("Changes saved successfully.");
    } catch (err) {
      setErrorMessage(err.response?.data || "Failed to update item.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-xs text-gray-500">Loading...</div>;
  }

  if (error || !item) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <button
            onClick={() => navigate("/inventory")}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mr-2"
          >
            <ArrowLeft size={16} />
          </button>
          <Package size={14} />
          <span>Inventory / Item Details</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-700">
          Item not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          onClick={() => navigate("/inventory")}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mr-2"
        >
          <ArrowLeft size={16} />
        </button>
        <Package size={14} />
        <span>Inventory / {isEditing ? "Edit Item" : "Item Details"}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-sm text-gray-900 font-bold mb-4">Identity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Generic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.genericName}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, genericName: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">Brand Name</label>
              <input
                type="text"
                value={form.brandName}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, brandName: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={`MED-${form.batchNumber}`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">Barcode (GS1)</label>
              <input
                type="text"
                value={form.barcode}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, barcode: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
                placeholder="e.g., 01234567890123"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-700 mb-2">Medsafe Approval Number</label>
              <input
                type="text"
                value={form.medsafeNo}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, medsafeNo: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
                placeholder="e.g., MEDSAFE-123456"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm text-gray-900 font-bold mb-4">Formulation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Dosage Form <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  disabled={!isEditing}
                  value={form.dosageForm}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dosageForm: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none pr-8 ${
                    isEditing ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                  <option>Cream</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  disabled={!isEditing}
                  value={form.unit}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none pr-8 ${
                    isEditing ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <option>mg</option>
                  <option>g</option>
                  <option>ml</option>
                  <option>IU</option>
                  <option>mcg</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.quantity}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Batch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.batchNumber}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, batchNumber: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-700 mb-2">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.expiryDate}
                disabled={!isEditing}
                placeholder="dd/mm/yyyy"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm text-gray-900 font-bold mb-4">Storage</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Storage Condition <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  disabled={!isEditing}
                  value={form.storageCondition}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, storageCondition: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none pr-8 ${
                    isEditing ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <option>Ambient</option>
                  <option>Cold Storage</option>
                  <option>Controlled</option>
                  <option>Refrigerated</option>
                  <option>Frozen</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-2">Hazard or Special Handling</label>
              <div className="relative">
                <select
                  disabled={!isEditing}
                  value={form.hazard}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hazard: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none pr-8 ${
                    isEditing ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <option>No special handling</option>
                  <option>Flammable</option>
                  <option>Toxic</option>
                  <option>Controlled Substance</option>
                  <option>Light Sensitive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.location}
                disabled={!isEditing}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                  isEditing ? "bg-gray-50" : "bg-white"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm text-gray-900 font-bold mb-4">Procurement</h3>
          <div>
            <label className="block text-xs text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.supplier}
              disabled={!isEditing}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, supplier: e.target.value }))
              }
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                isEditing ? "bg-gray-50" : "bg-white"
              }`}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm text-gray-900 font-bold mb-4">Status</h3>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded text-xs ${statusClassName}`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}

      {message && (
        <p className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={isSaving}
            >
              <Save size={14} />
              <span className="text-xs">{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={14} />
            <span className="text-xs">Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ItemDetailsPage;
