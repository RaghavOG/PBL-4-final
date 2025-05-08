import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export default function Dashboard() {
  const [enabled, setEnabled] = useState(false);
  const [logs, setLogs]       = useState([]);

  // Load stats on mount
  useEffect(() => {
    (async () => {
      const { enabled: on, requestLogs } = await browser.storage.local.get(["enabled","requestLogs"]);
      setEnabled(on);
      setLogs(requestLogs || []);
    })();
  }, []);

  // Toggle enable/disable
  const toggleIDS = async () => {
    const newOn = !enabled;
    await browser.storage.local.set({ enabled: newOn });
    setEnabled(newOn);
  };

  const total    = logs.length;
  const safe     = logs.filter(l => l.safe).length;
  const unsafe   = total - safe;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">IDS Dashboard</h1>
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
            >
              {enabled ? "Disable IDS" : "Enable IDS"}
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm uppercase text-gray-500 font-medium">Total Requests</p>
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
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
                      {log.url.slice(0,40)}…
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
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No activity logged yet
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
