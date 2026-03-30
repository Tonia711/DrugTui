import { X } from "lucide-react";

function MapViewModal({ zone, onClose }) {
  const shelvesPerRow = Math.min(5, zone.shelves.length);
  const rows = Math.ceil(zone.shelves.length / shelvesPerRow);

  const capacityPercentage = (zone.currentCapacity / zone.capacity) * 100;

  const getCapacityColor = () => {
    if (capacityPercentage >= 90) {
      return "bg-red-500 text-white";
    } else if (capacityPercentage >= 80) {
      return "bg-yellow-500 text-white";
    } else {
      return "bg-blue-500 text-white";
    }
  };

  const getCapacityCardColor = () => {
    if (capacityPercentage >= 90) {
      return "bg-red-50 border-red-200";
    } else if (capacityPercentage >= 80) {
      return "bg-yellow-50 border-yellow-200";
    } else {
      return "bg-gray-50 border-gray-200";
    }
  };

  const getCapacityTextColor = () => {
    if (capacityPercentage >= 90) {
      return "text-red-900";
    } else if (capacityPercentage >= 80) {
      return "text-yellow-900";
    } else {
      return "text-gray-900";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {zone.name} - Floor Plan
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {zone.shelves.length} storage shelves • {zone.currentTemperature}
              °C • {zone.currentHumidity}% humidity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-6 bg-white rounded-lg p-3 border border-gray-200 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-gray-700">Storage Shelf</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-700">Aisle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 rounded border border-green-300"></div>
              <span className="text-gray-700">Entrance/Exit</span>
            </div>
          </div>

          {/* Floor Plan Container */}
          <div className="bg-white rounded-lg border border-gray-300 p-6 relative">
            <div className="absolute top-2 left-2 bg-gray-900 text-white px-3 py-1 rounded text-xs">
              {zone.name}
            </div>

            <div
              className={`absolute top-2 right-2 px-3 py-1 rounded text-xs ${getCapacityColor()}`}
            >
              Capacity: {capacityPercentage.toFixed(0)}%
            </div>

            {zone.shelves.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xs">No shelves defined for this zone</p>
              </div>
            ) : (
              <div className="relative">
                <div className="mb-4 flex justify-center">
                  <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-1.5 text-center">
                    <div className="text-xs text-green-700">▼ ENTRANCE ▼</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {Array.from({ length: rows }).map((_, rowIndex) => {
                    const rowShelves = zone.shelves.slice(
                      rowIndex * shelvesPerRow,
                      (rowIndex + 1) * shelvesPerRow,
                    );

                    return (
                      <div key={rowIndex} className="relative">
                        <div
                          className="grid gap-4"
                          style={{
                            gridTemplateColumns: `repeat(${rowShelves.length}, 1fr)`,
                          }}
                        >
                          {rowShelves.map((shelf, shelfIndex) => {
                            const rowLetter = String.fromCharCode(
                              65 + rowIndex,
                            );
                            const shelfLabel = `${rowLetter}-${shelfIndex + 1}`;

                            return (
                              <div
                                key={shelf}
                                className="flex flex-col items-center"
                              >
                                <div className="relative group cursor-pointer">
                                  <div className="bg-blue-600 border border-blue-700 rounded-md hover:bg-blue-700 transition-all w-16 h-14 relative flex items-center justify-center">
                                    <div className="text-white text-xs">
                                      {shelfLabel}
                                    </div>
                                  </div>

                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div>Shelf {shelfLabel}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {rowIndex < rows - 1 && (
                          <div className="mt-2 h-5 bg-gray-200 border border-dashed border-gray-300 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              ← Aisle {rowIndex + 1} →
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-center">
                  <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-1.5 text-center">
                    <div className="text-xs text-green-700">▲ EXIT ▲</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zone Info Card */}
          <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-3">
              Zone Environmental Conditions
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  Temperature
                </p>
                <p className="text-sm font-semibold text-blue-900">
                  {zone.currentTemperature}°C
                </p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-2.5 border border-cyan-100">
                <p className="text-xs text-cyan-700 font-medium mb-1">
                  Humidity
                </p>
                <p className="text-sm font-semibold text-cyan-900">
                  {zone.currentHumidity}%
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                <p className="text-xs text-green-700 font-medium mb-1">
                  Total Shelves
                </p>
                <p className="text-sm font-semibold text-green-900">
                  {zone.shelves.length}
                </p>
              </div>
              <div
                className={`rounded-lg p-2.5 border ${getCapacityCardColor()}`}
              >
                <p className="text-xs text-gray-700 font-medium mb-1">
                  Capacity Used
                </p>
                <p
                  className={`text-sm font-semibold ${getCapacityTextColor()}`}
                >
                  {capacityPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapViewModal;
