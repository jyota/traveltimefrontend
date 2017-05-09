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
    var that = this;
    var url = 'http://localhost/v1/status/78509567-9bfd-4b92-8a95-6f22fbb4f3c4'

    fetch(url)
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      that.setState({ text: data.result.status });
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
