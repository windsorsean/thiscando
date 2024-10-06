import React from 'react';

const MessageDisplay = ({ message }) => {
  if (!message) return null;

  return React.createElement(
    'div',
    {
      className: `mt-2 p-1 text-sm ${
        message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      }`
    },
    React.createElement(
      'strong',
      null,
      message.type === 'error' ? 'Error: ' : 'Success: '
    ),
    message.text
  );
};

export default MessageDisplay;