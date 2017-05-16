import React, { Component } from 'react';
import './App.css';
import Datetime from 'react-datetime';
import './react-datetime.css';

class App extends Component {
  render() {
    return (<div>
      <h2>TravelTime</h2>
        <table>
        <tr>
        <td><p>Starting time at origin: <Datetime className="startTime" /></p></td>
        <td><p>Arrival time at destination: <Datetime className="endTime" /></p></td>
        </tr>
        </table>

      <CalculatedTimeComponent/></div>
    );
  }
}

export default App;


class CalculatedTimeComponent extends React.Component{
  constructor(){
    super();
    this.state = {
      text: '0',
    };
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
        <p><b>Calculated time: </b> {this.state.text}</p>
        <button onClick={this.doFetchJobStatus}>Calculate</button>
    </div>
    )
  }
  render() {
      return this.renderNormal()
  }
}
