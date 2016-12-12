import React, { PureComponent, PropTypes } from 'react';

import DatePicker from 'material-ui/DatePicker';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';
import RemoveCircleIcon from 'material-ui/svg-icons/content/remove-circle';

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

  handleChange(e, value) {
    const newState = {
      id: this.props.id,
      date: this.props.date,
      hour: this.props.hour,
      task: this.props.task,
    };

    if (e === null && value) {
      newState.date = value;
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
      <div block="report-form-line">
        <DatePicker
          style={{marginRight: 10}}
          textFieldStyle={{width: 100}}
          name="date"
          autoOk={true}
          value={this.props.date}
          onChange={this.handleChange}
          firstDayOfWeek={1}
          />
        <TextField type="number"
          style={{width: 50, marginRight: 10}}
          name="hour"
          min="0" max="18" size="2"
          placeholder="8"
          value={this.props.hour}
          onChange={this.handleChange}
          />
        <TextField type="text"
          name="task"
          placeholder="Define tasks"
          /* value={this.props.task} */
          onChange={this.handleChange}
          />
        <IconButton onClick={this.handleRemove}>
          <RemoveCircleIcon style={{color: '#CC8888'}} />
        </IconButton>
      </div>
    );
  }
}
