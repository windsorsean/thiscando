import React, { useState, useEffect, useRef } from 'react';
import AuthenticationForm from './AuthenticationForm.js';
import Sidebar from './Sidebar.js';
import HeaderActions from './HeaderActions.js';
import MessageDisplay from './MessageDisplay.js';
import ConfigEditor from './ConfigEditor.js';
import CodeEditor from './CodeEditor.js';

const App = () => {
    const [handlerName, setHandlerName] = useState('');
    const [message, setMessage] = useState(null);
    const [handlers, setHandlers] = useState([]);
    const [loadingHandler, setLoadingHandler] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isLoadingNewHandler, setIsLoadingNewHandler] = useState(false);
    const [isSavingHandler, setIsSavingHandler] = useState(false);
    const [authCode, setAuthCode] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [code, setCode] = useState('// Type your code here');
    const [config, setConfig] = useState('// Handler configuration');
    const [originalCode, setOriginalCode] = useState(code);
    const [originalConfig, setOriginalConfig] = useState(config);
    const apiBaseUrl = '/do';

    const authenticate = async () => {
        setIsAuthenticating(true);
        try {
            const response = await fetch(`${apiBaseUrl}/listhandlers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth_code: authCode }),
            });
            const data = await response.json();
            if (response.ok) {
                setIsAuthenticated(true);
                setHandlers(data.handlers);
                setMessage({ type: 'success', text: 'Authentication successful' });
            } else {
                setMessage({ type: 'error', text: 'Authentication failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Authentication failed' });
        } finally {
            setIsAuthenticating(false);
        }
    };

    const loadHandler = async (name) => {
        if (hasUnsavedChanges()) {
            const confirmLoad = window.confirm("You have unsaved changes. Are you sure you want to load a new handler without saving?");
            if (!confirmLoad) {
                return;
            }
        }

        setLoadingHandler(name);
        try {
            const [codeResponse, configResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/loadhandler`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, auth_code: authCode }),
                }),
                fetch(`${apiBaseUrl}/loadconfig`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handler: name, auth_code: authCode }),
                })
            ]);

            const [codeData, configData] = await Promise.all([
                codeResponse.json(),
                configResponse.json()
            ]);

            if (codeResponse.ok && configResponse.ok) {
                setCode(codeData.code);
                setConfig(JSON.stringify(configData.config, null, 2));
                setHandlerName(name);
                setOriginalCode(codeData.code);
                setOriginalConfig(JSON.stringify(configData.config, null, 2));
                setMessage({ type: 'success', text: 'Handler loaded successfully' });
            } else {
                setMessage({ type: 'error', text: codeData.error || configData.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load handler' });
        } finally {
            setLoadingHandler(null);
        }
    };

    const saveHandler = async () => {
        try {
            // Validate JSON
            let currentConfig;
            try {
                currentConfig = JSON.parse(config);
            } catch (error) {
                setMessage({ type: 'error', text: 'Invalid JSON in config editor. Please check your syntax.' });
                return;
            }

            // Validate that required params are included
            if (!(
                currentConfig.handler &&
                currentConfig.function &&
                currentConfig.match &&
                currentConfig.name
            )) {
                setMessage({ type: 'error', text: 'Config is missing required parameters.' });
                return;
            }

            // Make sure handler name is valid
            if (!/^(?![-_])[a-zA-Z0-9_-]+(?<![-_])$/.test(handlerName)) {
                setMessage({ type: 'error', text: 'Handler name is invalid (only letters, numbers, or underscore).' });
                return;
            }

            // Make sure config matches handler name
            if (currentConfig.handler != handlerName) {
                setMessage({ type: 'error', text: 'Handler name in config must match handler name.' });
                return;
            }

            // Check that code contains the function name
            if (!code.includes(`function ${currentConfig.function}(`)) {
                setMessage({ type: 'error', text: `Make sure the function ${currentConfig.function} exists.` });
                return;
            }

            // Check if the handler already exists
            if (handlers.includes(handlerName)) {
                const confirmOverwrite = window.confirm("Are you sure you want to overwrite the existing handler?");
                if (!confirmOverwrite) {
                    setMessage({ type: 'error', text: 'Overwrite canceled' });
                    return;
                }
            }

            setIsSavingHandler(true);
            const [codeResponse, configResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/addhandler`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: handlerName, code: code, auth_code: authCode }),
                }),
                fetch(`${apiBaseUrl}/addconfig`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...currentConfig, auth_code: authCode }),
                })
            ]);

            const [codeData, configData] = await Promise.all([
                codeResponse.json(),
                configResponse.json()
            ]);

            if (codeResponse.ok && configResponse.ok) {
                setMessage({ type: 'success', text: 'Handler and config saved successfully' });
                setOriginalCode(code);
                setOriginalConfig(config);
                await refreshHandlers();
            } else {
                setMessage({ type: 'error', text: codeData.error || configData.error || 'Failed to save handler' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save handler' });
        } finally {
            setIsSavingHandler(false);
        }
    };

    const deleteHandler = async (name) => {
        try {
            const confirmDelete = window.confirm(`Are you sure you want to delete the handler "${name}"?`);
            if (!confirmDelete) {
                setMessage({ type: 'error', text: 'Delete canceled' });
                return;
            }

            const [codeResponse, configResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/deletehandler`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: handlerName, auth_code: authCode }),
                }),
                fetch(`${apiBaseUrl}/deleteconfig`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: handlerName, auth_code: authCode }),
                })
            ]);

            const [codeData, configData] = await Promise.all([
                codeResponse.json(),
                configResponse.json()
            ]);

            if (codeResponse.ok && configResponse.ok) {
                setMessage({ type: 'success', text: 'Handler and config deleted successfully' });
                await refreshHandlers();
            } else {
                setMessage({ type: 'error', text: codeData.error || configData.error || 'Failed to delete handler' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete handler' });
        }
    };

    const refreshHandlers = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`${apiBaseUrl}/listhandlers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth_code: authCode }),
            });
            const data = await response.json();
            if (response.ok) {
                setHandlers(data.handlers);
                setMessage({ type: 'success', text: 'Handlers refreshed successfully' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to refresh handlers' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to refresh handlers' });
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchTemplate = async (endpoint) => {
        try {
            const response = await fetch(`${apiBaseUrl}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth_code: authCode }),
            });
            const data = await response.json();
            if (response.ok) {
                return data.template;
            } else {
                setMessage({ type: 'error', text: `Failed to fetch ${endpoint} template` });
                return null;
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Error fetching ${endpoint} template` });
            return null;
        }
    };

    const loadNewHandler = async () => {
        if (hasUnsavedChanges()) {
            const confirmNew = window.confirm("You have unsaved changes. Are you sure you want to create a new handler without saving?");
            if (!confirmNew) {
                return;
            }
        }

        setIsLoadingNewHandler(true);
        try {
            const handlerTemplate = await fetchTemplate('gethandlertemplate');
            const configTemplate = await fetchTemplate('getconfigtemplate');

            if (handlerTemplate && configTemplate) {
                setCode(handlerTemplate);
                setConfig(configTemplate);
                setHandlerName('');
                setOriginalCode(handlerTemplate);
                setOriginalConfig(configTemplate);
                setMessage({ type: 'success', text: 'New handler template loaded' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load new handler template' });
        } finally {
            setIsLoadingNewHandler(false);
        }
    };

    const hasUnsavedChanges = () => {
        return code !== originalCode || config !== originalConfig;
    };

    if (!isAuthenticated) {
        return React.createElement(AuthenticationForm, {
            authCode: authCode,
            setAuthCode: setAuthCode,
            authenticate: authenticate,
            isAuthenticating: isAuthenticating,
            message: message
        });
    }

    return React.createElement(
        'div',
        { className: 'flex h-screen overflow-hidden' },
        React.createElement(Sidebar, {
            isOpen: isSidebarOpen,
            onToggle: () => setIsSidebarOpen(!isSidebarOpen),
            handlers: handlers,
            currentHandler: handlerName,
            loadingHandler: loadingHandler,
            onLoadHandler: loadHandler,
            onDeleteHandler: deleteHandler,
            onRefreshHandlers: refreshHandlers,
            isRefreshing: isRefreshing
        }),
        React.createElement(
            'div',
            { className: 'flex-1 flex flex-col overflow-hidden' },
            React.createElement(
                'div',
                { className: 'flex flex-col p-2 bg-gray-200' },
                React.createElement(HeaderActions, {
                    handlerName: handlerName,
                    setHandlerName: setHandlerName,
                    loadNewHandler: loadNewHandler,
                    saveHandler: saveHandler,
                    isLoadingNewHandler: isLoadingNewHandler,
                    isSavingHandler: isSavingHandler
                }),
                React.createElement(MessageDisplay, { message: message })
            ),
            React.createElement(ConfigEditor, {
                value: config,
                onChange: setConfig
            }),
            React.createElement(CodeEditor, {
                value: code,
                onChange: setCode
            })
        )
    );
};

export default App;