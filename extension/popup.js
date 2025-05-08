// DOM elements
const logsTableBody = document.getElementById('logsTableBody');
const logDetails = document.getElementById('logDetails');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const filterInput = document.getElementById('filterInput');

// Load and display logs
function loadLogs() {
  chrome.runtime.sendMessage({ action: "getLogs" }, response => {
    if (response && response.logs) {
      displayLogs(response.logs);
    }
  });
}

// Display logs in the table
function displayLogs(logs) {
  // Clear existing logs
  logsTableBody.innerHTML = '';
  
  // Get filter value
  const filterValue = filterInput.value.toLowerCase();
  
  // Filter and display logs
  logs
    .filter(log => {
      if (!filterValue) return true;
      return log.url.toLowerCase().includes(filterValue) || 
             log.method.toLowerCase().includes(filterValue) ||
             (log.status && log.status.toString().includes(filterValue));
    })
    .forEach(log => {
      const row = document.createElement('tr');
      
      // Format timestamp
      const time = new Date(log.timestamp).toLocaleTimeString();
      
      // Create table cells
      row.innerHTML = `
        <td>${time}</td>
        <td>${log.method}</td>
        <td class="url-cell">${truncate(log.url, 50)}</td>
        <td>${log.status || 'pending'}</td>
        <td>${log.type}</td>
      `;
      
      // Add click handler to show details
      row.addEventListener('click', () => {
        showLogDetails(log);
        
        // Highlight selected row
        document.querySelectorAll('#logsTableBody tr').forEach(r => {
          r.classList.remove('selected');
        });
        row.classList.add('selected');
      });
      
      logsTableBody.appendChild(row);
    });
}

// Show details for a selected log
function showLogDetails(log) {
  logDetails.innerHTML = `
    <h3>Request Details</h3>
    <div class="detail-group">
      <div class="detail-item">
        <span class="label">Time:</span>
        <span class="value">${new Date(log.timestamp).toLocaleString()}</span>
      </div>
      <div class="detail-item">
        <span class="label">Method:</span>
        <span class="value">${log.method}</span>
      </div>
      <div class="detail-item">
        <span class="label">URL:</span>
        <span class="value">${log.url}</span>
      </div>
      <div class="detail-item">
        <span class="label">Status:</span>
        <span class="value">${log.status || 'pending'}</span>
      </div>
      <div class="detail-item">
        <span class="label">Type:</span>
        <span class="value">${log.type}</span>
      </div>
    </div>
    
    <h3>Request Body</h3>
    <pre class="code-block">${formatJSON(log.requestBody)}</pre>
    
    ${log.responseHeaders ? `
      <h3>Response Headers</h3>
      <pre class="code-block">${formatHeaders(log.responseHeaders)}</pre>
    ` : ''}
  `;
}

// Helper function to truncate long strings
function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

// Helper function to format JSON
function formatJSON(obj) {
  if (!obj) return 'No data';
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return 'Cannot display data';
  }
}

// Helper function to format headers
function formatHeaders(headers) {
  if (!headers) return 'No headers';
  try {
    return headers.map(h => `${h.name}: ${h.value}`).join('\n');
  } catch (e) {
    return 'Cannot display headers';
  }
}

// Clear logs
clearBtn.addEventListener('click', () => {
  chrome.storage.local.set({ networkLogs: [] });
  logsTableBody.innerHTML = '';
  logDetails.innerHTML = '';
});

// Export logs
exportBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "getLogs" }, response => {
    if (response && response.logs) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.logs, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "network_logs.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  });
});

// Filter logs
filterInput.addEventListener('input', () => {
  loadLogs();
});

// Load logs when popup opens
document.addEventListener('DOMContentLoaded', loadLogs);