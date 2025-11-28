import React, { useState, useEffect } from "react";
import { Settings, User, Bell, Lock, Trash2, Moon, Globe, Download, Shield } from "lucide-react";
import { GetValidAccessToken, GetAllUsers } from "./index";
import ChatLogo from "../assets/chat-hub-logo-2.png";

function LumeoSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [deletedChatNames, setDeletedChatNames] = useState([]);
  const [chatModal, setChatModal] = useState({});
  const [deletedChats, setDeletedChats] = useState([]);
  const [restoredButton, setRestoredButton] = useState({});
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    darkMode: false,
    language: "English",
    autoSave: true,
    deleteAfterRestore: 30,
  });

  console.log("Deleted Chats Names:", deletedChatNames);

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

  useEffect(() => {
    const GetDeletedChatName = async () => {
      const token = await GetValidAccessToken();
      if (!token) return;
      try {
        const req = await fetch("http://127.0.0.1:8000/v1/settings/deletedchats", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const res = await req.json();
        setDeletedChatNames(res.map((chat) => ({ chat_id: chat.chat_id, chat_name: chat.chat_name })));
        console.log(res);
      } catch (e) {
        console.error("Error fetching deleted chats:", e);
      }
    };
    GetDeletedChatName();
  }, []);

  const getMessage = async (chatId) => {
    const token = await GetValidAccessToken();
    if (!token) return;
    try {
      const req = await fetch(`http://127.0.0.1:8000/v1/settings/deletedmessages/${chatId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await req.json();
      setDeletedChats(res);
      console.log(res);
    } catch (e) {
      console.error("Error fetching deleted messages:", e);
    }
  };

  const setChatModals = (chatId) => {
    setChatModal({ open: true, chatId: chatId });
    getMessage(chatId);
  };

  const handlePermanentDelete = (chatId) => {
    if (
      window.confirm("Are you sure you want to permanently delete this chat? This action cannot be undone.")
    ) {
      alert(`Chat permanently deleted.`);
    }
  };

  const RestoreMessage = async (messageId) => {
    const token = await GetValidAccessToken();
    if (!token) return;
    try {
      const req = await fetch(`http://127.0.0.1:8000/v1/settings/restoremessage/${messageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!req.ok) {
        throw new Error("Failed to restore message");
      }

      alert("Message restored successfully");
      setRestoredButton((prev) => ({ ...prev, [messageId]: true }));
      // Optionally, refresh the deleted messages list
      setTimeout(() => {
        getMessage(chatModal.chatId);
      }, 3000);
    } catch (e) {
      console.error("Error restoring message:", e);
    }
  };

  return (
    <div className="flex h-screen bg-[#0c1119eb]">
      {/* Sidebar */}
      <aside className="w-64  bg-[#14171c] border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src={ChatLogo} alt="Lumeo Logo" />
            </div>
            <h4 className="text-xl font-bold text-white">Lumeo</h4>
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
                  activeTab === tab.id
                    ? "bg-[#ffffff17] text-blue-600"
                    : "text-gray-200 hover:bg-[#ffffff17] "
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
        <button
          className="absolute right-10 top-10 border px-4 rounded-md text-white bg-gray-500 py-1"
          onClick={() => window.history.back()}
        >
          Back
        </button>
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-200 mb-2">Settings</h1>
          <p className="text-gray-400 mb-8">Manage your Lumeo preferences and account settings</p>

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-200">Dark Mode</p>
                        <p className="text-sm text-gray-400">Enable dark theme</p>
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
                        <p className="font-medium text-gray-200">Language</p>
                        <p className="text-sm text-gray-400">Choose your preferred language</p>
                      </div>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
                      className="px-4 py-2 border text-gray-200 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Chat Settings</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="text-gray-600" size={20} />
                    <div>
                      <p className="font-medium text-gray-200">Auto-save Chats</p>
                      <p className="text-sm text-gray-400">Automatically save your conversations</p>
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
            <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-200"
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
            <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-200">Push Notifications</p>
                    <p className="text-sm text-gray-400">Receive notifications for new messages</p>
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
                    <p className="font-medium text-gray-200">Sound Effects</p>
                    <p className="text-sm text-gray-400">Play sound for incoming messages</p>
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
            <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Privacy & Security</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg">
                  <Shield className="text-blue-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-200">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">Add an extra layer of security</p>
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
                    className="w-full px-4 py-2 border text-gray-200 border-gray-700 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-2 border text-gray-200 border-gray-700 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="text-blue-600" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-200">Chat Restoration</h2>
                    <p className="text-sm text-gray-400">Recover deleted chats within 30 days</p>
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
                    className="px-4 py-2 border border-gray-300 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#14171c] rounded-xl p-6 shadow-sm border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Deleted Chats ({deletedChatNames.length})
                </h3>
                {deletedChatNames.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trash2 size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No deleted chats to restore</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletedChatNames.map((chatName, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-700 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-200">{chatName.chat_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setChatModals(chatName.chat_id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* deleted chat  */}
          {chatModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 shadow-lg w-3/4 max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Deleted Chat Messages</h2>
                  <button
                    onClick={() => {
                      setChatModal({}), setDeletedChats([]);
                    }}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {deletedChats.map((msg) => (
                    <div key={msg.id} className="p-4 border border-gray-200 rounded-lg bg-red-50">
                      {msg.file_url ? (
                        <div className="mb-3">
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {msg.file_name}
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-800 mt-3 mb-4">{msg.content}</p>
                      )}

                      <div className="flex gap-4">
                        {restoredButton[msg.id] ? (
                          <span className="text-green-600 font-medium">Message Restored</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handlePermanentDelete(chatModal.chatId)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Permanently Delete
                            </button>
                            <button
                              onClick={() => RestoreMessage(msg.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Restore Chat
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Add more deleted messages as needed */}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default LumeoSettings;
