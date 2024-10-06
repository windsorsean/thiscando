import React from 'react';

const HeaderActions = ({
  handlerName,
  setHandlerName,
  loadNewHandler,
  saveHandler,
  isLoadingNewHandler,
  isSavingHandler
}) => {
  return React.createElement(
    'div',
    { className: "flex justify-between items-center" },
    React.createElement('input', {
      type: "text",
      value: handlerName,
      onChange: (e) => setHandlerName(e.target.value),
      placeholder: "Handler name",
      className: "p-2 border rounded"
    }),
    React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        {
          onClick: loadNewHandler,
          className: `bg-blue-500 text-white p-2 rounded mr-2 ${
            isLoadingNewHandler ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`,
          disabled: isLoadingNewHandler
        },
        isLoadingNewHandler ? 'Loading...' : 'New Handler'
      ),
      React.createElement(
        'button',
        {
          onClick: saveHandler,
          className: `bg-green-500 text-white p-2 rounded ${
            isSavingHandler ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
          }`,
          disabled: isSavingHandler
        },
        isSavingHandler ? 'Saving...' : 'Save Handler'
      )
    )
  );
};

export default HeaderActions;