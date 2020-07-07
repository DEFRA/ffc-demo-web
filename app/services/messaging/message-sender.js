const appInsights = require('applicationinsights')
const { getSenderConfig } = require('./config-helper')
const MessageBase = require('./message-base')

class MessageSender extends MessageBase {
  constructor (name, config) {
    super(name, config)
    this.senderConfig = getSenderConfig(this.name, config)
  }

  async sendMessage (message) {
    const data = JSON.stringify(message)
    const sender = await this.connection.createAwaitableSender(this.senderConfig)
    let msgCreationTime
    let success = true
    let resultCode = 200
    try {
      console.log(`${this.name} sending message`, data)

      const correlationContext = appInsights.getCorrelationContext()
      const traceId = correlationContext.operation.traceparent.traceId
      const spanId = correlationContext.operation.traceparent.spanId
      msgCreationTime = Date.now()
      const msg = { body: data, correlation_id: `${traceId}.${spanId}`, creation_time: msgCreationTime }

      console.log(`${this.name} sending message`, msg)
      const delivery = await sender.send(msg)
      console.log(`message sent ${this.name}`)
      return delivery
    } catch (error) {
      success = false
      resultCode = 500
      console.error('failed to send message', error)
      throw error
    } finally {
      const duration = Date.now() - msgCreationTime
      appInsights.defaultClient.trackDependency({ data, dependencyTypeName: 'AMQP', duration, name: this.name, resultCode, success, target: this.senderConfig.target.address })
      await sender.close()
    }
  }
}

module.exports = MessageSender
