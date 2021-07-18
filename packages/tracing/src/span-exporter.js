const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { ConsoleSpanExporter } = require('@opentelemetry/tracing');

exports.createSpanExporter = () => {
  if (process.env.OTEL_SPAN_EXPORTER === 'zipkin') {
    return new ZipkinExporter({
      url: process.env.ZIPKIN_URL,
    });
  }
  return new ConsoleSpanExporter();
};
