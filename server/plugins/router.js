const routes = [].concat(
  require('../routes/home'),
  require('../routes/healthz'),
  require('../routes/claim/property-type'),
  require('../routes/claim/accessible'),
  require('../routes/claim/date-of-subsidence'),
  require('../routes/claim/mine-type'),
  require('../routes/claim/email'),
  require('../routes/claim/confirmation'),
  require('../routes/clear-session'),
  require('../routes/public')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
