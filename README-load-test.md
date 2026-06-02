# Local Fake VPS k6 Load Test

This load test is **local-only** and targets your VM app URL:
- Default: `http://192.168.100.104:8080`
- Source of real endpoints: `tests/products.json` (from your local seeded DB routes)

The script includes guardrails:
- Refuses to run against non-local hosts (public domains/IPs).
- No checkout/payment flow.
- No real email/SMS actions.
- Optional add-to-cart is disabled by default.

## Files

- `tests/load-test.js`
- `tests/products.json`
- `tests/load-report.json` (generated after a run)

## Install k6 (Ubuntu)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install -y k6
```

## Exact run commands

Run from project root:

```bash
cd "/home/ilyes/custom projects/fullhouse/evershop"
```

Smoke (1-5 users, 1 min):
```bash
k6 run --env BASE_URL=http://192.168.100.104:8080 --env PROFILE=smoke tests/load-test.js
```

Small (10 users, 3 min):
```bash
k6 run --env BASE_URL=http://192.168.100.104:8080 --env PROFILE=small tests/load-test.js
```

Medium (50 users, 5 min):
```bash
k6 run --env BASE_URL=http://192.168.100.104:8080 --env PROFILE=medium tests/load-test.js
```

Stress (ramp up until errors appear):
```bash
k6 run --env BASE_URL=http://192.168.100.104:8080 --env PROFILE=stress tests/load-test.js
```

Optional safe cart add scenario (local test only):
```bash
k6 run --env BASE_URL=http://192.168.100.104:8080 --env PROFILE=smoke --env ENABLE_CART=true tests/load-test.js
```

## What is being tested

- Homepage
- Category/product listing pages
- Product detail pages
- Search pages
- Cart page view
- Optional add-to-cart API (`/api/cart/mine/items`) using seeded local SKUs

No checkout route is tested.

## Thresholds and fail conditions

Test fails if:
- Error rate (`http_req_failed`) > 1%
- p95 latency > 1000ms
- p99 latency > 2000ms
- Too many 4xx/5xx:
  - `http_4xx_rate >= 1%`
  - `http_5xx_rate >= 1%`
  - combined bad status rate too high

## Debugging output

Failed requests are logged in format:

```text
[LOAD_DEBUG] endpoint=<name> status=<code> url=<url>
```

This includes:
- URL
- status code
- endpoint name

## How to read results

At the end of run:
- Terminal summary shows:
  - error rate
  - p95/p99 latency
  - req/s
- JSON full report is written to:
  - `tests/load-report.json`

## Good vs bad results

Good:
- `http_req_failed <= 1%`
- `p95 < 1000ms`
- `p99 < 2000ms`
- very low 4xx/5xx rates

Bad:
- Error rate above 1%
- p95/p99 above thresholds
- repeated 5xx or widespread 4xx in debug logs
- steep degradation when moving from small -> medium -> stress

