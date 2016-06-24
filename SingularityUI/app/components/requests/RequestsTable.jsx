import React, { Component, PropTypes } from 'react';

import UITable from '../common/table/UITable';
import { RequestId, Type, LastDeploy, DeployUser, State } from './Columns';

class RequestsTable extends Component {
  static propTypes = {
    requests: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      sortBy: 'requestId',
      sortDirection: UITable.SortDirection.ASC
    };
  }

  render() {
    return (
      <UITable
        data={this.props.requests}
        keyGetter={(r) => r.request.id}
        asyncSort={true}
        paginated={false}
      >
        {RequestId}
        {Type}
        {LastDeploy}
        {DeployUser}
        {State}
      </UITable>
    );
  }
}

export default RequestsTable;
