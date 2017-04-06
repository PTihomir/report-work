import React, {Component} from 'react';
import 'whatwg-fetch';

import Root from '../layouts/Root';

const SERVER_STATUS = {
  checking: 'checking',
  down: 'down',
  ok: 'ok',
};

export default class MainContainer extends Component {

  constructor(props) {
    super(props);

    this.state = {
      settingsHash: 0,
      historyHash: 0,
      messagesHash: 0,
      serverStatus: SERVER_STATUS.checking,
    };

    this.handleSendEntries = this.handleSendEntries.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();

    this.interval = setInterval(() => {
      this.fetchStatus(true);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchStatus(force) {
    const { settingsHash, historyHash, messagesHash } = this.state;

    fetch(`http://localhost:3111/app/status?settings=${settingsHash}&history=${historyHash}&messages=${messagesHash}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      const newState = {
        serverUnreachable: false,
        serverStatus: SERVER_STATUS.ok,
      };

      if (data.settings) {
        newState.settingsHash = data.settingsHash;
        newState.defaultMailto = data.settings.defaultMailto;
        newState.lastDate = data.settings.lastDate;
        newState.documentUrl = data.settings.documentUrl;
      }

      if (data.history) {
        newState.historyHash = data.historyHash;
        newState.entries = data.history;
      }

      if (data.messages) {
        newState.messagesHash = data.messagesHash;
        newState.messages = data.messages;
      }

      this.setState(newState);
    })
    .catch((error) => {
      console.error(error);
      this.setState({
        serverUnreachable: true,
        serverStatus: SERVER_STATUS.down,
      });
    });
  }

  handleSendEntries(data) {
    fetch('http://localhost:3111/app/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      this.setState({
        serverStatus: SERVER_STATUS.ok,
      });
      console.log(data);
    })
    .catch((error) => {
      this.setState({
        serverStatus: SERVER_STATUS.down,
      });
      console.error(error);
    });
  }

  render() {
    const { documentUrl, defaultMailto, lastDate, entries, serverStatus, messages } = this.state;

    return (
      <Root
        defaultMailto={defaultMailto}
        documentUrl={documentUrl}
        entries={entries}
        lastDate={lastDate}
        onSendEntries={this.handleSendEntries}
        messages={messages}
        serverStatus={serverStatus}
        />
    );
  }
}
