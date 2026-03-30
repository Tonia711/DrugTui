import { useState } from "react";
import { X } from "lucide-react";

function AddZoneModal({ onSave, onClose, existingZonesCount }) {
  const [newZone, setNewZone] = useState({
    name: `Zone ${String.fromCharCode(65 + existingZonesCount)}`,
    capacity: 100,
    currentCapacity: 0,
    temperatureMin: 18,
    temperatureMax: 24,
    humidityMin: 40,
    humidityMax: 50,
    currentTemperature: 20,
    currentHumidity: 45,
    shelves: [`${String.fromCharCode(65 + existingZonesCount)}-1`],
  });

  const handleSave = () => {
    if (!newZone.name.trim()) {
      alert("Please enter a zone name");
      return;
    }
    if (newZone.capacity <= 0) {
      alert("Capacity must be greater than 0");
      return;
    }
    if (
      newZone.currentCapacity < 0 ||
      newZone.currentCapacity > newZone.capacity
    ) {
      alert("Current capacity must be between 0 and total capacity");
      return;
    }
    if (newZone.temperatureMin >= newZone.temperatureMax) {
      alert("Temperature minimum must be less than maximum");
      return;
    }
    if (newZone.humidityMin >= newZone.humidityMax) {
      alert("Humidity minimum must be less than maximum");
      return;
    }

    onSave(newZone);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Add New Zone
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Configure new storage zone settings
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
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Ambient, Cold, Frozen"
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
                  value={newZone.capacity}
                  onChange={(e) =>
                    setNewZone({
                      ...newZone,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-2">
                  Current Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newZone.currentCapacity}
                  onChange={(e) =>
                    setNewZone({
                      ...newZone,
                      currentCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
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
                      value={newZone.temperatureMin}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
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
                      value={newZone.temperatureMax}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
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
                      value={newZone.humidityMin}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
                          humidityMin: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Minimum</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={newZone.humidityMax}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
                          humidityMax: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Maximum</p>
                  </div>
                </div>
              </div>

              {/* Current Environmental Conditions */}
              <div>
                <label className="block text-xs text-gray-700 mb-2">
                  Current Conditions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={newZone.currentTemperature}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
                          currentTemperature: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1">
                      Humidity (%)
                    </label>
                    <input
                      type="number"
                      value={newZone.currentHumidity}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
                          currentHumidity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shelves */}
          <div>
            <label className="block text-xs text-gray-700 mb-2">
              Initial Shelf Code
            </label>
            <input
              type="text"
              value={newZone.shelves[0]}
              onChange={(e) =>
                setNewZone({ ...newZone, shelves: [e.target.value] })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., A-1"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              You can add more shelves later
            </p>
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
            Save Zone
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddZoneModal;
