// offscreen.js

// (remove any old import of ort—assume you’re using the global `ort` from CDN)

let session = null;

export async function createOffscreen() {
  if (chrome.offscreen && await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['INFERENCE'],
    justification: 'Run ONNX inference for IDS'
  });
}

// Listen for inference and model-loading
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.cmd === 'infer') {
    // Lazy-load the model once:
    if (!session) {
      const modelUrl = chrome.runtime.getURL('model/randomforest.onnx');
      console.log('📦 Loading ONNX model…', modelUrl);
      session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] });
      console.log('✅ ONNX model loaded');
      // Send the “model-ready” message
      chrome.runtime.sendMessage({ cmd: 'model-ready' });
    }

    // Now handle inference exactly as before…
    const features = msg.features;
    const n = features.length, d = features[0].length;
    const flat = new Float32Array(n * d);
    for (let i = 0; i < n; i++) flat.set(features[i], i * d);

    const inputTensor = new ort.Tensor('float32', flat, [n, d]);
    const output = await session.run({ float_input: inputTensor });
    const probs  = Array.from(output.output_probability.data);
    chrome.runtime.sendMessage({ cmd: 'result', probs, urls: msg.urls });
  }
});
