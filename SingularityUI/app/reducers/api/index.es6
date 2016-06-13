import { combineReducers } from 'redux';
import buildApiActionReducer from './base';

import { FetchAction as UserFetchAction } from '../../actions/api/user';
import { FetchAction as WebhooksFetchAction } from '../../actions/api/webhooks';
import { FetchAction as SlavesFetchAction } from '../../actions/api/slaves';
import { FetchAction as RacksFetchAction } from '../../actions/api/racks';
import { FetchAction as StatusFetchAction } from '../../actions/api/status';
import { FetchAction as RequestFetchAction } from '../../actions/api/request';

const user = buildApiActionReducer(UserFetchAction);
const webhooks = buildApiActionReducer(WebhooksFetchAction);
const slaves = buildApiActionReducer(SlavesFetchAction);
const racks = buildApiActionReducer(RacksFetchAction);
const status = buildApiActionReducer(StatusFetchAction);
const request = buildApiActionReducer(RequestFetchAction);

export default combineReducers({user, webhooks, slaves, racks, status, request});
