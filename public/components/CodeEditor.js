const CodeEditor = () => {
    const [handlerName, setHandlerName] = React.useState('');
    const [message, setMessage] = React.useState(null);
    const [handlers, setHandlers] = React.useState([]);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [authCode, setAuthCode] = React.useState('');
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const editorRef = React.useRef(null);
    const configEditorRef = React.useRef(null);
    const apiBaseUrl = '/do';

    React.useEffect(() => {
        if (isAuthenticated) {
            initMonaco();
        }
    }, [isAuthenticated]);

    React.useEffect(() => {
        const handleResize = () => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
            if (configEditorRef.current) {
                configEditorRef.current.layout();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const initMonaco = () => {
        if (!configEditorRef.current) {
            configEditorRef.current = monaco.editor.create(document.getElementById('configEditor'), {
                value: '// Handler configuration',
                language: 'json',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                lineNumbers: 'off',
                folding: false,
                scrollBeyondLastLine: false,
                wordWrap: 'on'
            });
        }
        if (!editorRef.current) {
            editorRef.current = monaco.editor.create(document.getElementById('monacoEditor'), {
                value: '// Type your code here',
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
            });
        }
    };

    const authenticate = async () => {
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
        }
    };

    const loadHandler = async (name) => {
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
                    body: JSON.stringify({ function: name, auth_code: authCode }),
                })
            ]);

            const [codeData, configData] = await Promise.all([
                codeResponse.json(),
                configResponse.json()
            ]);

            if (codeResponse.ok && configResponse.ok) {
                editorRef.current.setValue(codeData.code);
                configEditorRef.current.setValue(JSON.stringify(configData.config, null, 2));
                setHandlerName(name);
                setMessage({ type: 'success', text: 'Handler loaded successfully' });
            } else {
                setMessage({ type: 'error', text: codeData.error || configData.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load handler' });
        }
    };

    const saveHandler = async () => {
        try {
            const currentCode = editorRef.current.getValue();
            const currentConfigString = configEditorRef.current.getValue();

            // Check for errors in the editors
            const codeModel = editorRef.current.getModel();
            const codeErrors = monaco.editor.getModelMarkers({ resource: codeModel.uri }).filter(marker => marker.severity === monaco.MarkerSeverity.Error);
            const jsonModel = configEditorRef.current.getModel();
            const jsonErrors = monaco.editor.getModelMarkers({ resource: jsonModel.uri }).filter(marker => marker.severity === monaco.MarkerSeverity.Error);

            if (codeErrors.length > 0) {
                setMessage({ type: 'error', text: `There are ${codeErrors.length} error(s) in your code. Please fix them before saving.` });
                return;
            }

            if (jsonErrors.length > 0) {
                setMessage({ type: 'error', text: `There are ${jsonErrors.length} error(s) in your config JSON. Please fix them before saving.` });
                return;
            }

            // Validate JSON
            let currentConfig;
            try {
                currentConfig = JSON.parse(currentConfigString);
            } catch (error) {
                setMessage({ type: 'error', text: 'Invalid JSON in config editor. Please check your syntax.' });
                return;
            }

            // Make sure config matches handler name
            if (currentConfig.function != handlerName) {
                setMessage({ type: 'error', text: 'Function name in config must match handler name.' });
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

            const [codeResponse, configResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/addhandler`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: handlerName, code: currentCode, auth_code: authCode }),
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
                const handlersResponse = await fetch(`${apiBaseUrl}/listhandlers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth_code: authCode }),
                });
                const handlersData = await handlersResponse.json();
                if (handlersResponse.ok) {
                    setHandlers(handlersData.handlers);
                }
            } else {
                setMessage({ type: 'error', text: codeData.error || configData.error || 'Failed to save handler' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save handler' });
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
                const handlersResponse = await fetch(`${apiBaseUrl}/listhandlers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth_code: authCode }),
                });
                const handlersData = await handlersResponse.json();
                if (handlersResponse.ok) {
                    setHandlers(handlersData.handlers);
                }
            } else {
                setMessage({ type: 'error', text: codeData.error || configData.error || 'Failed to delete handler' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete handler' });
        }
    };

    const refreshHandlers = async () => {
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
        const handlerTemplate = await fetchTemplate('gethandlertemplate');
        const configTemplate = await fetchTemplate('getconfigtemplate');

        if (handlerTemplate && configTemplate) {
            editorRef.current.setValue(handlerTemplate);
            configEditorRef.current.setValue(configTemplate);
            setHandlerName('');
            setMessage({ type: 'success', text: 'New handler template loaded' });
        }
    };

    if (!isAuthenticated) {
        return React.createElement('div', { className: 'p-4' },
            React.createElement('input', {
                type: 'password',
                value: authCode,
                onChange: (e) => setAuthCode(e.target.value),
                placeholder: 'Enter auth code',
                className: 'border p-2 mr-2'
            }),
            React.createElement('button', {
                onClick: authenticate,
                className: 'bg-blue-500 text-white p-2'
            }, 'Authenticate'),
            message && React.createElement('div', {
                className: `p-2 mt-4 ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`
            },
                React.createElement('strong', null, message.type === 'error' ? 'Error: ' : 'Success: '),
                message.text
            )
        );
    }

    return React.createElement('div', { className: 'flex h-screen overflow-hidden' },
        // Sidebar toggle button (always visible)
        React.createElement('button', {
            className: 'fixed top-0 left-0 z-10 p-2 m-2 bg-gray-800 text-white rounded hover:bg-gray-700',
            onClick: () => setIsSidebarOpen(!isSidebarOpen)
        }, isSidebarOpen ? '←' : '→'),

        // Sidebar
        React.createElement('div', {
            className: `${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 text-white overflow-hidden transition-all duration-300 ease-in-out flex flex-col`,
            style: { minWidth: isSidebarOpen ? '200px' : '0' }
        },
            React.createElement('div', { className: 'p-4 pl-12 flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-bold' }, 'Handlers'),
                React.createElement('button', {
                    onClick: refreshHandlers,
                    className: 'text-white hover:text-blue-300'
                }, '↻')
            ),
            React.createElement('div', { className: 'flex-1 overflow-auto p-4' },
                React.createElement('ul', { className: 'space-y-2' },
                    handlers.map((handler) =>
                        React.createElement('li', {
                            key: handler,
                            className: `flex justify-between items-center p-2 rounded hover:bg-gray-700 ${handlerName === handler ? 'bg-gray-700' : ''}`,
                        },
                            React.createElement('span', {
                                className: 'cursor-pointer flex-grow',
                                onClick: () => loadHandler(handler)
                            }, handler),
                            React.createElement('button', {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    deleteHandler(handler);
                                },
                                className: 'text-red-500 hover:text-red-700'
                            }, '×')
                        )
                    )
                )
            )
        ),

        // Main content
        React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
            React.createElement('div', { className: 'flex flex-col p-2 bg-gray-200' },
                React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('input', {
                        type: 'text',
                        value: handlerName,
                        onChange: (e) => setHandlerName(e.target.value),
                        placeholder: 'Handler name',
                        className: 'p-2 border rounded'
                    }),
                    React.createElement('div', null,
                        React.createElement('button', {
                            onClick: loadNewHandler,
                            className: 'bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600'
                        }, 'New Handler'),
                        React.createElement('button', {
                            onClick: saveHandler,
                            className: 'bg-green-500 text-white p-2 rounded hover:bg-green-600'
                        }, 'Save Handler')
                    )
                ),
                message && React.createElement('div', {
                    className: `mt-2 p-1 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`
                },
                    React.createElement('strong', null, message.type === 'error' ? 'Error: ' : 'Success: '),
                    message.text
                )
            ),
            React.createElement('div', {
                id: 'configEditor',
                className: 'border-b border-gray-300',
                style: {
                    height: '30%',
                    minHeight: '100px',
                    maxHeight: '300px'
                }
            }),
            React.createElement('div', {
                id: 'monacoEditor',
                className: 'flex-1'
            })
        )
    );
};

// Make CodeEditor available globally
window.CodeEditor = CodeEditor;