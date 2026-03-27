import { Thermometer, Droplets, Map, Edit2, Trash2 } from "lucide-react";

function ZoneCard({ zone, onEdit, onDelete, onViewMap, showActions = true }) {
  const capacityPercentage = (zone.currentCapacity / zone.capacity) * 100;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm text-gray-900 mb-1">{zone.name}</h3>
          <p className="text-xs text-gray-500">{zone.shelves.length} shelves</p>
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewMap?.(zone)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View Map"
            >
              <Map size={14} />
            </button>
            <button
              onClick={() => onEdit?.(zone)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit Zone"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete?.(zone.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Zone"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Capacity</span>
          <span className="text-xs text-gray-900">
            {zone.currentCapacity}/{zone.capacity} ({capacityPercentage.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full transition-all bg-gray-900"
            style={{ width: `${capacityPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded">
            <Thermometer size={12} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Temperature</p>
            <p className="text-xs text-gray-900">{zone.currentTemperature}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded">
            <Droplets size={12} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Humidity</p>
            <p className="text-xs text-gray-900">{zone.currentHumidity}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZoneCard;
