import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export default function Dashboard() {
  const [enabled, setEnabled] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRequests, setTotalRequests] = useState(0);

  // Function to load data from storage
  const loadData = async () => {
    try {
      setIsLoading(true);
      const { enabled: on = false, requestLogs = [], totalRequests = 0 } = await browser.storage.local.get(["enabled", "requestLogs", "totalRequests"]);
      setEnabled(on);
      setLogs(Array.isArray(requestLogs) ? requestLogs : []);
      setTotalRequests(totalRequests);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats on mount and set up storage listener
  useEffect(() => {
    // Initial load
    loadData();
    
    // Setup real-time listener for storage changes
    const storageChangeListener = (changes, areaName) => {
      if (areaName !== "local") return;
      
      // Update enabled state if it changed
      if (changes.enabled) {
        setEnabled(changes.enabled.newValue);
      }
      
      // Update logs if requestLogs changed
      if (changes.requestLogs) {
        const newLogs = Array.isArray(changes.requestLogs.newValue) 
          ? changes.requestLogs.newValue 
          : [];
        setLogs(newLogs);
      }

      // Update totalRequests if it changed
      if (changes.totalRequests) {
        setTotalRequests(changes.totalRequests.newValue || 0);
      }
    };
    
    // Add the listener
    browser.storage.onChanged.addListener(storageChangeListener);
    
    // Clean up the listener when component unmounts
    return () => {
      browser.storage.onChanged.removeListener(storageChangeListener);
    };
  }, []);

  // Toggle enable/disable
  const toggleIDS = async () => {
    try {
      const newOn = !enabled;
      await browser.storage.local.set({ enabled: newOn });
      // No need to call setEnabled here as the storage listener will handle it
    } catch (error) {
      console.error("Error toggling IDS:", error);
      // Fall back to manual state update if storage update fails
      setEnabled(!enabled);
    }
  };

  const total = logs.length;
  const safe = logs.filter(l => l.safe).length;
  const unsafe = total - safe;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-blue-700">IDS Dashboard</h1>
            {isLoading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg">
              Status: <span className={`font-semibold ${enabled ? 'text-green-600' : 'text-red-500'}`}>
                {enabled ? "ACTIVE" : "INACTIVE"}
              </span>
            </p>
            <button 
              onClick={toggleIDS}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                enabled 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              disabled={isLoading}
            >
              {enabled ? "Disable IDS" : "Enable IDS"}
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-sm uppercase text-gray-500 font-medium">Total Requests</p>
            <p className="text-2xl font-bold">{totalRequests}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm uppercase text-gray-500 font-medium">Analyzed</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm uppercase text-gray-500 font-medium">Safe</p>
            <p className="text-2xl font-bold text-green-600">{safe}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
            <p className="text-sm uppercase text-gray-500 font-medium">Unsafe</p>
            <p className="text-2xl font-bold text-red-500">{unsafe}</p>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            <div className="flex items-center">
              {logs.length > 0 && (
                <span className="text-xs text-gray-500 mr-3">
                  Showing latest {Math.min(logs.length, 20)} of {logs.length} entries
                </span>
              )}
              <button 
                onClick={loadData}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                disabled={isLoading}
              >
                <svg className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.slice(-20).reverse().map((log, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.time).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={log.url}>
                      {log.url.length > 40 ? `${log.url.slice(0, 40)}…` : log.url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.safe 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.safe ? "✓ Safe" : "✕ Unsafe"}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No activity logged yet
                    </td>
                  </tr>
                )}
                {isLoading && logs.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
                        <span className="text-sm text-gray-600">Loading activity logs...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}