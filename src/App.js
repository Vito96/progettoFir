import React, { Component } from 'react';
import Graph from './Graph';
import './css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Esercizio reti store and forward</h1>
        </header>
        <Graph className="fullPage"/>
      </div>
    );
  }
}

export default App;
