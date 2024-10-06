import React from 'react';
import HandlerList from './HandlerList.js';

const Sidebar = ({
  isOpen,
  onToggle,
  handlers,
  currentHandler,
  loadingHandler,
  onLoadHandler,
  onDeleteHandler,
  onRefreshHandlers,
  isRefreshing
}) => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      {
        className: "fixed top-0 left-0 z-10 p-2 m-2 bg-gray-800 text-white rounded hover:bg-gray-700",
        onClick: onToggle
      },
      isOpen ? '←' : '→'
    ),
    React.createElement(
      'div',
      {
        className: `${
          isOpen ? 'w-64' : 'w-0'
        } bg-gray-800 text-white overflow-hidden transition-all duration-300 ease-in-out flex flex-col`,
        style: { minWidth: isOpen ? '200px' : '0' }
      },
      React.createElement(
        'div',
        { className: "p-4 pl-12 flex justify-between items-center" },
        React.createElement('h2', { className: "text-xl font-bold" }, "Handlers"),
        React.createElement(
          'button',
          {
            onClick: onRefreshHandlers,
            className: `text-white hover:text-blue-300 ${isRefreshing ? 'animate-spin' : ''}`,
            disabled: isRefreshing
          },
          "↻"
        )
      ),
      React.createElement(
        'div',
        { className: "flex-1 overflow-auto p-4" },
        React.createElement(HandlerList, {
          handlers: handlers,
          currentHandler: currentHandler,
          loadingHandler: loadingHandler,
          onLoadHandler: onLoadHandler,
          onDeleteHandler: onDeleteHandler
        })
      )
    )
  );
};

export default Sidebar;