const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { Resource } = require('@opentelemetry/resources');
const { ResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/tracing');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');

const { createSpanExporter } = require('./span-exporter');

const applicationName = 'getting-start';

const provider = new NodeTracerProvider({
  resource: new Resource({
    [ResourceAttributes.SERVICE_NAME]: applicationName,
  })
});

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const exporter = createSpanExporter();
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new GrpcInstrumentation(),
    new PgInstrumentation(),
  ],
});

console.log('tracing initialized');
