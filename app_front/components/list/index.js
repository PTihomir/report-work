import React, { PropTypes, Component } from 'react';

export default class ListEntries extends Component {
  static propTypes = {
    entries: PropTypes.array,
    isLoading: PropTypes.bool,
  };

  static defaultProps = {
    entries: [],
  };

  render() {
    const { entries, isLoading } = this.props;

    const lines = entries.map((entry) => (
      <li key={entry.date}>
        <span>{entry.date}</span>
        <span>{entry.hour}</span>
        <span>{entry.task.split(';').join(' - ')}</span>
      </li>
    ));

    return (
      <ul block="report-list">
        {isLoading ? 'Loading...' : lines}
      </ul>
    );
  }
}
