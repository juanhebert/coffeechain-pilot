import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './components/Navbar';
import ActorView from './views/ActorView';
import TransformView from './views/TransformView';
import ShipView from './views/ShipView';
import 'fontsource-roboto';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Switch>
          <Route exact path="/" component={ActorView} />
          <Route exact path="/transform" component={TransformView} />
          <Route exact path="/ship" component={ShipView} />
          {/* <Route component={NotFound} /> */}
        </Switch>
      </div>
    </Router>
  );
}

export default App;
