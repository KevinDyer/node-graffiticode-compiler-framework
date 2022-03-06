const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { ResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');
const { v4 } = require('uuid');

const { createSpanExporter } = require('./span-exporter');

const isOpenTelemetryEnabled = () => (process.env.OTEL_ENABLED === 'true');

const getServiceName = () => {
  const envServiceName = process.env.OTEL_SERVICE_NAME;
  if (typeof envServiceName === 'string' && envServiceName.length > 0) {
    return envServiceName;
  }
  const randomServiceName = v4();
  console.log(`using random service name for OpenTelemetry: "${randomServiceName}"`);
  return randomServiceName;
};

const setupOpenTelemetry = () => {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ResourceAttributes.SERVICE_NAME]: getServiceName(),
    })
  });
  provider.addSpanProcessor(
    new BatchSpanProcessor(
      createSpanExporter()
    )
  );
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new GrpcInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  console.log('tracing initialized');
};

if (isOpenTelemetryEnabled()) {
  setupOpenTelemetry();
}

