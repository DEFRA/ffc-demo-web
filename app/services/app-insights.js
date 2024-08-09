const appInsights = require('applicationinsights')

function setup () {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start()
    console.log('App Insights Running')
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    appInsights.defaultClient.context.tags[cloudRoleTag] = appName
  } else {
    console.log('App Insights Not Running!')
  }
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    trackEvent('AppInsights', { status: 'Running' })
    trackException(new Error('AppInsights Running'))
    trackRequest({ name: 'AppInsights', duration: 100, resultCode: 200, success: true })
    trackMetric('AppInsights', 1)
    trackTrace('AppInsights Running')
    trackDependency({ target: 'AppInsights', name: 'AppInsights', duration: 100, resultCode: 200, success: true })
  }
}

function trackEvent (name, properties) {
  console.log('App Insights Event:', name, properties)
}

function trackException (error) {
  console.log('App Insights Exception:', error)
}

function trackRequest (request) {
  console.log('App Insights Request:', request)
}

function trackMetric (name, value) {
  console.log('App Insights Metric:', name, value)
}

function trackTrace (message) {
  console.log('App Insights Trace:', message)
}

function trackDependency (dependency) {
  console.log('App Insights Dependency:', dependency)
}

module.exports = { setup }
