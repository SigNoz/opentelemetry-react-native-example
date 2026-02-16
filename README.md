# SigNoz OpenTelemetry React Native Example

Minimal React Native app instrumented with OpenTelemetry.

- Sends mobile traces via OTLP/HTTP
- Instruments `fetch` and `XMLHttpRequest`
- Works with SigNoz Cloud or a local OpenTelemetry Collector

## Prerequisites

- Node.js `20.19.6+` (or any Node `>=20`, see `.nvmrc`)
- Ruby + Bundler
- Xcode + iOS Simulator (for iOS)
- CocoaPods (installed via Bundler in this repo)
- Optional: Docker (for local collector testing)

## First-Time Setup (Run Once)

```bash
git clone https://github.com/SigNoz/opentelemetry-react-native-example.git
cd opentelemetry-react-native-example
nvm use
npm install
npm run ios:setup
npm run doctor
```

`npm run ios:setup` runs Bundler + CocoaPods setup for iOS.

## Configure OTEL Environment

This app reads these environment variables at build time:

- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `OTEL_EXPORTER_OTLP_TRACES_HEADERS` (optional, trace-specific override)

Edit `.env` values:

```bash
cp .env.example .env
```

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=<your-otlp-traces-endpoint>
OTEL_EXPORTER_OTLP_HEADERS=<key=value pairs>
```

Examples:

```bash
# SigNoz Cloud
OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.us.signoz.cloud:443/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=signoz-ingestion-key=<your-ingestion-key>
# Local collector
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=
```

Important: these values are inlined by Babel. In this repo, `npm run ios` restarts Metro with `--reset-cache`, so the latest env values are picked up each run.

## Run (Every Time)

1. Load `.env`:

```bash
set -a; source .env; set +a
```

2. Start app:

```bash
npm run ios -- --simulator "iPhone 17" --force-pods
```

Stop simulator:

```bash
npm run stop-ios
```

Stop Metro + simulator + local collector:

```bash
npm run stop-ios && pkill -f "react-native/cli.js start" && docker stop otelcol
```

## Local Collector (Optional)

```bash
docker run --rm --name otelcol \
  -p 4317:4317 -p 4318:4318 \
  -v "$PWD/otel-collector-config.yaml:/etc/otelcol/config.yaml" \
  otel/opentelemetry-collector-contrib:latest \
  --config=/etc/otelcol/config.yaml
```

## Verify

After app launch, tap **Make Test Request** in the UI.

- `Tracer: Ready` should appear.
- Request spans should be exported to your configured OTLP endpoint.
- For cloud endpoint, request headers should include `signoz-ingestion-key`.

## Troubleshooting

- `Cannot find module babel-plugin-transform-inline-environment-variables`:
  - run `npm install`
  - ensure Node is `>=20` (`nvm use`)
- iOS pod/Ruby issues:
  - rerun `bundle install --path vendor/bundle`
  - rerun `cd ios && bundle exec pod install`
- Metro cache/port conflicts:
  - `pkill -f "react-native/cli.js start --port 8081"`
  - `watchman watch-del-all`

## License

Apache 2.0. See `LICENSE`.
