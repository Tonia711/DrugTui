import { useState, useMemo } from "react";
import { AlertCircle, Plus, Package } from "lucide-react";
import { storageZoneData } from "../data/storageZoneData";
import ZoneCard from "../components/ZoneCard";
import AddZoneModal from "../components/AddZoneModal";
import EditZoneModal from "../components/EditZoneModal";
import MapViewModal from "../components/MapViewModal";

function StorageZonePage() {
  const [zones, setZones] = useState(storageZoneData);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [viewingZone, setViewingZone] = useState(null);

  const filteredZones = useMemo(() => {
    return zones.filter((zone) =>
      zone.name.toLowerCase().includes(searchKeyword.toLowerCase()),
    );
  }, [zones, searchKeyword]);

  // Generate alerts based on zone conditions
  const alerts = useMemo(() => {
    const generatedAlerts = [];

    zones.forEach((zone) => {
      const capacityPercentage = (zone.currentCapacity / zone.capacity) * 100;

      // Temperature outside range alert
      if (
        zone.currentTemperature < zone.temperatureMin ||
        zone.currentTemperature > zone.temperatureMax
      ) {
        generatedAlerts.push({
          id: `temp-${zone.id}`,
          type: "temperature",
          severity: "error",
          zone: zone.name,
          message: `${zone.name} temperature outside optimal range (${zone.currentTemperature}°C, expected ${zone.temperatureMin}-${zone.temperatureMax}°C)`,
        });
      }

      // High capacity alert
      if (capacityPercentage >= 90) {
        generatedAlerts.push({
          id: `capacity-${zone.id}`,
          type: "capacity",
          severity: "warning",
          zone: zone.name,
          message: `${zone.name} capacity is critically high (${capacityPercentage.toFixed(0)}%)`,
        });
      }
    });

    return generatedAlerts;
  }, [zones]);

  const handleAddZone = (newZone) => {
    const zoneWithId = {
      id: String(zones.length + 1),
      ...newZone,
      status: "normal",
      statusColor: "bg-green-100",
    };
    setZones([...zones, zoneWithId]);
    setShowAddModal(false);
  };

  const handleEditZone = (zone) => {
    setEditingZone(zone);
    setShowEditModal(true);
  };

  const handleSaveEditZone = (updatedZone) => {
    setZones(zones.map((z) => (z.id === updatedZone.id ? updatedZone : z)));
    setShowEditModal(false);
    setEditingZone(null);
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter((zone) => zone.id !== id));
  };

  const handleViewMap = (zone) => {
    setViewingZone(zone);
    setShowMapModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Package size={14} />
          <span>Storage Zone</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} />
          <span className="text-xs">Add Zone</span>
        </button>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.severity === "error"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-rose-50 border-rose-200"
              }`}
            >
              <AlertCircle
                className={`flex-shrink-0 ${
                  alert.severity === "error"
                    ? "text-yellow-500"
                    : "text-rose-500"
                }`}
                size={16}
              />
              <p className="text-xs text-gray-900">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredZones.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            onEdit={() => handleEditZone(zone)}
            onDelete={() => handleDeleteZone(zone.id)}
            onViewMap={() => handleViewMap(zone)}
            showActions={true}
          />
        ))}
      </div>

      {filteredZones.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            {searchKeyword
              ? "No zones found matching your search"
              : "No storage zones yet"}
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddZoneModal
          onSave={handleAddZone}
          onClose={() => setShowAddModal(false)}
          existingZonesCount={zones.length}
        />
      )}

      {showEditModal && editingZone && (
        <EditZoneModal
          zone={editingZone}
          onSave={handleSaveEditZone}
          onClose={() => {
            setShowEditModal(false);
            setEditingZone(null);
          }}
        />
      )}

      {showMapModal && viewingZone && (
        <MapViewModal
          zone={viewingZone}
          onClose={() => {
            setShowMapModal(false);
            setViewingZone(null);
          }}
        />
      )}
    </div>
  );
}

export default StorageZonePage;
