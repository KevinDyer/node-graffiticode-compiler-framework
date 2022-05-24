const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const opentelemetry = require('@opentelemetry/sdk-node');

const { createSpanExporter } = require('./span-exporter');

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new opentelemetry.NodeSDK({
  autoDetectResources: true,
  traceExporter: createSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessor: new opentelemetry.tracing.BatchSpanProcessor(
    createSpanExporter(),
  ),
});
sdk.start();

console.log('tracing initialized');
