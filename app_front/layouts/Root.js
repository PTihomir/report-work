import React, { Component, PropTypes } from 'react';
import 'whatwg-fetch';
import moment from 'moment';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';

import FlatButton from 'material-ui/FlatButton';
import OpenIcon from 'material-ui/svg-icons/action/open-in-new';
import Paper from 'material-ui/Paper';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

import List from '#list';
import ReportForm from '#report-form';

import './styles.scss';

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
      <MuiThemeProvider>
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
                    lastDate={moment(lastDate, 'MM/DD/YYYY').toDate()}
                    defaultMailto={defaultMailto}
                    onSend={onSendEntries}
                    />
                )
              }
            </div>
          </div>
          <div className="root__stats">
            { documentUrl && (
              <FlatButton
                href={documentUrl}
                target="_blank"
                label="Open spreadsheet"
                secondary={true}
                icon={<OpenIcon />}
                />
              )}
            <Paper zDepth={2}
              style={{
                padding: 10,
                textAlign: 'center',
                display: 'inline-block',
              }}
              className={`root__server-stats root__server-stats--${serverStatus}`}>Server: {serverMessage}</Paper>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}
