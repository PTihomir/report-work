import React, { Component, PropTypes } from 'react';
import 'whatwg-fetch';
import moment from 'moment';

import List from '#list';
import ReportForm from '#report-form';

export default class Root extends Component {
  static propTypes = {
    defaultMailto: PropTypes.string.isRequired,
    documentUrl: PropTypes.string,
    entries: PropTypes.array,
    lastDate: PropTypes.string.isRequired,
    onSendEntries: PropTypes.func,
    serverMessage: PropTypes.string,
    serverStatus: PropTypes.string,
  }

  // constructor(props) {
  //   super(props);
  // }

  render() {
    const { documentUrl, defaultMailto, lastDate, entries, serverStatus, serverMessage, onSendEntries } = this.props;

    return (
      <div className="root">
        <div className="root__main">
          <div className="root__left-pane">
            { entries &&
              (
                <List
                  isLoading={false}
                  entries={entries}
                  />
              )
            }
          </div>
          <div className="root__right-pane">
            { lastDate &&
              (
                <ReportForm
                  lastDate={moment(lastDate, 'MM/DD/YYYY')}
                  defaultMailto={defaultMailto}
                  onSend={onSendEntries}
                  />
              )
            }
          </div>
        </div>
        <div className="root__stats">
          <p>
            <span>Server status: {serverStatus}</span>
            <span>Server message: {serverMessage}</span>
          </p>
          <p>
            { documentUrl && (<a target="_blank" href={documentUrl}>Go to Google Drive document...</a>) }
          </p>
        </div>
      </div>
    );
  }
}
