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
      console.log(`Status(forced:${force})`, data);

      this.setState({
        serverUnreachable: false,
        serverStatus: data.status ? 'OK' : 'Error',
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
      });
    })
    .catch((error) => {
      console.error(error);
      this.setState({
        serverUnreachable: true,
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
      console.log(response);
      return response.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
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
