import { buildApiAction, buildJsonApiAction } from './base';

export const FetchRequests = buildApiAction(
  'FETCH_REQUESTS',
  {url: '/requests'}
);

export const FetchRequestsInState = buildApiAction(
  'FETCH_REQUESTS_IN_STATE',
  (state) => {
    if (_.contains(['pending', 'cleanup'], state)) {
      return {url: `/requests/queued/${state}`};
    } else if (_.contains(['all', 'noDeploy', 'activeDeploy'], state)) {
      return {url: '/requests'};
    }
    return {url: `/requests/${state}`};
  }
);

export const FetchRequest = buildApiAction(
  'FETCH_REQUEST',
  (requestId) => ({
    url: `/requests/request/${requestId}`
  }),
  (requestId) => requestId
);

export const SaveRequest = buildJsonApiAction(
  'SAVE_REQUEST',
  'POST',
  (requestData) => ({
    url: '/requests',
    body: requestData
  })
);

export const RemoveRequest = buildJsonApiAction(
  'REMOVE_REQUEST',
  'DELETE',
  (requestId, message) => ({
    url: `/requests/request/${requestId}`,
    body: { message }
  })
);

export const RunRequest = buildJsonApiAction(
  'RUN_REQUEST_NOW',
  'POST',
  (requestId, data) => ({
    url: `/requests/request/${requestId}/run`,
    body: { data }
  })
);

export const FetchRequestRun = buildApiAction(
  'FETCH_REQUEST_RUN',
  (requestId, runId, successResponseCodes = null) => ({
    url: `/requests/request/${ requestId }/run/${runId}`,
    successResponseCodes
  })
);

export const UnpauseRequest = buildJsonApiAction(
  'UNPAUSE_REQUEST',
  'POST',
  (requestId, message) => ({
    url: `/requests/request/${requestId}/unpause`,
    body: { message }
  })
);

export const ScaleRequest = buildJsonApiAction(
  'SCALE_REQUEST',
  'PUT',
  (requestId, data) => ({
    url: `/requests/request/${requestId}/scale`,
    body: data
  })
);

export const BounceRequest = buildJsonApiAction(
  'BOUNCE_REQUEST',
  'POST',
  (requestId, data) => ({
    url: `/requests/request/${requestId}/bounce`,
    body: data
  })
);
