import React, { Component } from 'react';
import './App.css';
import Datetime from 'react-datetime';
import './react-datetime.css';
var moment = require('moment');

class App extends Component {
  render() {
    return (<div>
      <h2>TravelTime</h2>
      <CalculateTimeFormComponent/></div>
    );
  }
}


export default App;

class CalculateTimeFormComponent extends React.Component{
  constructor(){
    super();
    this.state = {
      originAddress: "16403 25th Ave SE, Bothell, WA 98012",
      destAddress: "2600 116th Ave NE, Bellevue, WA 98004",
      origToDestSummary: "",
      destToOrigSummary: "",
      origToDestTimeToLeave: "",
      destToOrigTimeToLeave: "",
      timeZone: "",
      travelTime: 0.0,
      startTime: moment(),
      numberOfOriginHours: 2,
      numberMinDestHours: 6,
      numberMaxDestHours: 8
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.doThisMomentFormat = this.doThisMomentFormat.bind(this);
  }

  doThisMomentFormat(thisMoment){
    return thisMoment.format("YYYY-MM-DD HH:mm")
  }

  handleInputChange(event){
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleDateInputChange = (dateValue) => {
    this.setState({
      startTime: moment(dateValue)
    });
  }

  doPollJobStatus = (jobIdentifier) => {
    var url = 'http://localhost/v1/status/'.concat(jobIdentifier) 
    fetch(url,
      {
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "GET"
      })
      .then((response) => {
        if(response.status >= 400) {
          if(response.status === 502){
            console.log("502, retrying...");
            setTimeout(() => { this.doPollJobStatus(jobIdentifier) }, 5000);
          }
        }
        return response.json();
      })
      .then((responseJson) => {
        if(responseJson.status !== 'complete'){
          setTimeout(() => { this.doPollJobStatus(jobIdentifier) }, 5000);
        }else{
          this.setState({ 
            travelTime: responseJson.result.est_travel_time_mins,
            origToDestSummary: responseJson.result.orig_to_dest_summary,
            destToOrigSummary: responseJson.result.dest_to_orig_summary,
            origToDestTimeToLeave: moment(responseJson.result.orig_to_dest).format("MM/DD/YYYY hh:mm A"),
            destToOrigTimeToLeave: moment(responseJson.result.dest_to_orig).format("MM/DD/YYYY hh:mm A"),
            timeZone: responseJson.result.requested.tz_in
           });
        }
      })
  }

  doFetchJobStatus = () => {    
    var url = 'http://localhost/v1/run_task'
    var departEnd = moment(this.state.startTime);
    departEnd.add(this.state.numberOfOriginHours, 'hours');
    var post_data = {
      "depart_start": this.doThisMomentFormat(this.state.startTime), 
      "depart_end": this.doThisMomentFormat(departEnd), 
      "depart_loc": this.state.originAddress, 
      "dest_loc": this.state.destAddress, 
      "min_mins_loc": this.state.numberMinDestHours * 60, 
      "max_mins_loc": this.state.numberMaxDestHours * 60, 
      "traffic_model": "pessimistic", 
      "timezone": "America/Los_Angeles"}
    fetch(url,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(post_data)
      })
      .then((response) => {
        if (response.status >= 400) {
          throw new Error("Bad response from server");
      }
      return response.json();
     })
      .then((responseJson) => {
        if(responseJson['job_id']){
          this.doPollJobStatus(responseJson['job_id']);
        }else{
          throw new Error("Empty job_id returned from job submission endpoint")
        }        
     });
  }

  renderNormal() {
    return (
      <div>
      <form>
        <label>
          Origin address:
          <input
            name="originAddress"
            type="text"
            size="100"
            value={this.state.originAddress}
            onChange={this.handleInputChange} />
        </label>
        <br/>
        <label>
          Destination address:
          <input
            name="destAddress"
            type="text"
            size="100"
            value={this.state.destAddress}
            onChange={this.handleInputChange} />
        </label>
        <br/>
        <label>
        Earliest time to leave origin:
        <Datetime 
         inputProps={{name: "startTime"}}
         value={this.state.startTime} 
         onChange={this.handleDateInputChange} />
        </label>
        <br/>
        <label>
          Number of hours beyond start that can leave:
          <input
            name="numberOfOriginHours"
            type="number"
            value={this.state.numberOfOriginHours}
            onChange={this.handleInputChange} />
        </label>
        <br/>
        <label>
          Minimum hours at destination:
          <input
            name="numberMinDestHours"
            type="number"
            value={this.state.numberMinDestHours}
            onChange={this.handleInputChange} />
        </label>
        <br/>
        <label>
          Maximum hours at destination:
          <input
            name="numberMaxDestHours"
            type="number"
            value={this.state.numberMaxDestHours}
            onChange={this.handleInputChange} />
        </label>
        <br/>
      </form>
        <button onClick={this.doFetchJobStatus}>Calculate</button>
        <p>
        <b>Timezone: </b> {this.state.timeZone}<br/>
        <b>Time to leave origin: </b> {this.state.origToDestTimeToLeave}<br/>
        <b>Time to leave destination: </b> {this.state.destToOrigTimeToLeave}<br/>
        <b>Estimated roundtrip travel time: </b> {Math.round(this.state.travelTime)} minutes<br/>
        <b>Origin to destination route summary: </b> {this.state.origToDestSummary}<br/>
        <b>Destination to origin route summary: </b> {this.state.destToOrigSummary}</p>
        
    </div>
    )
  }
  render() {
      return this.renderNormal()
  }
}
