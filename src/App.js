import React, { Component } from 'react';
import Graph from './Graph';
// import logo from './logo.svg';
import './css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Esercizio reti store and forward</h1>
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
        </header>
        {/* <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p> */}
        <Graph className="fullPage"/>
      </div>
    );
  }
}

export default App;
