import React, { createContext, useState } from 'react';

const LoginContext = createContext();

const LoginContextProvider = ({ children }) => {
  const state = useState();
  return <LoginContext.Provider value={state}>{children}</LoginContext.Provider>;
};

const useLogin = () => {
  const loginState = React.useContext(LoginContext);
  if (loginState === undefined) {
    throw new Error('useLogin must be used within a LoginContextProvider');
  }
  return loginState;
};

export { LoginContextProvider, useLogin };
