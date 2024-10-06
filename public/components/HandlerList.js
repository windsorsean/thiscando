import React from 'react';
import HandlerItem from './HandlerItem.js';

const HandlerList = ({ handlers, currentHandler, loadingHandler, onLoadHandler, onDeleteHandler }) => {
  return React.createElement(
    'ul',
    { className: "space-y-2" },
    handlers.map((handler) => 
      React.createElement(HandlerItem, {
        key: handler,
        handler: handler,
        isActive: currentHandler === handler,
        isLoading: loadingHandler === handler,
        onLoad: onLoadHandler,
        onDelete: onDeleteHandler
      })
    )
  );
};

export default HandlerList;