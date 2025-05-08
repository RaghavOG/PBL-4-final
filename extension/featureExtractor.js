// featureExtractor.js
// Maps a chrome.webRequest details object into the numeric feature vector.

import featureList from './model/feature_list.json' assert { type: 'json' };


export function extractFeatures(details) {
  const urlObj = new URL(details.url);

  // Basic proxies for the 41 features your model expects.
  // You can refine these to use real timings or header values.
  const raw = {
    dur:   (details.timeStamp - details.requestTime) / 1000,
    proto: details.type === 'xmlhttprequest' ? 'tcp' : 'udp',
    service: urlObj.protocol.replace(':', ''),
    state: 'FIN',
    spkts: 1,
    dpkts: 1,
    sbytes: details.requestBody?.raw?.[0]?.bytes?.length || 0,
    dbytes: parseInt(details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-length')?.value) || 0,
    rate: 1,
    // the rest we don’t see in HTTP-level APIs, so default to 0
    sttl:0, dttl:0, sload:0, dload:0, sloss:0, dloss:0,
    sinpkt:0, dinpkt:0, sjit:0, djit:0,
    swin:0, stcpb:0, dtcpb:0, dwin:0,
    tcprtt:0, synack:0, ackdat:0,
    smean:0, dmean:0,
    trans_depth:0, response_body_len:0,
    ct_srv_src:0, ct_state_ttl:0, ct_dst_ltm:0,
    ct_src_dport_ltm:0, ct_dst_sport_ltm:0, ct_dst_src_ltm:0,
    is_ftp_login:0, ct_ftp_cmd:0, ct_flw_http_mthd:0,
    ct_src_ltm:0, ct_srv_dst:0, is_sm_ips_ports:0
  };

  // Convert raw values into the ordered numeric array
  return featureList.map(key => {
    const v = raw[key];
    if (typeof v === 'number') return v;
    // For strings, do a simple hash → [0,1) so model sees a consistent numeric
    const h = [...String(v)].reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return (h % 97) / 97;
  });
}
