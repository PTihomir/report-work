import React, { PropTypes, Component } from 'react';
import moment from 'moment';

import ReportEntry from '#report-form-line';

export default class ListEntries extends Component {
  static propTypes = {
    defaultMailto: PropTypes.string,
    lastDate: PropTypes.object,
    onSend: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      index: 0,
      entries: [],
    };

    this.handleEntryChange = this.handleEntryChange.bind(this);
    this.handleRemoveEntry = this.handleRemoveEntry.bind(this);
    this.handleNewEntry = this.handleNewEntry.bind(this);
    this.handleSending = this.handleSending.bind(this);
    this.refEmailInput = this.refEmailInput.bind(this);
  }

  componentWillMount() {
    this.handleNewEntry();
  }

  validateEntry(e) {
    if (Number.isNaN(e.hour) || !e.task || e.task.trim().length === 0) {
      e.error = true;
    } else if (e.error) {
      delete e.error;
    }
    return e;
  }

  handleEntryChange(data) {
    const newEntries = this.state.entries.map((entry) => {
      if (entry.id === data.id) {
        return this.validateEntry(Object.assign({}, entry, data));
      }
      return entry;
    });

    this.setState({
      entries: newEntries,
    });
  }

  handleRemoveEntry(id) {
    const newEntries = this.state.entries.map((entry) => {
      if (entry.id === id) {
        return;
      }
      return entry;
    }).filter((e) => typeof e !== 'undefined');

    this.setState({
      entries: newEntries,
    });
  }

  handleNewEntry() {
    const entries = this.state.entries;
    const newIndex = this.state.index + 1;

    const lastDate = entries.length && entries[entries.length - 1].date;

    const nextDate = lastDate ? moment(lastDate).add(1, 'd') : moment(this.props.lastDate);

    const newEntry = {
      id: newIndex,
      date: nextDate,
      hour: 8,
      task: undefined,
      onChange: this.handleEntryChange,
      onRemove: this.handleRemoveEntry,
    };

    this.setState({
      index: newIndex,
      entries: [...this.state.entries, newEntry],
    });
  }

  handleSending() {
    const isInvalid = this.state.entries
      .map(this.validateEntry)
      .some((e) => e.error);

    if (isInvalid) {
      return;
    }

    const entries = {};

    this.state.entries.map((e) => ({
      date: e.date.format('MM/DD/YYYY'),
      hour: e.hour,
      task: e.task.split(';'),
    })).forEach((e) => {
      entries[e.date] = e;
    });

    const preparedEntries = Object.keys(entries).map((key) => entries[key]);

    this.props.onSend({
      mailTo: this.email.value,
      entries: preparedEntries,
    });
  }

  refEmailInput(inputNode) {
    this.email = inputNode;
  }

  render() {
    const { defaultMailto } = this.props;

    return (
      <form block="report-form">
        <div>
          <h3>New entries</h3>
          <button
            type="button"
            disabled={this.state.entries.map(this.validateEntry).some((e) => e.error)}
            onClick={this.handleSending}>
            Send
          </button>
        </div>
        <div>
          <input type="email" defaultValue={defaultMailto} ref={this.refEmailInput} placeholder="mail:to" />
        </div>
        {this.state.entries.map((e) => (
          <ReportEntry {...e} key={e.id} />
        ))}
        <button type="button" onClick={this.handleNewEntry}>
          New entry
        </button>
      </form>
    );
  }
}
