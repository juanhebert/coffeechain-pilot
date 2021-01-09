import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './components/Navbar';
import ActorView from './views/ActorView';
import 'fontsource-roboto';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Switch>
          <Route exact path="/" component={ActorView} />
          {/* <Route component={NotFound} /> */}
        </Switch>
      </div>
    </Router>
  );
}

export default App;
