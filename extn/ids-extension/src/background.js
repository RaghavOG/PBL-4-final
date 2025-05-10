import browser from "webextension-polyfill";
import axios from "axios";

let enabled = false;
let requestLogs = [];  // persisted in storage

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 50; // Minimum 200ms between requests
const REQUEST_BATCH_SIZE = 2; // Process 1 request per 3 captured
let requestCounter = 0;

// Domain-based filtering
const EXCLUDED_DOMAINS = [
  "google.com", 
  // "googleapis.com",
  // "gstatic.com",
  // "youtube.com",
  // "facebook.com",
  // "microsoft.com",
  // "apple.com",
  // "cloudflare.com",
  // "jquery.com",
  // "jsdelivr.net",
  // "unpkg.com",
  // "cdnjs.cloudflare.com"
];

// Initialize on install or update
browser.runtime.onInstalled.addListener(async () => {
  console.log("🔄 Extension installed/upgraded");
  await browser.storage.local.set({
    enabled: false,
    requestLogs: []
  });
  browser.action.setBadgeText({ text: "" });
});

// Toggle when toolbar icon clicked
browser.action.onClicked.addListener(async () => {
  enabled = !(await browser.storage.local.get("enabled")).enabled;
  await browser.storage.local.set({ enabled });
  browser.action.setBadgeText({ text: enabled ? "ON" : "" });
});

// Listen for toggle from popup
browser.runtime.onMessage.addListener((msg, _sender, send) => {
  if (msg.cmd === "toggle") {
    enabled = msg.on;
    browser.storage.local.set({ enabled });
    browser.action.setBadgeText({ text: enabled ? "ON" : "" });
    send({ ok: true });
  }
  if (msg.cmd === "get-stats") {
    send({
      enabled,
      requestLogs: requestLogs.slice(-100)  // last 100 entries
    });
  }
  // New handler for test notification
  if (msg.cmd === "test-notification") {
    triggerSampleAttack().then(() => {
      send({ ok: true, message: "Test notification triggered" });
    });
    return true; // Required for async response
  }
});

// Helper function to check if URL should be excluded based on domain
function shouldExcludeUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Helper function to extract the PCA-selected features from request details
// Based on the notebook, the top features are:
// ['proto','dur','state','smean','sttl','dpkts','ackdat','synack','response_body_len','djit']
function extractPcaFeatures(details) {
  return {
    // These fields match the 10 PCA-selected features exactly in order
    'proto': details.url.startsWith("https") ? 6 : 17, // 6 for TCP (HTTPS), 17 for UDP
    'dur': details.timeStamp ? details.timeStamp / 1000 % 10 : 0,
    'state': 1, // Default connection state value
    'smean': details.requestSize ? details.requestSize : 0,
    'sttl': 64, // Default TTL value
    'dpkts': 1, // Default packets count
    'ackdat': 0.0, // Time between SYN_ACK and ACK
    'synack': 0.0, // Time between SYN and SYN_ACK
    'response_body_len': details.responseSize ? details.responseSize : 0,
    'djit': 0.0 // Destination jitter
  };
}

// Batch processing queue
const requestQueue = [];
let processingQueue = false;

// Process items in the queue
async function processQueue() {
  if (processingQueue || requestQueue.length === 0) {
    return;
  }
  
  processingQueue = true;
  
  try {
    const details = requestQueue.shift();
    await analyzeRequest(details);
  } catch (err) {
    console.error("Error processing queue:", err);
  } finally {
    processingQueue = false;
    
    // Schedule next queue processing
    if (requestQueue.length > 0) {
      setTimeout(processQueue, MIN_REQUEST_INTERVAL);
    }
  }
}

// Actual request analysis function
async function analyzeRequest(details) {
  try {
    // Extract only the PCA-selected features
    const featuresObj = extractPcaFeatures(details);
    
    console.log("Sending features to API:", featuresObj);
    
    // Send request to our legacy endpoint which can handle both array and object formats
    const response = await fetch("http://localhost:8000/predict-legacy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ features: Object.values(featuresObj) })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const result = await response.json();
    
    // Use the model's prediction (1 = attack, 0 = normal)
    const isSafe = result.prediction === 0;
    
    // Log it
    const entry = { 
      url: details.url, 
      time: Date.now(), 
      safe: isSafe,
      probability: result.probability
    };
    
    requestLogs.push(entry);
    
    // Keep logs at a reasonable size
    if (requestLogs.length > 500) {
      requestLogs = requestLogs.slice(-500);
    }
    
    await browser.storage.local.set({ requestLogs });

    // Show alert badge on the extension icon when attack detected
    if (!isSafe) {
      browser.action.setBadgeText({ text: "⚠️" });
      browser.action.setBadgeBackgroundColor({ color: "#FF0000" });
      
      // Alert threshold - only show notifications for high confidence attacks
      if (result.probability > 0.7) {
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icon/32.png"),
          title: "Intrusion Alert",
          message: `Potential attack detected: ${new URL(details.url).hostname}\nConfidence: ${(result.probability * 100).toFixed(2)}%`
        });
      }
      
      // Reset badge after a few seconds
      setTimeout(() => {
        browser.action.setBadgeText({ text: enabled ? "ON" : "" });
      }, 5000);
    }
  } catch (err) {
    console.error("Prediction error:", err);
    console.error("Error details:", err.message);
  }
}

// Main listener for web requests
browser.webRequest.onCompleted.addListener(
  (details) => {
    if (!enabled) return;
    
    // Increment counter for sampling
    requestCounter++;
    
    // Apply filtering criteria
    if (
      // Skip requests to common CDNs and service domains
      shouldExcludeUrl(details.url) ||
      
      // Sample requests (process 1 out of every BATCH_SIZE requests)
      requestCounter % REQUEST_BATCH_SIZE !== 0 || 
      
      // Skip non-document requests like images, stylesheets, etc.
      (details.type && !["main_frame", "sub_frame", "xmlhttprequest"].includes(details.type))
    ) {
      return;
    }
    
    // Add to processing queue
    requestQueue.push(details);
    
    // Start processing if not already in progress
    if (!processingQueue) {
      processQueue();
    }
  },
  { urls: ["<all_urls>"] }
);

// Simple error handling for API connection
async function checkApiConnection() {
  try {
    const response = await fetch("http://localhost:8000/");
    if (response.ok) {
      console.log("✅ Connected to IDS API");
    } else {
      console.warn("⚠️ API connection issue: Status " + response.status);
    }
  } catch (err) {
    console.error("❌ Cannot connect to IDS API:", err.message);
    console.error("Make sure the FastAPI server is running on http://localhost:8000");
  }
}

// Check API connection on startup
setTimeout(checkApiConnection, 2000);

// Function to trigger test notification
async function triggerSampleAttack() {
  try {
    console.log("🔬 Fetching a sampled attack from backend…");
    // 1) fetch a real attack feature vector
    const resp1 = await fetch("http://localhost:8000/sample-attack");
    if (!resp1.ok) throw new Error("Sample API returned " + resp1.status);
    const { features } = await resp1.json();

    console.log("🔥 Sending to predict-legacy:", features);
    // 2) send it through your existing prediction endpoint
    const resp2 = await fetch("http://localhost:8000/predict-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features })
    });
    if (!resp2.ok) throw new Error("Predict API returned " + resp2.status);
    const result = await resp2.json();

    // 3) reuse your notification logic
    const isSafe = result.prediction === 0;
    if (!isSafe && result.probability > 0.7) {
      browser.action.setBadgeText({ text: "⚠️" });
      browser.action.setBadgeBackgroundColor({ color: "#FF0000" });
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icon/32.png"),
        title: "Intrusion Alert (Sample)",
        message: `Detected sample attack\nConfidence: ${(result.probability*100).toFixed(1)}%`
      });
      // restore badge after a moment
      setTimeout(() => {
        browser.action.setBadgeText({ text: enabled ? "ON" : "" });
      }, 3000);
    }

    // 4) log it
    const entry = {
      url: "SAMPLED_ATTACK",
      time: Date.now(),
      safe: isSafe,
      probability: result.probability
    };
    requestLogs.push(entry);
    if (requestLogs.length > 500) {
      requestLogs = requestLogs.slice(-500);
    }
    await browser.storage.local.set({ requestLogs });

  } catch (e) {
    console.error("triggerSampleAttack error:", e);
  }
}

// Persistence mechanism for Manifest V3
// 1. Create an alarm that fires periodically to wake up the service worker
browser.alarms.create("keepAlive", { periodInMinutes: 0.5 });

// 2. Listen for the alarm and do minimal work to keep the service worker alive
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("💓 Service worker heartbeat at", new Date().toLocaleTimeString());
    checkApiConnection();
  }
});

// 3. Register a handler for when the service worker is about to be terminated
if (typeof self.onbeforeunload === 'function') {
  self.onbeforeunload = (event) => {
    console.log("⚠️ Service worker is about to be terminated");
    // Save any important state here
    return null;
  };
}

// Restore state from storage on startup
(async function() {
  const data = await browser.storage.local.get(["enabled", "requestLogs"]);
  enabled = data.enabled || false;
  requestLogs = data.requestLogs || [];
  browser.action.setBadgeText({ text: enabled ? "ON" : "" });
  console.log("🔄 Service worker initialized at", new Date().toLocaleTimeString());
})();



