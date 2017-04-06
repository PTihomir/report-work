import './styles.scss';
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

    const lines = entries.filter((entry) => typeof entry.task === 'string')
      .map((entry) => (
        <div block="report-list" elem="line" key={entry.date}>
          <div block="report-list" elem="times">
            <div block="report-list" elem="date">{entry.date}</div>
            <div block="report-list" elem="hour">{entry.hour} h</div>
          </div>
          <div block="report-list" elem="tasks">
            {entry.task.split(';').map((task, idx) => (
              <Chip key={idx} className="report-list__task" style={{margin: 2}}>
                {task}
              </Chip>
            ))}
          </div>
        </div>
      ));

    return (
      <div block="report-list">
        <div block="report-list" elem="line" mods={{header: true}}>
          <div>Previous reports</div>
        </div>
        {lines}
      </div>
    );
  }
}
