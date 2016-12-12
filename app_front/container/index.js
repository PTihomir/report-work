import React, {Component} from 'react';
import 'whatwg-fetch';

import Root from '../layouts/Root';

const SERVER_STATUS = {
  checking: 'checking',
  down: 'down',
  ok: 'ok',
};

const SERVER_MESSAGE = {
  checking: 'Checking',
  down: 'Server down',
  up: 'Server working',
  sending: 'Sending mails',
  ok: 'Sending mails OK',
  fail: 'Sending mails FAIL',
};

export default class MainContainer extends Component {

  constructor(props) {
    super(props);

    this.state = {
      serverStatus: SERVER_STATUS.checking,
    };

    this.handleSendEntries = this.handleSendEntries.bind(this);

    this.fetchInit();
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.fetchStatus(true);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchStatus(force) {
    fetch('http://localhost:3111/app/status?force=yes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force: force ? 'yes' : 'no',
      }),
    })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      this.setState({
        serverUnreachable: false,
        serverStatus: data.status ? SERVER_STATUS.ok : SERVER_STATUS.down,
        // serverMessage: data.status ? SERVER_MESSAGE.up : SERVER_MESSAGE.down,
        entries: data.rows.reverse(),
      });

      // If init was errored, then call fetchInit too
      if (!this.state.initDone) {
        this.fetchInit();
      }
    })
    .catch((error) => {
      console.error(error);
      this.setState({
        serverUnreachable: true,
        serverStatus: SERVER_STATUS.down,
        serverMessage: SERVER_MESSAGE.down,
      });
    });
  }

  fetchInit() {
    fetch('http://localhost:3111/app/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      this.setState(data);
      this.setState({
        initDone: true,
        serverUnreachable: false,
        serverStatus: SERVER_STATUS.ok,
        serverMessage: SERVER_MESSAGE.up,
      });
    })
    .catch((error) => {
      console.error(error);
      this.setState({
        serverUnreachable: true,
        serverStatus: SERVER_STATUS.down,
        serverMessage: SERVER_MESSAGE.down,
      });
    });
  }

  handleSendEntries(data) {
    this.setState({
      serverMessage: SERVER_MESSAGE.sending,
    });
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
        serverMessage: SERVER_MESSAGE.ok,
      });
      console.log(data);
    })
    .catch((error) => {
      this.setState({
        serverMessage: SERVER_MESSAGE.fail,
        serverStatus: SERVER_STATUS.down,
      });
      console.error(error);
    });
  }

  render() {
    const { documentUrl, defaultMailto, lastDate, entries, serverStatus, serverMessage } = this.state;

    if (!lastDate || !defaultMailto) {
      return null;
    }

    return (
      <Root
        defaultMailto={defaultMailto}
        documentUrl={documentUrl}
        entries={entries}
        lastDate={lastDate}
        onSendEntries={this.handleSendEntries}
        serverMessage={serverMessage}
        serverStatus={serverStatus}
        />
    );
  }
}
