// test.js
const assert = require('assert')
const envVar = `${process.env.ffc_demo_web_APPINSIGHTS_CONNECTIONSTRING}`

describe('Environment Variable Test', function () {
  it('should print the environment variable', function () {
    console.log('Environment Variable:', envVar)
    assert.ok(envVar, 'Environment variable is not set')
  })
})
