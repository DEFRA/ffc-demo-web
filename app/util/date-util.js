const moment = require('moment')

module.exports = {
  buildDate: function (year, month, day, validate) {
    if (validate) {
      const testDate = moment([year, month - 1, day])
      if (!testDate.isValid()) {
        throw new Error('Invalid date')
      }
      if (new Date(year, month, day) > new Date()) {
        throw new Error('Future date')
      }
    }
    return new Date(year, month - 1, day)
  }
}
