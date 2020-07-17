const path = require('path')
const nunjucks = require('nunjucks')
const config = require('../config')
const pkg = require('../../package.json')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          options.compileOptions.environment = nunjucks.configure([
            path.join(options.relativeTo || process.cwd(), options.path),
            'node_modules/govuk-frontend/'
          ], {
            autoescape: true,
            watch: false
          })

          return next()
        }
      }
    },
    path: '../views',
    relativeTo: __dirname,
    isCached: !config.isDev,
    context: {
      appVersion: pkg.version,
      appInsightsKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
      appInsightsCloudRole: process.env.APPINSIGHTS_CLOUDROLE,
      assetPath: '/static',
      govukAssetPath: '/assets',
      serviceName: 'FFC Demo Service',
      pageTitle: 'FFC Demo Service - GOV.UK'
    }
  }
}
