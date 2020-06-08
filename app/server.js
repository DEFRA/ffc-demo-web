const hapi = require('@hapi/hapi')
const config = require('./config')
const catbox = config.isTest ? require('@hapi/catbox-memory') : require('@hapi/catbox-redis')
const messageService = require('./services/message-service')

async function createServer () {
  // Create the hapi server

  console.log('=== CONNECTION TO REDIS ===')
  console.log(config.redisHost)
  console.log(config.redisPort)
  console.log(config.redisPassword)
  console.log(config.redisPartition)

  const server = hapi.server({
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    cache: [{
      name: config.cacheName,
      provider: {
        constructor: catbox,
        options: {
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword,
          tls: {},
          partition: config.redisPartition
        }
      }
    }]
  })

  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('./plugins/auth'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/session-cache'))

  if (config.isDev) {
    await server.register(require('blipp'))
    await server.register(require('./plugins/logging'))
  }

  await messageService.registerService()
  return server
}

module.exports = createServer
