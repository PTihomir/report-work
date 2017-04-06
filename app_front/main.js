import React from 'react';
import ReactDOM from 'react-dom';

import AppContainer from './container';

// ========================================================
// Render Setup
// ========================================================
const MOUNT_NODE = document.getElementById('root');

let render = (routerKey = null) => {
  ReactDOM.render(
    <AppContainer />,
    MOUNT_NODE
  );
};

// Enable HMR and catch runtime errors in RedBox
// This code is excluded from production bundle
if (__DEV__ && module.hot) {
  const renderApp = render;
  const renderError = (error) => {
    const RedBox = require('redbox-react').default;

    ReactDOM.render(<RedBox error={error} />, MOUNT_NODE);
  };
  render = () => {
    try {
      renderApp(Math.random());
    } catch (error) {
      renderError(error);
    }
  };
  module.hot.accept(['./container'], () => render());
}

// ========================================================
// Go!
// ========================================================
render();
