import './styles.scss';
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

import List from '../components/list';
import ReportForm from '../components/report-form';

export default class Root extends Component {
  static propTypes = {
    defaultMailto: PropTypes.string,
    documentUrl: PropTypes.string,
    entries: PropTypes.array,
    lastDate: PropTypes.string,
    messages: PropTypes.array,
    onSendEntries: PropTypes.func,
    serverStatus: PropTypes.string,
  }

  // constructor(props) {
  //   super(props);
  // }

  render() {
    const { documentUrl, defaultMailto, lastDate, entries, serverStatus, messages, onSendEntries } = this.props;

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
              {
                lastDate && defaultMailto
                ? (
                  <ReportForm
                    lastDate={moment(lastDate, 'MM/DD/YYYY').add(1, 'day').toDate()}
                    defaultMailto={defaultMailto}
                    onSend={onSendEntries}
                    />
                )
                : null
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
              className={`root__server-stats root__server-stats--${serverStatus}`} >
              <ul style={{ padding: 0 }}>
                {
                  messages && messages.map(({message, tstamp}, idx) => (
                    <li key={idx} style={{ display: 'block', textAlign: 'left' }}>
                      {moment(tstamp).format('LTS')}: {message}
                    </li>
                  ))
                }
              </ul>
            </Paper>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}
