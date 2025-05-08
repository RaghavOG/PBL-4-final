// src/pages/Popup.jsx
// React popup component using the WebExtension browser API with real-time updates

import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export default function Popup() {
  const [enabled, setEnabled] = useState(false);
  const [stats, setStats] = useState({ total: 0, unsafe: 0 });
  const [error, setError] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState("");

  // Function to load stats from storage
  const loadStats = async () => {
    try {
      const { requestLogs = [] } = await browser.storage.local.get("requestLogs");
      const logs = Array.isArray(requestLogs) ? requestLogs : [];
      const unsafeCount = logs.filter((l) => l.safe === false).length;
      setStats({ total: logs.length, unsafe: unsafeCount });
    } catch (e) {
      console.error("Error loading stats", e);
      setError("Failed to load statistics");
    }
  };

  // Load initial state & stats from storage
  useEffect(() => {
    (async () => {
      try {
        const { enabled: on = false } = await browser.storage.local.get("enabled");
        setEnabled(on);
        await loadStats();
      } catch (e) {
        console.error("Storage API error", e);
        setError("Chrome APIs not available. Are you in an extension?");
      }
    })();
    
    // Setup real-time listener for storage changes
    const storageChangeListener = (changes, areaName) => {
      if (areaName !== "local") return;
      
      // Update enabled state if it changed
      if (changes.enabled) {
        setEnabled(changes.enabled.newValue);
      }
      
      // Update stats if requestLogs changed
      if (changes.requestLogs) {
        loadStats();
      }
    };
    
    // Add the listener
    browser.storage.onChanged.addListener(storageChangeListener);
    
    // Clean up the listener when component unmounts
    return () => {
      browser.storage.onChanged.removeListener(storageChangeListener);
    };
  }, []);

  // Toggle on/off
  const toggle = async () => {
    try {
      const newOn = !enabled;
      await browser.runtime.sendMessage({ cmd: "toggle", on: newOn });
      setEnabled(newOn);
    } catch (e) {
      console.error("Runtime API error", e);
      setError("Chrome APIs not available. Are you in an extension?");
    }
  };

  // Trigger test notification
  const triggerTestNotification = async () => {
    try {
      setNotificationStatus("Sending...");
      const response = await browser.runtime.sendMessage({ cmd: "test-notification" });
      console.log("Test notification response", response);
      if (response?.ok) {
        setNotificationStatus("Test notification sent!");
        setTimeout(() => setNotificationStatus(""), 3000);
      }
    } catch (e) {
      console.error("Runtime API error", e);
      setNotificationStatus("Error sending notification");
      setTimeout(() => setNotificationStatus(""), 3000);
    }
  };
  

  if (error) {
    return (
      <div className="p-6 bg-red-50 min-w-[340px] rounded-lg border border-red-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-100 rounded-full">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-red-700">Error Detected</h1>
        </div>
        <p className="text-sm text-red-600 ml-10">{error}</p>
      </div>
    );
  }

  const safePercentage = stats.total > 0 
    ? Math.round(((stats.total - stats.unsafe) / stats.total) * 100) 
    : 100;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 min-w-[340px] min-h-[240px] font-sans">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Inline-IDS</h1>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enabled} onChange={toggle} />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className={`bg-white rounded-lg shadow-sm p-4 border border-slate-200 transition-all duration-300 ${enabled ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-slate-400'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
            <p className="text-sm text-slate-700">
              Protection: <span className={`font-semibold ${enabled ? 'text-green-600' : 'text-slate-500'}`}>
                {enabled ? "ACTIVE" : "INACTIVE"}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs uppercase text-slate-500 font-medium">Protection Status</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${safePercentage > 90 ? 'bg-green-100 text-green-800' : safePercentage > 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {safePercentage}% Safe
            </span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4">
            <div 
              className={`h-1.5 rounded-full ${safePercentage > 90 ? 'bg-green-500' : safePercentage > 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
              style={{ width: `${safePercentage}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs uppercase text-slate-500 font-medium mb-1">Total Requests</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 border-l-2 border-l-red-500">
              <p className="text-xs uppercase text-slate-500 font-medium mb-1">Blocked</p>
              <p className="text-xl font-bold text-red-600">{stats.unsafe}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Section */}
      <div className="mt-5 flex justify-center">
        <button 
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          onClick={async (e) => {
            e.preventDefault();
            await browser.runtime.openOptionsPage();
          }}
        >
          <span>View detailed reports</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </button>
      </div>

      {/* Test Notification Section */}
      <div className="mt-5 flex justify-center">
        <button 
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          onClick={triggerTestNotification}
        >
          <span>Send Test Notification</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </button>
        {notificationStatus && (
          <p className="text-sm text-slate-700 ml-4">{notificationStatus}</p>
        )}
      </div>
    </div>
  );
}