const applicationName = 'test-app'

jest.mock('@azure/monitor-opentelemetry', () => ({
  useAzureMonitor: jest.fn()
}))
jest.mock('@opentelemetry/resources')
jest.mock('@azure/identity')
const { useAzureMonitor } = require('@azure/monitor-opentelemetry')
describe('openTelemetry', () => {
  beforeEach(() => {
    process.env.APPINSIGHTS_CLOUDROLE = applicationName
    jest.clearAllMocks()
  })

  it('should call useAzureMonitor with the correct ', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-connection-string'
    process.env.NODE_ENV = 'production'
    const { setup } = require('../../app/services/app-insights.js')
    setup()
    expect(useAzureMonitor).toHaveBeenCalled()
  })

  it('should not call useAzureMonitor if SHARED_APPINSIGHT_CONNECTIONSTRING is not set', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = ''
    const { setup } = require('../../app/services/app-insights.js')
    setup()
    expect(useAzureMonitor).not.toHaveBeenCalled()
  })

  it('should not pass credential if NODE_ENV is development', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-connection-string'
    process.env.NODE_ENV = 'development'
    const { setup } = require('../../app/services/app-insights.js')
    setup()
    expect(useAzureMonitor).toHaveBeenCalled()
  })
})
