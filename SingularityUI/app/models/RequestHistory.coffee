Model = require './model'

class RequestHistory extends Model

    url: -> "#{ env.SINGULARITY_BASE }/#{ constants.apiBase }/history/request/#{ @requestId }/requests"

    initialize: (models, { @requestId }) =>

    parse: (requestHistoryObjects) ->
        requestHistory = {}
        requestHistory.requestId = @requestId
        requestHistory.requestUpdates = requestHistoryObjects

        _.each requestHistory.requestUpdates, (requestUpdate, i) =>
            requestUpdate.userHuman = requestUpdate.user?.split('@')[0] ? '—'
            requestUpdate.createdAtHuman = if requestUpdate.createdAt? then moment(requestUpdate.createdAt).from() else ''
            requestUpdate.stateHuman = constants.requestStates[requestUpdate.state]

        requestHistory

module.exports = RequestHistory