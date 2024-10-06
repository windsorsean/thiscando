import React from 'react';

const AuthenticationForm = ({ authCode, setAuthCode, authenticate, isAuthenticating, message }) => {
  return React.createElement(
    'div',
    { className: 'p-4' },
    React.createElement('input', {
      type: 'password',
      value: authCode,
      onChange: (e) => setAuthCode(e.target.value),
      placeholder: 'Enter auth code',
      className: 'border p-2 mr-2',
      disabled: isAuthenticating
    }),
    React.createElement(
      'button',
      {
        onClick: authenticate,
        className: `bg-blue-500 text-white p-2 ${
          isAuthenticating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
        }`,
        disabled: isAuthenticating
      },
      isAuthenticating ? 'Authenticating...' : 'Authenticate'
    ),
    message &&
      React.createElement(
        'div',
        {
          className: `p-2 mt-4 ${
            message.type === 'error' ? 'bg-red-100' : 'bg-green-100'
          }`
        },
        React.createElement('strong', null, message.type === 'error' ? 'Error: ' : 'Success: '),
        message.text
      )
  );
};

export default AuthenticationForm;