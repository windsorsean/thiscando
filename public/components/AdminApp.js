import React, { useState, useEffect, useRef } from 'react';
import * as api from './api.js';
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
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const authenticate = async () => {
        setIsAuthenticating(true);
        try {
            const data = await api.listHandlers(authCode);
            setIsAuthenticated(true);
            setHandlers(data.handlers);
            setMessage({ type: 'success', text: 'Authentication successful' });
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
            const [codeData, configData] = await Promise.all([
                api.loadHandler(name, authCode),
                api.loadConfig(name, authCode)
            ]);

            setCode(codeData.code);
            setConfig(JSON.stringify(configData.config, null, 2));
            setHandlerName(name);
            setOriginalCode(codeData.code);
            setOriginalConfig(JSON.stringify(configData.config, null, 2));
            setMessage({ type: 'success', text: 'Handler loaded successfully' });
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

            const [codeData, configData] = await Promise.all([
                api.saveHandler(handlerName, code, authCode),
                api.saveConfig(currentConfig, authCode)
            ]);

            setMessage({ type: 'success', text: 'Handler and config saved successfully' });
            setOriginalCode(code);
            setOriginalConfig(config);
            await refreshHandlers();
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

            const [codeData, configData] = await Promise.all([
                api.deleteHandler(name, authCode),
                api.deleteConfig(name, authCode)
            ]);

            setMessage({ type: 'success', text: 'Handler and config deleted successfully' });
            await refreshHandlers();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete handler' });
        }
    };

    const refreshHandlers = async () => {
        setIsRefreshing(true);
        try {
            const data = await api.listHandlers(authCode);
            setHandlers(data.handlers);
            setMessage({ type: 'success', text: 'Handlers refreshed successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to refresh handlers' });
        } finally {
            setIsRefreshing(false);
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
            const [handlerTemplate, configTemplate] = await Promise.all([
                api.getHandlerTemplate(authCode),
                api.getConfigTemplate(authCode)
            ]);

            if (handlerTemplate.template && configTemplate.template) {
                const handlerCode = handlerTemplate.template;
                const configCode = handlerTemplate.template;
                setCode(handlerCode);
                setConfig(configCode);
                setHandlerName('');
                setOriginalCode(handlerCode);
                setOriginalConfig(configCode);
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