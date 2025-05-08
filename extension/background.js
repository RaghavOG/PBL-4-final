// background.js
import { createOffscreen } from "./offscreen.js";
import { extractFeatures } from "./featureExtractor.js";

// DEBUG
console.log("🛠️ Background script loaded");

let enabled = false;
let queue = [];
let requestCount = 0;
let alertCount   = 0;
let modelReady   = false;

const THRESHOLD = 0.7;
const BATCH_INTERVAL_MS = 100;

// 1️⃣ Ensure offscreen page and listen for model‐ready
createOffscreen();
chrome.runtime.onMessage.addListener((msg, _sender) => {
  if (msg.cmd === "model-ready") {
    modelReady = true;
    chrome.storage.local.set({ modelReady });
  }
});

// 2️⃣ Load saved state + stats
chrome.storage.local.get(
  ["enabled","requestCount","alertCount","modelReady"],
  ({ enabled: e, requestCount: rc, alertCount: ac, modelReady: mr }) => {
    enabled      = e  ?? false;
    requestCount = rc ?? 0;
    alertCount   = ac ?? 0;
    modelReady   = mr ?? false;
    updateBadge();
  }
);

// 3️⃣ Toggle by toolbar icon
chrome.action.onClicked.addListener(() => {
  enabled = !enabled;
  chrome.storage.local.set({ enabled });
  updateBadge();
});

// 4️⃣ Toggle from popup
chrome.runtime.onMessage.addListener((msg, _, send) => {
  if (msg.cmd === "toggle") {
    enabled = msg.on;
    chrome.storage.local.set({ enabled });
    updateBadge();
    send({ ok: true });
  }
  if (msg.cmd === "get-stats") {
    send({ requestCount, alertCount, modelReady });
  }
});

// 5️⃣ Observe requests
chrome.webRequest.onCompleted.addListener(
  details => {
    if (!enabled) return;
    requestCount++;
    chrome.storage.local.set({ requestCount });
    const features = extractFeatures(details);
    queue.push({ features, url: details.url });
  },
  { urls: ["<all_urls>"] }
);

// 6️⃣ Batch & infer
setInterval(() => {
  if (!enabled || queue.length === 0 || !modelReady) return;
  const batch = queue.splice(0);
  chrome.runtime.sendMessage({
    cmd: "infer",
    features: batch.map(x => x.features),
    urls:     batch.map(x => x.url)
  });
}, BATCH_INTERVAL_MS);

// 7️⃣ Handle results
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.cmd === "result" && Array.isArray(msg.probs)) {
    msg.probs.forEach((p, i) => {
      if (p >= THRESHOLD) {
        alertCount++;
        chrome.storage.local.set({ alertCount });
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/32.png",
          title: "Intrusion Alert",
          message: `${msg.urls[i]}\nRisk: ${(p*100).toFixed(1)}%`
        });
      }
    });
  }
});

// Helper to update badge
function updateBadge() {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? "#0c9" : "#888" });
}
