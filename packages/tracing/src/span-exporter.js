const { TraceExporter: GoogleCloudExporter } = require("@google-cloud/opentelemetry-cloud-trace-exporter");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { ZipkinExporter } = require("@opentelemetry/exporter-zipkin");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");

exports.createSpanExporter = () => {
  if (process.env.OTEL_SPAN_EXPORTER === "zipkin") {
    console.log("Using zipkin exporter");
    return new ZipkinExporter({});
  }
  if (process.env.OTEL_SPAN_EXPORTER === "jaeger") {
    console.log("Using jaeger exporter");
    return new JaegerExporter({});
  }
  if (process.env.OTEL_SPAN_EXPORTER === "google-cloud") {
    console.log("Using Google Cloud exporter");
    return new GoogleCloudExporter({});
  }
  console.log("Using console exporter");
  return new ConsoleSpanExporter();
};
