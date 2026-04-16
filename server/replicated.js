const SDK_URL = 'http://replicated:3000/api/v1';

async function sdkGet(path) {
  const res = await fetch(`${SDK_URL}${path}`);
  if (!res.ok) throw new Error(`SDK ${path} returned ${res.status}`);
  return res.json();
}

async function sdkPost(path, body) {
  const res = await fetch(`${SDK_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SDK ${path} returned ${res.status}`);
  return res.json();
}

module.exports = {
  getLicenseField: (name) => sdkGet(`/license/fields/${name}`),
  getLicenseInfo:  ()     => sdkGet('/license/info'),
  getUpdates:      ()     => sdkGet('/app/updates'),
  sendMetrics:     (data) => sdkPost('/app/custom-metrics', { data }),
};
