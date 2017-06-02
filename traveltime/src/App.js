import React, { Component } from 'react';
import './App.css';
import Datetime from 'react-datetime';
import './react-datetime.css';
import PlacesAutocomplete from 'react-places-autocomplete'
import AlertContainer from 'react-alert'

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
      originAddress: "",
      destAddress: "",
      origToDestSummary: "",
      destToOrigSummary: "",
      origToDestTimeToLeave: "",
      destToOrigTimeToLeave: "",
      timeZone: "",
      travelTime: 0.0,
      startTime: moment(),
      numberOfOriginHours: 2,
      numberMinDestHours: 6,
      numberMaxDestHours: 8,
      jobStatus: "waiting_for_job"
    };

    this.alertOptions = {
      offset: 14,
      position: 'top left',
      theme: 'light',
      time: 5000,
      transition: 'scale'
    };
 
    this.showErrorAlert = () => {
      var errorText = "Error: Unknown error with request.";
      if(this.state.jobStatus === 'api_error_departure_in_the_past'){
        errorText = "Error: departure time cannot be in the past";
      } else if(this.state.jobStatus === 'api_error_unknown'){
        errorText = "Error: Google maps API error. Quota may be maxed for the day. Try back again later.";
      } else if(['error_input_structure_validation', 'error_diff_mins_negative', 'error_diff_mins_more_than_4hrs'].indexOf(this.state.jobStatus) > -1){
        errorText = "Error: Invalid request input data." 
      };
      this.msg.error(errorText);
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.doThisMomentFormat = this.doThisMomentFormat.bind(this);
    this.originChange = (address) => this.setState({ originAddress: address });
    this.destChange = (address) => this.setState({ destAddress: address });
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
            setTimeout(() => { this.doPollJobStatus(jobIdentifier) }, 5000);
          }else{
            this.showErrorAlert();
            this.setState({jobStatus: "waiting_for_job"});
          }
        }
        return response.json();
      })
      .then((responseJson) => {
        if(responseJson.status.indexOf('error') !== -1){
          this.setState({jobStatus: responseJson.status});
          this.showErrorAlert();
          this.setState({jobStatus: "waiting_for_job"});
        }else if(responseJson.status !== 'complete'){
          this.setState({jobStatus: responseJson.status});
          setTimeout(() => { this.doPollJobStatus(jobIdentifier) }, 5000);
        }else{
          this.setState({ 
            travelTime: responseJson.result.est_travel_time_mins,
            origToDestSummary: responseJson.result.orig_to_dest_summary,
            destToOrigSummary: responseJson.result.dest_to_orig_summary,
            origToDestTimeToLeave: moment(responseJson.result.orig_to_dest).format("MM/DD/YYYY hh:mm A"),
            destToOrigTimeToLeave: moment(responseJson.result.dest_to_orig).format("MM/DD/YYYY hh:mm A"),
            timeZone: responseJson.result.requested.tz_in,
            jobStatus: "waiting_for_job"
           });
        }
      })
  }

  doFetchJobStatus = () => {    
    if(this.state.jobStatus === 'waiting_for_job'){
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
            this.showErrorAlert();
            this.setState({jobStatus: "waiting_for_job"});
            throw new Error("Bad response from server");
        }
        return response.json();
       })
        .then((responseJson) => {
          if(responseJson['job_id']){
            this.doPollJobStatus(responseJson['job_id']);
          }else{
            this.setState({jobStatus: responseJson['status']});
            this.showErrorAlert();
            this.setState({jobStatus: "waiting_for_job"});
            throw new Error("Empty job_id returned from job submission endpoint")
          }
       });
    }
  }

  renderNormal() {
    const originInputProps = {
      value: this.state.originAddress,
      onChange: this.originChange
    }

    const destInputProps = {
      value: this.state.destAddress,
      onChange: this.destChange
    }

    const addrStyles = { root: { position: 'relative', zIndex: 999},
                         input: { width: '50%' }};
    const addrStylesNext = { root: { position: 'relative', zIndex: 998},
                         input: { width: '50%' }};

    const AutocompleteItem = ({ suggestion }) => (<div><i className="fa fa-map-marker"/>{suggestion}</div>);

    return (
      <div>
      <AlertContainer ref={a => this.msg = a} {...this.alertOptions} />
      <form>
        <label>
          Origin address:
          <PlacesAutocomplete inputProps={originInputProps} styles={addrStyles} autocompleteItem={AutocompleteItem} />
        </label>
        <br/>
        <label>
          Destination address:
          <PlacesAutocomplete inputProps={destInputProps} styles={addrStylesNext} autocompleteItem={AutocompleteItem} />
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
        <b>Job status: </b> {this.state.jobStatus}<br/>
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
