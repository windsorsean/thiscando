import React from 'react';

const HandlerItem = ({ handler, isActive, isLoading, onLoad, onDelete }) => {
  return React.createElement(
    'li',
    {
      className: `flex justify-between items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
    },
    React.createElement(
      'span',
      {
        className: "cursor-pointer flex-grow flex items-center",
        onClick: () => onLoad(handler)
      },
      isLoading && React.createElement('span', { className: "mr-2 animate-spin" }, "↻"),
      handler
    ),
    React.createElement(
      'button',
      {
        onClick: (e) => {
          e.stopPropagation();
          onDelete(handler);
        },
        className: "text-red-500 hover:text-red-700"
      },
      "×"
    )
  );
};

export default HandlerItem;