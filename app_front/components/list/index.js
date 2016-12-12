import React, { PropTypes, Component } from 'react';
import Chip from 'material-ui/Chip';

export default class ListEntries extends Component {
  static propTypes = {
    entries: PropTypes.array,
  };

  static defaultProps = {
    entries: [],
  };

  render() {
    const { entries } = this.props;

    const lines = entries.map((entry) => (
      <div block="report-list" elem="line" key={entry.date}>
        <div block="report-list" elem="times">
          <div block="report-list" elem="date">{entry.date}</div>
          <div block="report-list" elem="hour">{entry.hour} h</div>
        </div>
        <div block="report-list" elem="tasks">
          {entry.task.split(';').map((task, idx) => (
            <Chip key={idx} style={{margin: 4}}>
              {task}
            </Chip>
          ))}
        </div>
      </div>
    ));

    return (
      <div block="report-list">
        <div block="report-list" elem="line" mods={{header: true}}>
          <div block="report-list" elem="times">Date and workhour</div>
          <div block="report-list" elem="tasks">Tasks</div>
        </div>
        {lines}
      </div>
    );
  }
}
