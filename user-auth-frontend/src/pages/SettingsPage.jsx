import { useState } from "react";
import { Settings, Bell, Shield, Database, Save } from "lucide-react";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [generalSettings, setGeneralSettings] = useState({
    pharmacyName: "DrugTui Pharmacy",
    address: "123 Healthcare Street, Medical District",
    phone: "+1 (555) 123-4567",
    email: "contact@drugtui.com",
    timezone: "UTC-5",
    language: "English",
    currency: "USD",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    expiryAlerts: true,
    orderUpdates: true,
    invoiceReminders: true,
    departmentRequests: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginAttempts: "3",
  });

  const [dataSettings, setDataSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    dataRetention: "365",
    exportFormat: "CSV",
  });

  const handleSaveGeneral = () => {
    console.log("Saving general settings:", generalSettings);
    alert("General settings saved successfully!");
  };

  const handleSaveNotifications = () => {
    console.log("Saving notification settings:", notificationSettings);
    alert("Notification settings saved successfully!");
  };

  const handleSaveSecurity = () => {
    console.log("Saving security settings:", securitySettings);
    alert("Security settings saved successfully!");
  };

  const handleSaveData = () => {
    console.log("Saving data settings:", dataSettings);
    alert("Data settings saved successfully!");
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data", icon: Database },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <Settings size={14} />
        <span>Settings</span>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-xs transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <IconComponent size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-4">
                  Pharmacy Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Pharmacy Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.pharmacyName}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          pharmacyName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={generalSettings.phone}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={generalSettings.address}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-4">
                  Regional Settings
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          timezone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC-5">UTC-5 (Eastern)</option>
                      <option value="UTC-6">UTC-6 (Central)</option>
                      <option value="UTC-7">UTC-7 (Mountain)</option>
                      <option value="UTC-8">UTC-8 (Pacific)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Language
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          language: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Currency
                    </label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          currency: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveGeneral}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-4">
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-900">
                      Enable Email Notifications
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-4">
                  Alert Preferences
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">
                        Low Stock Alerts
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Receive alerts when inventory is running low
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.lowStockAlerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          lowStockAlerts: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">Expiry Alerts</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Receive alerts for items nearing expiration
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.expiryAlerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          expiryAlerts: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">Order Updates</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Receive notifications for purchase order status changes
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderUpdates}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          orderUpdates: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">
                        Invoice Reminders
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Receive reminders for pending invoices
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.invoiceReminders}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          invoiceReminders: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">
                        Department Requests
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Receive notifications for new department requests
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.departmentRequests}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          departmentRequests: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveNotifications}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-4">Authentication</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">
                        Two-Factor Authentication
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorAuth: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-4">
                  Session Management
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Password Expiry (days)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordExpiry: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-4">Login Security</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Maximum Login Attempts
                    </label>
                    <input
                      type="number"
                      value={securitySettings.loginAttempts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          loginAttempts: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveSecurity}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Data Settings */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-4">Backup Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-900">
                        Automatic Backup
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Automatically backup your data on a schedule
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dataSettings.autoBackup}
                      onChange={(e) =>
                        setDataSettings({
                          ...dataSettings,
                          autoBackup: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Backup Frequency
                    </label>
                    <select
                      value={dataSettings.backupFrequency}
                      onChange={(e) =>
                        setDataSettings({
                          ...dataSettings,
                          backupFrequency: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!dataSettings.autoBackup}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-4">Data Retention</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Keep Data For (days)
                    </label>
                    <input
                      type="number"
                      value={dataSettings.dataRetention}
                      onChange={(e) =>
                        setDataSettings({
                          ...dataSettings,
                          dataRetention: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-4">Export Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Default Export Format
                    </label>
                    <select
                      value={dataSettings.exportFormat}
                      onChange={(e) =>
                        setDataSettings({
                          ...dataSettings,
                          exportFormat: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CSV">CSV</option>
                      <option value="Excel">Excel</option>
                      <option value="PDF">PDF</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
