import { useState } from "react";
import { X } from "lucide-react";

function EditZoneModal({ zone, onSave, onClose }) {
  const [editedZone, setEditedZone] = useState(zone);

  const handleSave = () => {
    onSave(editedZone);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Edit Zone</h2>
            <p className="text-xs text-gray-600 mt-1">
              Update zone configuration and settings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Zone Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Zone Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedZone.name}
              onChange={(e) =>
                setEditedZone({ ...editedZone, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Capacity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Capacity Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-700 mb-2">
                  Total Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editedZone.capacity}
                  onChange={(e) =>
                    setEditedZone({
                      ...editedZone,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-2">
                  Current Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editedZone.currentCapacity}
                  onChange={(e) =>
                    setEditedZone({
                      ...editedZone,
                      currentCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Temperature & Humidity Ranges */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Environmental Conditions
            </h3>
            <div className="space-y-4">
              {/* Temperature Range */}
              <div>
                <label className="block text-xs text-gray-700 mb-2">
                  Temperature Range (°C) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={editedZone.temperatureMin}
                      onChange={(e) =>
                        setEditedZone({
                          ...editedZone,
                          temperatureMin: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Minimum</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={editedZone.temperatureMax}
                      onChange={(e) =>
                        setEditedZone({
                          ...editedZone,
                          temperatureMax: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Maximum</p>
                  </div>
                </div>
              </div>

              {/* Humidity Range */}
              <div>
                <label className="block text-xs text-gray-700 mb-2">
                  Humidity Range (%) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={editedZone.humidityMin}
                      onChange={(e) =>
                        setEditedZone({
                          ...editedZone,
                          humidityMin: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Minimum</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={editedZone.humidityMax}
                      onChange={(e) =>
                        setEditedZone({
                          ...editedZone,
                          humidityMax: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Maximum</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditZoneModal;
