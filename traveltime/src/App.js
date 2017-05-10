import React, { Component } from 'react';
import './App.css';

class App extends Component {
  render() {
    return (<div>
      <h2>TravelTime</h2>
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

  doFetchJobStatus = () => {    
    var url = 'http://localhost/v1/run_task'
    var post_data = {"depart_start": "2017-03-02T08:00:00", "depart_end": "2017-03-02T10:00:00", "depart_loc": "Shinjuku, Tokyo", "dest_loc": "Ueno Park, Tokyo", "min_mins_loc": 480, "max_mins_loc": 540, "traffic_model": "pessimistic", "timezone": "Japan"}
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
        console.log(responseText)
        this.setState({ text: responseText });
        
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
