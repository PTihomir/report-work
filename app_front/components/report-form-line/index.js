import React, { PureComponent, PropTypes } from 'react';
import moment from 'moment';
// import 'moment/locale/en-gb';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default class ReportEntry extends PureComponent {
  static propTypes = {
    date: PropTypes.object,
    hour: PropTypes.number,
    id: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    task: PropTypes.string,
  };

  constructor(props) {
    super(props);

    console.log(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  handleChange(e) {
    const newState = {
      id: this.props.id,
      date: this.props.date,
      hour: this.props.hour,
      task: this.props.task,
    };

    if (moment.isMoment(e)) {
      newState.date = e;
    } else if (e.target.name === 'hour') {
      newState.hour = parseInt(e.target.value);
    } else if (e.target.name === 'task') {
      newState.task = e.target.value;
    }

    this.props.onChange(newState);
  }

  handleRemove(e) {
    this.props.onRemove(this.props.id);
  }

  render() {
    return (
      <div block="report-form" elem="line">
        <DatePicker
          todayButton={'Today'}
          selected={this.props.date}
          onChange={this.handleChange}
          weekStart="1"
          />
        <input type="number"
          name="hour"
          min="0" max="18" size="2"
          placeholder="8"
          value={this.props.hour}
          onChange={this.handleChange}
          />
        <input type="text"
          name="task"
          placeholder="Define tasks"
          /*value={this.props.task}*/
          onChange={this.handleChange}
          />
        <button type="button" onClick={this.handleRemove}>Remove</button>
      </div>
    );
  }
}
