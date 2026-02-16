/**
 * OpenTelemetry Tracing Setup — from SigNoz Documentation
 *
 * This file contains the instrumentation code from:
 * https://signoz.io/docs/instrumentation/javascript/opentelemetry-react-native/
 *
 * Modified to use environment variables for OTEL configuration:
 * - OTEL_EXPORTER_OTLP_ENDPOINT: Full OTLP endpoint URL (e.g., https://ingest.us.signoz.cloud:443/v1/traces)
 * - OTEL_EXPORTER_OTLP_HEADERS: Comma-separated OTLP headers (e.g., signoz-ingestion-key=<key>)
 * - OTEL_EXPORTER_OTLP_TRACES_HEADERS: Trace-specific headers (overrides OTEL_EXPORTER_OTLP_HEADERS)
 */

import {
  CompositePropagator,
  parseKeyPairsIntoRecord,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_OS_NAME,
  ATTR_SERVICE_NAME,
} from '@opentelemetry/semantic-conventions/incubating';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const getOtlpHeadersFromEnv = () => {
  // OTel env precedence: signal-specific headers override generic OTLP headers.
  const sharedHeaders = parseKeyPairsIntoRecord(process.env.OTEL_EXPORTER_OTLP_HEADERS || '');
  const traceHeaders = parseKeyPairsIntoRecord(process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS || '');
  return {
    ...sharedHeaders,
    ...traceHeaders,
  };
};

const Tracer = async () => {
  // Read configuration from environment variables (inlined at build time by Babel)
  const exporterUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
  const headers = getOtlpHeadersFromEnv();

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "react-native-test-app",
    [ATTR_OS_NAME]: Platform.OS,
  });

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: exporterUrl,
          headers: headers,
        }),
        {
          scheduledDelayMillis: 500,
        },
      ),
    ],
  });

  provider.register({
    propagator: new CompositePropagator({
      propagators: [
        new W3CBaggagePropagator(),
        new W3CTraceContextPropagator(),
      ],
    }),
  });

  // Ignore the exporter's own requests to prevent recursive spans
  // Simply pass the full exporter URL as a regex pattern
  const ignorePattern = new RegExp(exporterUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/,
        clearTimingResources: false,
        ignoreUrls: [ignorePattern],
      }),
      new XMLHttpRequestInstrumentation({
        ignoreUrls: [ignorePattern],
      }),
    ],
  });
};

export const useTracer = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      Tracer()
        .catch(() => console.warn("failed to setup tracer"))
        .finally(() => setLoaded(true));
    }
  }, [loaded]);

  return {
    loaded,
  };
};
