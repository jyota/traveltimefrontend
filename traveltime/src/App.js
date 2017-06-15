import React, { Component } from 'react';
import './App.css';
import Datetime from 'react-datetime';
import './react-datetime.css';
import PlacesAutocomplete from 'react-places-autocomplete';
import AlertContainer from 'react-alert';
import { Button, Checkbox, Col, FormControl, FormGroup, Form, Modal } from 'react-bootstrap';
var ReactGA = require('react-ga');
ReactGA.initialize('UA-101117431-1');
ReactGA.pageview('/index.html');

var moment = require('moment');

class App extends Component {
  render() {
    return (<div>
      <div class="page-header">
      <h1>Car Travel Time</h1>
      Have a flexible schedule? Minimize your time spent in the car going somewhere with this calculator.<br/>
      Allows for inclusion of return trip in total travel time calculation.
      </div>
      
      <br/><br/>
      <CalculateTimeFormComponent/>
      <br/><br/>
      By using this app you agree to <a href="license.html">its license</a>.</div>
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
      origToDestTime: "",
      destToOrigTime: "",
      trafficModel: "best_guess",
      startTime: moment(),
      numberOfOriginHours: 2,
      numberMinDestHours: 6,
      numberMaxDestHours: 8,
      jobStatus: "waiting_for_job",
      showResultModal: false,
      destOnly: false
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
      } else if(this.state.jobStatus === 'error_time_span'){
        errorText = "Error: Time span of origin begin/end and destination begin/end cannot exceed 8 hours, and origin/destination time spans cannot be less than zero.";
      } else if(this.state.jobStatus === 'error_input_structure_validation'){
        errorText = "Error: Invalid request input data." ;
      } else if(this.state.jobStatus === 'api_error_timezonelookup'){
        errorText = "Error: Could not get timezone from Google API for start location.";
      };
      var eventLabel = this.state.destOnly ? (this.state.jobStatus + ": one-way") : (this.state.jobStatus + ": roundtrip")
      ReactGA.event({
       category: 'User',
       action: 'Job error',
       label: eventLabel 
      });
      this.msg.error(errorText);
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.doThisMomentFormat = this.doThisMomentFormat.bind(this);
    this.originChange = (address) => this.setState({ originAddress: address });
    this.destChange = (address) => this.setState({ destAddress: address });
  }

  closeResultModal = () => {
    this.setState({ showResultModal: false })
  }

  openResultModal = () => {
    this.setState({ showResultModal: true })
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
    var url = 'http://traveltime-jobservice.integrated.pro/v1/status/'.concat(jobIdentifier) 
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
          var eventLabel = this.state.destOnly ? "One-way" : "Roundtrip"
          ReactGA.event({
            category: 'User',
            action: 'Successful request results returned',
            label: eventLabel
          });

          if(responseJson.result.requested.orig_to_dest_only === false){
            this.setState({ 
              travelTime: Math.round(responseJson.result.dest_to_orig_time) + Math.round(responseJson.result.orig_to_dest_time),
              origToDestTime: moment(responseJson.result.orig_to_dest).add(Math.round(responseJson.result.orig_to_dest_time), 'minutes').format("MM/DD/YYYY hh:mm A"),
              destToOrigTime: moment(responseJson.result.dest_to_orig).add(Math.round(responseJson.result.dest_to_orig_time), 'minutes').format("MM/DD/YYYY hh:mm A"),
              origToDestSummary: responseJson.result.orig_to_dest_summary,
              destToOrigSummary: responseJson.result.dest_to_orig_summary,
              origToDestTimeToLeave: moment(responseJson.result.orig_to_dest).format("MM/DD/YYYY hh:mm A"),
              destToOrigTimeToLeave: moment(responseJson.result.dest_to_orig).format("MM/DD/YYYY hh:mm A"),
              timeZone: responseJson.result.requested.tz_in.timeZoneName,
              jobStatus: "waiting_for_job"
             });
          }else{
            this.setState({ 
              travelTime: Math.round(responseJson.result.orig_to_dest_time),
              origToDestTime: moment(responseJson.result.orig_to_dest).add(Math.round(responseJson.result.orig_to_dest_time), 'minutes').format("MM/DD/YYYY hh:mm A"),
              origToDestSummary: responseJson.result.orig_to_dest_summary,
              origToDestTimeToLeave: moment(responseJson.result.orig_to_dest).format("MM/DD/YYYY hh:mm A"),
              timeZone: responseJson.result.requested.tz_in.timeZoneName,
              jobStatus: "waiting_for_job"
            });
          }
          this.openResultModal();
        }
      })
  }

  doFetchJobStatus = () => {    
    var eventLabel = this.state.destOnly ? "One-way" : "Roundtrip"
    ReactGA.event({
     category: 'User',
     action: 'Submitted request',
     label: eventLabel
    });

    if(this.state.jobStatus === 'waiting_for_job'){
      var url = 'http://traveltime-jobservice.integrated.pro/v1/run_task'
      var departEnd = moment(this.state.startTime);
      departEnd.add(this.state.numberOfOriginHours, 'hours');
      if(this.state.destOnly === false){
        var post_data = {
          "depart_start": this.doThisMomentFormat(this.state.startTime), 
          "depart_end": this.doThisMomentFormat(departEnd), 
          "depart_loc": this.state.originAddress, 
          "dest_loc": this.state.destAddress, 
          "min_mins_loc": this.state.numberMinDestHours * 60, 
          "max_mins_loc": this.state.numberMaxDestHours * 60, 
          "traffic_model": this.state.trafficModel,
          "orig_to_dest_only": this.state.destOnly
        }
      }else{
        var post_data = {
          "depart_start": this.doThisMomentFormat(this.state.startTime), 
          "depart_end": this.doThisMomentFormat(departEnd), 
          "depart_loc": this.state.originAddress, 
          "dest_loc": this.state.destAddress, 
          "traffic_model": this.state.trafficModel,
          "orig_to_dest_only": this.state.destOnly
        }
      }

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

  toggleDestCheckbox = () => {
    this.setState({ destOnly: !this.state.destOnly });
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
                         input: { width: '350px' }};
    const addrStylesNext = { root: { position: 'relative', zIndex: 998},
                         input: { width: '350px' }};

    const AutocompleteItem = ({ suggestion }) => (<div><i className="fa fa-map-marker"/>{suggestion}</div>);

    return(<div>
      <AlertContainer ref={a => this.msg = a} {...this.alertOptions} />
      <Form horizontal>
       <FormGroup controlId="formHorizontalDestOnly">
        <Col className="text-right" xs={4} md={2}>
          <b>Origin to destination estimate only: </b>
        </Col>
        <Col xs={8} md={10}>
        <Checkbox 
            value={this.state.destOnly}
            onChange={this.toggleDestCheckbox}></Checkbox>
        </Col>
       </FormGroup>
       <FormGroup controlId="formHorizontalOriginAddr">        
        <Col className="text-right" xs={4} md={2}>
          <b>Origin address</b>
        </Col>
        <Col xs={8} md={10}>
          <PlacesAutocomplete inputProps={originInputProps} styles={addrStyles} autocompleteItem={AutocompleteItem} />
        </Col>
       </FormGroup>
       <FormGroup controlId="formHorizontalDestAddr">
        <Col className="text-right" xs={4} md={2}>
          <b>Destination address</b>
        </Col>
        <Col xs={8} md={10}>
          <PlacesAutocomplete inputProps={destInputProps} styles={addrStylesNext} autocompleteItem={AutocompleteItem} />
        </Col>
       </FormGroup>
       <FormGroup controlId="formHorizontalTTL">
        <Col className="text-right" xs={4} md={2}>
          <b>Earliest time to leave origin</b>
        </Col>
        <Col xs={8} md={10}>
        <Datetime 
         input={false}
         inputProps={{name: "startTime"}}
         value={this.state.startTime} 
         onChange={this.handleDateInputChange} />
        </Col>
       </FormGroup>
       <FormGroup controlId="formHorizontalOriginFlex">
        <Col className="text-right" xs={4} md={2}>
          <b>Latest hours to leave after earliest time</b>
        </Col>
        <Col xs={8} md={10}>
          <input
            name="numberOfOriginHours"
            type="number"
            value={this.state.numberOfOriginHours}
            onChange={this.handleInputChange} />
        </Col>
        </FormGroup>
        {this.state.destOnly === false && 
          <div>
          <FormGroup controlId="formHorizontalMinDestHrs">
          <Col className="text-right" xs={4} md={2}>
          <b>Min. hours at destination</b>
          </Col>
          <Col xs={8} md={10}>
          <input
            name="numberMinDestHours"
            type="number"
            value={this.state.numberMinDestHours}
            onChange={this.handleInputChange} />
          </Col>
          </FormGroup>
          <FormGroup controlId="formHorizontalMaxDestHours">
          <Col className="text-right" xs={4} md={2}>
          <b>Max. hours at destination</b>
          </Col>
          <Col xs={8} md={10}>
          <input
            name="numberMaxDestHours"
            type="number"
            value={this.state.numberMaxDestHours}
            onChange={this.handleInputChange} />
          </Col>
          </FormGroup></div>
        }
        <FormGroup controlId="formHorizontalTrafficModel">
        <Col className="text-right" xs={4} md={2}>
          <b>Traffic model</b>
        </Col>
        <Col xs={8} md={10}>
          <FormControl style={{width: '150px'}} componentClass="select" placeholder="best_guess" name="trafficModel" value={this.state.trafficModel} onChange={this.handleInputChange}>
            <option value="best_guess">Best guess</option>
            <option value="optimistic">Optimistic</option>
            <option value="pessimistic">Pessimistic</option>
          </FormControl>
        </Col>
        </FormGroup>
        <FormGroup controlId="formHorizontalSubmission">
        <Col xsOffset={4} xs={4} md={2} mdOffset={2}>
        <Button 
             bsStyle="primary" 
             disabled={this.state.jobStatus !== "waiting_for_job"}
             onClick={this.state.jobStatus === "waiting_for_job" ? this.doFetchJobStatus : null}>
          {this.state.jobStatus === "waiting_for_job" ? "Run calculation" : "Running..."}
        </Button>
        </Col>
        </FormGroup>
      </Form>
      <Modal show={this.state.showResultModal} onHide={this.closeResultModal}>
          <Modal.Header closeButton>
            <Modal.Title>Calculated results</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <b>Timezone: </b> {this.state.timeZone}<br/>
            <b>Best time to leave from origin: </b> {this.state.origToDestTimeToLeave}<br/>
            {this.state.destOnly === false && 
             <div><b>Best time to return from destination: </b> {this.state.destToOrigTimeToLeave}<br/></div>
            }
            <b>Estimated {this.state.destOnly ? "trip" : "roundtrip"} travel time: </b> {this.state.travelTime} minutes<br/>
            <b>Origin to destination route: </b> {this.state.origToDestSummary}<br/>
            <b>Estimated arrival at destination: </b> {this.state.origToDestTime}<br/> 
            {this.state.destOnly === false && 
             <div><b>Destination to origin route: </b> {this.state.destToOrigSummary}<br/>
             <b>Estimated return arrival at origin: </b> {this.state.destToOrigTime}<br/></div>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeResultModal}>Close</Button>
          </Modal.Footer>
        </Modal>        
    </div>)    
  }

  render() {
      return this.renderNormal()
  }
}
