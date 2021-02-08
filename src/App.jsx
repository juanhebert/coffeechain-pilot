import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { LoginContextProvider } from './LoginContext';
import Navbar from './components/Navbar';
import ActorView from './views/ActorView';
import TransformView from './views/TransformView';
import ShipView from './views/ShipView';
import SellView from './views/SellView';
import CertifyView from './views/CertifyView';
import ObserveView from './views/ObserveView';
import EventList from './views/EventList';
import EventView from './views/EventView';
import AddEvidenceView from './views/AddEvidenceView';
import 'fontsource-roboto';
import './App.css';

function App() {
  return (
    <LoginContextProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Switch>
            <Route exact path="/" component={ActorView} />
            <Route exact path="/transform" component={TransformView} />
            <Route exact path="/ship" component={ShipView} />
            <Route exact path="/sell" component={SellView} />
            <Route exact path="/certify" component={CertifyView} />
            <Route exact path="/observe" component={ObserveView} />
            <Route exact path="/events" component={EventList} />
            <Route exact path="/events/:eventType/:eventId" component={EventView} />
            <Route exact path="/evidence/:eventType/:eventId" component={AddEvidenceView} />
            {/* <Route component={NotFound} /> */}
          </Switch>
        </div>
      </Router>
    </LoginContextProvider>
  );
}

export default App;
