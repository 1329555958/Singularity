import React, {PropTypes} from 'react';
import Select from 'react-select';
import { connect } from 'react-redux';

import { Link } from 'react-router';
import { withRouter } from 'react-router';

import rootComponent from '../../rootComponent';
import MultiSelect from '../common/formItems/MultiSelect';
import MultiInputFormGroup from '../common/formItems/formGroups/MultiInputFormGroup';
import SelectFormGroup from '../common/formItems/formGroups/SelectFormGroup';
import TextFormGroup from '../common/formItems/formGroups/TextFormGroup';
import CheckboxFormGroup from '../common/formItems/formGroups/CheckboxFormGroup';
import { ModifyField, ClearForm } from '../../actions/ui/form';
import { SaveRequest, FetchRequest } from '../../actions/api/requests';
import { OverlayTrigger, Tooltip} from 'react-bootstrap/lib';
import { FormGroup, ControlLabel, FormControl, Form, Row, Col } from 'react-bootstrap';
import Utils from '../../utils';
import classNames from 'classnames';
import {FIELDS_BY_REQUEST_TYPE, INDEXED_FIELDS} from './fields';
import { FetchRacks } from '../../actions/api/racks';

const QUARTZ_SCHEDULE = 'quartzSchedule';
const CRON_SCHEDULE = 'cronSchedule';

const FORM_ID = 'requestForm';

const REQUEST_ID_REGEX = /[a-zA-Z0-9._-]*/;

const REQUEST_TYPES = ['SERVICE', 'WORKER', 'SCHEDULED', 'ON_DEMAND', 'RUN_ONCE'];

class RequestForm extends React.Component {
  static propTypes = {
  };

  static propTypes = {
    clearForm: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    racks: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired
    })).isRequired,
    request: PropTypes.shape({
      request: PropTypes.shape({
        id: PropTypes.string.isRequired,
        slavePlacement: PropTypes.oneOf(['', 'SEPARATE', 'SEPARATE_BY_REQUEST', 'GREEDY', 'OPTIMISTIC'])
      })
    }),
    saveApiCall: PropTypes.shape({
      isFetching: PropTypes.bool,
      error: PropTypes.shape({
        message: PropTypes.string
      }),
      data: PropTypes.shape({
        message: PropTypes.string
      })
    }).isRequired,
    form: PropTypes.shape({
      slavePlacement: PropTypes.oneOf(['', 'SEPARATE', 'SEPARATE_BY_REQUEST', 'GREEDY', 'OPTIMISTIC']),
      scheduleType: PropTypes.string
    }),
    router: PropTypes.object.isRequired
  };

  componentDidMount() {
    this.props.clearForm(FORM_ID);
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props, nextProps);
  }

  isEditing() {
    return this.props.request && this.props.request.request;
  }

  getValue(fieldId) {
    if (this.props.form && this.props.form[fieldId] !== undefined) {
      return this.props.form[fieldId];
    }
    if (this.isEditing() && this.props.request.request[fieldId] !== undefined) {
      return this.props.request.request[fieldId];
    }
    return '';
  }

  validateField(fieldId) {
    const value = this.getValue(fieldId);
    const {required, type} = INDEXED_FIELDS[fieldId];
    if (required && (_.isEmpty(value))) {
      return false;
    }
    if (!value || _.isEmpty(value)) {
      return true;
    }
    if (type === 'number') {
      const numericalValue = parseInt(value, 10);
      if (numericalValue !== 0 && !numericalValue) {
        return false;
      }
    }
    if (type === 'request-id') {
      if (value.match(REQUEST_ID_REGEX)[0] !== value) {
        return false;
      }
    }
    return true;
  }

  feedback(fieldId) {
    const value = this.getValue(fieldId);
    const {required} = INDEXED_FIELDS[fieldId];
    if (required && (_.isEmpty(value))) {
      return 'ERROR';
    }
    if (_.isEmpty(value)) {
      return null;
    }
    if (this.validateField(fieldId)) {
      return 'SUCCESS';
    }
    return 'ERROR';
  }

  cantSubmit() {
    if (this.props.saveApiCall.isFetching) {
      return true;
    }
    for (const field of FIELDS_BY_REQUEST_TYPE.ALL) {
      if (!this.validateField(field.id)) {
        return true;
      }
    }
    const scheduleType = this.getScheduleType();
    const requestTypeSpecificFields = FIELDS_BY_REQUEST_TYPE[this.getValue('requestType')];
    if (_.isEmpty(requestTypeSpecificFields)) {
      return true;
    }
    for (const field of requestTypeSpecificFields) {
      if (field.id === CRON_SCHEDULE && scheduleType !== CRON_SCHEDULE) {
        continue;
      }
      if (field.id === QUARTZ_SCHEDULE && scheduleType !== QUARTZ_SCHEDULE) {
        continue;
      }
      if (!this.validateField(field.id)) {
        return true;
      }
    }
    return false;
  }

  submitForm(event) {
    event.preventDefault();
    const request = {};
    const copyOverField = (field) => {
      const fieldId = field.id;
      if (this.getValue(fieldId) && fieldId !== QUARTZ_SCHEDULE && fieldId !== CRON_SCHEDULE && fieldId !== 'scheduleType') {
        request[fieldId] = this.getValue(fieldId);
      }
    };

    FIELDS_BY_REQUEST_TYPE[this.getValue('requestType')].map(copyOverField);
    FIELDS_BY_REQUEST_TYPE.ALL.map(copyOverField);

    if (this.getValue('requestType') === 'SCHEDULED') {
      if (this.getScheduleType() === QUARTZ_SCHEDULE) {
        request[QUARTZ_SCHEDULE] = this.getValue(QUARTZ_SCHEDULE);
      } else {
        request.schedule = this.getValue(CRON_SCHEDULE);
      }
    }

    if (['ON_DEMAND', 'RUN_ONCE'].indexOf(this.getValue('requestType')) !== -1) {
      request.daemon = false;
    } else if (['SERVICE', 'WORKER'].indexOf(this.getValue('requestType')) !== -1) {
      request.daemon = true;
    }


    if (request.rackAffinity) {
      request.rackAffinity = request.rackAffinity.map(rack => rack.value);
    }

    this.props.save(request);
    return null;
  }

  shouldRenderField(fieldId) {
    if (!this.getValue('requestType')) {
      return false;
    }
    if (_.pluck(FIELDS_BY_REQUEST_TYPE[this.getValue('requestType')], 'id').indexOf(fieldId) === -1) {
      return false;
    }
    return true;
  }

  getButtonsDisabled(type) {
    if (this.isEditing() && this.getValue('requestType') !== type) {
      return 'disabled';
    }
    return null;
  }

  updateField(fieldId, newValue) {
    this.props.update(FORM_ID, fieldId, newValue);
  }

  updateTypeButtonClick(event) {
    event.preventDefault();
    this.updateField('requestType', event.target.value);
  }

  getScheduleType() {
    if (this.isEditing() && !(this.props.form && this.props.form.scheduleType)) {
      if (this.props.request.request[QUARTZ_SCHEDULE]) {
        return QUARTZ_SCHEDULE;
      }
      return CRON_SCHEDULE;
    }
    if (this.props.form && this.props.form.scheduleType) {
      return this.props.form.scheduleType;
    }
    return CRON_SCHEDULE;
  }

  renderRequestTypeSelectors() {
    const tooltip = (
      <Tooltip id="cannotChangeRequestTypeAfterCreation">Option cannot be altered after creation</Tooltip>
    );
    const selectors = REQUEST_TYPES.map((requestType, key) => {
      const selector = (
        <button
          key={key}
          value={requestType}
          className={classNames('btn', 'btn-default', {active: this.getValue('requestType') === requestType})}
          onClick={event => this.updateTypeButtonClick(event)}
          disabled={this.getButtonsDisabled(requestType)}
        >
          {Utils.humanizeText(requestType)}
        </button>
      );
      if (this.isEditing() && requestType === this.getValue('requestType')) {
        return <OverlayTrigger placement="top" key={key} overlay={tooltip}>{selector}</OverlayTrigger>;
      }
      return selector;
    });
    return <div className="btn-group">{selectors}</div>;
  }

  renderRequestTypeSpecificFormFields() {
    const instances = (
      <TextFormGroup
        id="instances"
        onChange={event => this.updateField('instances', event.target.value)}
        value={this.getValue('instances')}
        label="Instances"
        placeholder="1"
        feedback={this.feedback('instances')}
        required={INDEXED_FIELDS.instances.required}
      />
    );
    const rackSensitive = (
      <CheckboxFormGroup
        id="rack-sensitive"
        label="Rack Sensitive"
        checked={this.getValue('rackSensitive') || false}
        onChange={(newValue) => this.updateField('rackSensitive', newValue)}
      />
    );
    const hideEvenNumberAcrossRacksHint = (
      <CheckboxFormGroup
        id="hide-distribute-evenly-across-racks-hint"
        label="Hide Distribute Evenly Across Racks Hint"
        checked={this.getValue('hideEvenNumberAcrossRacksHint') || false}
        onChange={(newValue) => this.updateField('hideEvenNumberAcrossRacksHint', newValue)}
      />
    );
    const loadBalanced = (
      <CheckboxFormGroup
        id="load-balanced"
        label="Load balanced"
        checked={this.getValue('loadBalanced') || false}
        onChange={(newValue) => this.updateField('loadBalanced', newValue)}
        disabled={this.isEditing() && true}
        hasTooltip={this.isEditing() && true}
        tooltipText="Option cannot be altered after creation"
      />
    );
    const waitAtLeastMillisAfterTaskFinishesForReschedule = (
      <TextFormGroup
        id="waitAtLeast"
        onChange={event => this.updateField('waitAtLeastMillisAfterTaskFinishesForReschedule', event.target.value)}
        value={this.getValue('waitAtLeastMillisAfterTaskFinishesForReschedule')}
        label="Task rescheduling delay"
        inputGroupAddon="milliseconds"
        required={INDEXED_FIELDS.waitAtLeastMillisAfterTaskFinishesForReschedule.required}
        feedback={this.feedback('waitAtLeastMillisAfterTaskFinishesForReschedule')}
      />
    );
    const rackOptions = _.pluck(this.props.racks, 'id').map(id => ({value: id, label: id}));
    const rackAffinity = (
      <div className="form-group">
        <label htmlFor="rack-affinity">Rack Affinity <span className="form-label-tip">choose any subset</span></label>
        <MultiSelect
          id="rack-affinity"
          onChange={ value => this.updateField('rackAffinity', value) }
          value={ this.getValue('rackAffinity') || [] }
          options={rackOptions}
          splits={[',', ' ']}
        />
      </div>
    );
    const scheduleFeedback = this.feedback(this.getScheduleType()).toLowerCase();
    const schedule = (
      <FormGroup
        id="schedule"
        className={INDEXED_FIELDS[this.getScheduleType()].required && 'required'}
        validationState={scheduleFeedback}>
        <ControlLabel>Schedule</ControlLabel>
          <Row>
            <Col md={7}>
              <FormControl
                onChange={(event) => this.updateField(this.getScheduleType(), event.target.value)}
                placeholder={this.getScheduleType() === QUARTZ_SCHEDULE ? 'eg: 0 */5 * * * ?' : 'eg: */5 * * * *'}
                type="text"
                value={this.getValue(this.getScheduleType())}
                feedback={this.feedback(this.getScheduleType())}
              />
              {scheduleFeedback && <FormControl.Feedback />}
            </Col>
            <Col md={5}>
              <Select
                onChange={value => this.updateField('scheduleType', value.value)}
                options={[
                  {
                    value: CRON_SCHEDULE,
                    label: 'Cron Schedule'
                  },
                  {
                    value: QUARTZ_SCHEDULE,
                    label: 'Quartz Schedule'
                  }
                ]}
                clearable={false}
                value={ this.getScheduleType() }
              />
            </Col>
          </Row>
      </FormGroup>
    );
    const numRetriesOnFailure = (
      <TextFormGroup
        id="retries-on-failure"
        onChange={event => this.updateField('numRetriesOnFailure', event.target.value)}
        value={this.getValue('numRetriesOnFailure')}
        label="Number of retries on failure"
        required={INDEXED_FIELDS.numRetriesOnFailure.required}
        feedback={this.feedback('numRetriesOnFailure')}
      />
    );
    const killOldNonLongRunningTasksAfterMillis = (
      <TextFormGroup
        id="killOldNRL"
        onChange={event => this.updateField('killOldNonLongRunningTasksAfterMillis', event.target.value)}
        value={this.getValue('killOldNonLongRunningTasksAfterMillis')}
        label="Kill cleaning task(s) after"
        inputGroupAddon="milliseconds"
        required={INDEXED_FIELDS.killOldNonLongRunningTasksAfterMillis.required}
        feedback={this.feedback('killOldNonLongRunningTasksAfterMillis')}
      />
    );
    const scheduledExpectedRuntimeMillis = (
      <TextFormGroup
        id="expected-runtime"
        onChange={event => this.updateField('scheduledExpectedRuntimeMillis', event.target.value)}
        value={this.getValue('scheduledExpectedRuntimeMillis')}
        label="Maximum task duration"
        inputGroupAddon="milliseconds"
        required={INDEXED_FIELDS.scheduledExpectedRuntimeMillis.required}
        feedback={this.feedback('scheduledExpectedRuntimeMillis')}
      />
    );
    return (
      <div>
        { this.shouldRenderField('instances') && instances }
        { this.shouldRenderField('rackSensitive') && rackSensitive }
        { this.shouldRenderField('hideEvenNumberAcrossRacksHint') && hideEvenNumberAcrossRacksHint }
        { this.shouldRenderField('loadBalanced') && loadBalanced }
        { this.shouldRenderField('waitAtLeastMillisAfterTaskFinishesForReschedule') && waitAtLeastMillisAfterTaskFinishesForReschedule }
        { this.shouldRenderField('rackAffinity') && rackAffinity }
        { (this.shouldRenderField(CRON_SCHEDULE) || this.shouldRenderField(QUARTZ_SCHEDULE)) && schedule }
        { this.shouldRenderField('numRetriesOnFailure') && numRetriesOnFailure }
        { this.shouldRenderField('killOldNonLongRunningTasksAfterMillis') && killOldNonLongRunningTasksAfterMillis }
        { this.shouldRenderField('scheduledExpectedRuntimeMillis') && scheduledExpectedRuntimeMillis }
      </div>
    );
  }

  render() {
    const requestId = this.isEditing() ? this.props.request.request.id : null;
    const header = (
      this.isEditing() ?
        <h3>
          Editing <Link to={`request/${requestId}`}>{requestId}</Link>
        </h3> :
        <h3>New Request</h3>
    );
    const id = (
      <TextFormGroup
        id="id"
        onChange={event => this.updateField('id', event.target.value)}
        value={this.getValue('id')}
        label="ID"
        required={INDEXED_FIELDS.id.required}
        placeholder="eg: my-awesome-request"
        feedback={this.feedback('id')}
      />
    );
    const owners = (
      <MultiInputFormGroup
        id="owners"
        value={this.getValue('owners') || []}
        onChange={(newValue) => this.updateField('owners', newValue)}
        label="Owners"
        required={INDEXED_FIELDS.owners.required}
        errorIndices={INDEXED_FIELDS.owners.required && _.isEmpty(this.getValue('owners')) && [0] || []}
        couldHaveFeedback={true}
      />
    );
    const requestTypeSelectors = (
      <div className="form-group">
        <label>Type</label>
        <div id="type" className="btn-group">
          {this.renderRequestTypeSelectors()}
        </div>
      </div>
    );
    const onlyAffectsNewTasksWarning = (
      <div className="alert alert-info alert-slim" role="alert">
        <strong>Note:</strong> changes made below will only affect new tasks
      </div>
    );
    const slavePlacement = (
      <SelectFormGroup
        id="slave-placement"
        label="Slave Placement"
        value={this.getValue('slavePlacement') || ''}
        defaultValue=""
        required={INDEXED_FIELDS.slavePlacement.required}
        onChange={newValue => this.updateField('slavePlacement', newValue.value)}
        options={[
          { label: 'Default', value: '' },
          { label: 'Separate', value: 'SEPARATE' },
          { label: 'Optimistic', value: 'OPTIMISTIC' },
          { label: 'Greedy', value: 'GREEDY' },
          { label: 'Separate by request', value: 'SEPARATE_BY_REQUEST'}
        ]}
      />
    );
    const saveButton = (
      <div id="button-row">
        <span>
          <button type="submit" className="btn btn-success btn-lg" disabled={this.cantSubmit() && 'disabled'}>
            Save
          </button>
        </span>
      </div>
    );
    const errorMessage = (
      this.props.saveApiCall.error &&
      <p className="alert alert-danger">
        There was a problem saving your request: {this.props.saveApiCall.error.message}
      </p> ||
      this.props.saveApiCall.data && this.props.saveApiCall.data.message &&
      <p className="alert alert-danger">
        There was a problem saving your request: {this.props.saveApiCall.data.message}
      </p>
    );
    return (
      <Row className="new-form">
        <Col md={5} mdOffset={3}>
          { header }
          <Form onSubmit={event => this.submitForm(event)}>
            { !this.isEditing() && id }
            { owners }
            { requestTypeSelectors }
            { this.isEditing() && onlyAffectsNewTasksWarning }
            { slavePlacement }
            { this.renderRequestTypeSpecificFormFields() }
            { saveButton }
            { errorMessage }
          </Form>
        </Col>
      </Row>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const request = ownProps.params.requestId && state.api.request[ownProps.params.requestId];
  return {
    racks: state.api.racks.data,
    request: request && request.data,
    form: state.ui.form[FORM_ID],
    saveApiCall: state.api.saveRequest
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    update(formId, fieldId, newValue) {
      dispatch(ModifyField(formId, fieldId, newValue));
    },
    clearForm(formId) {
      dispatch(ClearForm(formId));
    },
    save(requestBody) {
      dispatch(SaveRequest.trigger(requestBody)).then((response) => {
        if (response.type === 'SAVE_REQUEST_SUCCESS') {
          ownProps.router.push(`request/${response.data.request.id}`);
        }
      });
    },
    fetchRequest(requestId) {
      dispatch(FetchRequest.trigger(requestId));
    },
    fetchRacks() {
      dispatch(FetchRacks.trigger());
    },
    clearRequestData() {
      dispatch(FetchRequest.clearData());
    },
    clearSaveRequestData() {
      dispatch(SaveRequest.clearData());
    }
  };
}

function refresh(props) {
  const promises = [];

  promises.push(props.fetchRacks());
  if (props.params.requestId) {
    promises.push(props.fetchRequest(props.params.requestId));
  } else {
    promises.push(props.clearRequestData());
  }
  promises.push(props.clearSaveRequestData());

  return Promise.all(promises);
}

export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(rootComponent(RequestForm, 'New Request', refresh)));
