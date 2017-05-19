import React, { Component } from 'react';
import './App.css';
import Datetime from 'react-datetime';
import './react-datetime.css';
var moment = require('moment');

class App extends Component {
  render() {
    return (<div>
      <h2>TravelTime</h2>
        <p>Starting time at origin: </p>
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
      travelTime: 0.0,
      startTime: new Date(),
      numberOfOriginHours: 2,
      numberMinDestHours: 6,
      numberMaxDestHours: 8
    };

    this.handleInputChange = this.handleInputChange.bind(this);
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
      startTime: dateValue.toDate()
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
          this.setState({ text: responseJson.status });
          setTimeout(() => { this.doPollJobStatus(jobIdentifier) }, 5000);
        }else{
          this.setState({ text: responseJson.status });
        }
      })
  }

  doFetchJobStatus = () => {    
    var url = 'http://localhost/v1/run_task'
    var post_data = {"depart_start": "2017-05-20T08:00:00", "depart_end": "2017-05-20T10:00:00", "depart_loc": "Shinjuku, Tokyo", "dest_loc": "Ueno Park, Tokyo", "min_mins_loc": 480, "max_mins_loc": 540, "traffic_model": "pessimistic", "timezone": "Japan"}
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
      return response.text();
     })
      .then((responseText) => {
        this.doPollJobStatus(responseText);        
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
        <button onClick={this.doFetchJobStatus}>Calculate</button>
      </form>
        <p><b>Calculated time: </b> {this.state.travelTime}</p>
        
    </div>
    )
  }
  render() {
      return this.renderNormal()
  }
}
