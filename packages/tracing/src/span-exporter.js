const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');

exports.createSpanExporter = () => {
  if (process.env.OTEL_SPAN_EXPORTER === 'zipkin') {
    return new ZipkinExporter({
      url: process.env.ZIPKIN_URL,
    });
  } else if (process.env.OTEL_SPAN_EXPORTER === 'google-cloud') {
    return new TraceExporter();
  }
  return new ConsoleSpanExporter();
};
