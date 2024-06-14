const { metrics, trace } = require('@opentelemetry/api')
const { registerInstrumentations } = require('@opentelemetry/instrumentation')
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
const { useAzureMonitor } = require('@azure/monitor-opentelemetry')
const { SEMRESATTRS_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')
const { Resource } = require('@opentelemetry/resources')
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: process.env.APPINSIGHTS_CLOUDROLE
})
const { DefaultAzureCredential } = require('@azure/identity')

function setup () {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    const options = {
      azureMonitorExporterOptions: {
        connectionString: process.env.APPINSIGHTS_CONNECTIONSTRING,
        credential: (process.env.NODE_ENV === 'production') ? new DefaultAzureCredential() : undefined
      },
      resource
    }
    useAzureMonitor(options)
    const instrumentations = [
      new ExpressInstrumentation()
    ]
    registerInstrumentations({
      tracerProvider: trace.getTracerProvider(),
      meterProvider: metrics.getMeterProvider(),
      instrumentations
    })
    console.log('App Insights Running')
  } else {
    console.log('App Insights Not Running!')
  }
}
module.exports = { setup }
