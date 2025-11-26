import React, { useState } from "react";
import { Settings, User, Bell, Lock, Trash2, Moon, Globe, Download, Shield } from "lucide-react";

function LumeoSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    darkMode: false,
    language: "English",
    autoSave: true,
    deleteAfterRestore: 30,
  });

  const [deletedChats] = useState([
    { id: 1, name: "Project Discussion", deletedDate: "2025-11-20", messages: 45 },
    { id: 2, name: "Team Meeting Notes", deletedDate: "2025-11-18", messages: 23 },
    { id: 3, name: "Client Feedback", deletedDate: "2025-11-15", messages: 67 },
  ]);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Lock },
    { id: "restore", label: "Chat Restoration", icon: Trash2 },
  ];

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRestore = (chatId) => {
    alert(`Chat "${deletedChats.find((c) => c.id === chatId).name}" has been restored!`);
  };

  const handlePermanentDelete = (chatId) => {
    if (
      window.confirm("Are you sure you want to permanently delete this chat? This action cannot be undone.")
    ) {
      alert(`Chat permanently deleted.`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <h4 className="text-xl font-bold text-gray-800">Lumeo</h4>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.id ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-500 mb-8">Manage your Lumeo preferences and account settings</p>

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-800">Dark Mode</p>
                        <p className="text-sm text-gray-500">Enable dark theme</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("darkMode")}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.darkMode ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          settings.darkMode ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-800">Language</p>
                        <p className="text-sm text-gray-500">Choose your preferred language</p>
                      </div>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat Settings</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="text-gray-600" size={20} />
                    <div>
                      <p className="font-medium text-gray-800">Auto-save Chats</p>
                      <p className="text-sm text-gray-500">Automatically save your conversations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle("autoSave")}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.autoSave ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        settings.autoSave ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === "account" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications for new messages</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications")}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        settings.notifications ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Sound Effects</p>
                    <p className="text-sm text-gray-500">Play sound for incoming messages</p>
                  </div>
                  <button
                    onClick={() => handleToggle("soundEnabled")}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.soundEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        settings.soundEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Security */}
          {activeTab === "privacy" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy & Security</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                  <Shield className="text-blue-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="ml-auto px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    Enable
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Restoration */}
          {activeTab === "restore" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="text-blue-600" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Chat Restoration</h2>
                    <p className="text-sm text-gray-500">Recover deleted chats within 30 days</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-delete after (days)
                  </label>
                  <select
                    value={settings.deleteAfterRestore}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, deleteAfterRestore: parseInt(e.target.value) }))
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Deleted Chats ({deletedChats.length})
                </h3>
                {deletedChats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trash2 size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No deleted chats to restore</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletedChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{chat.name}</p>
                          <p className="text-sm text-gray-500">
                            {chat.messages} messages • Deleted on {chat.deletedDate}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestore(chat.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(chat.id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default LumeoSettings;
