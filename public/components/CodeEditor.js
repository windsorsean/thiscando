const CodeEditor = () => {
    const [handlerName, setHandlerName] = React.useState('');
    const [message, setMessage] = React.useState(null);
    const [handlers, setHandlers] = React.useState([]);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [authCode, setAuthCode] = React.useState('');
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const editorRef = React.useRef(null);
    const configEditorRef = React.useRef(null);

    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBaseUrl = isLocalDev ? 'http://localhost:5001/local_path_to_function' : '/do';

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
            const currentConfig = JSON.parse(configEditorRef.current.getValue());

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
        // Sidebar
        React.createElement('div', { 
            className: `${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 text-white overflow-auto transition-all duration-300 ease-in-out flex flex-col`,
            style: { minWidth: isSidebarOpen ? '200px' : '0' }
        },
            React.createElement('div', { className: 'p-4 flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-bold' }, 'Handlers'),
                React.createElement('button', {
                    className: 'p-1 bg-gray-700 text-white rounded hover:bg-gray-600',
                    onClick: () => setIsSidebarOpen(!isSidebarOpen)
                }, isSidebarOpen ? '←' : '→')
            ),
            React.createElement('div', { className: 'flex-1 overflow-auto p-4' },
                React.createElement('ul', { className: 'space-y-2' },
                    handlers.map((handler) =>
                        React.createElement('li', {
                            key: handler,
                            className: `cursor-pointer p-2 rounded hover:bg-gray-700 ${handlerName === handler ? 'bg-gray-700' : ''}`,
                            onClick: () => loadHandler(handler)
                        }, handler)
                    )
                )
            ),
            React.createElement('div', { className: 'p-4' },
                React.createElement('input', {
                    type: 'text',
                    value: handlerName,
                    onChange: (e) => setHandlerName(e.target.value),
                    placeholder: 'New handler name',
                    className: 'p-2 w-full text-black rounded'
                }),
                React.createElement('button', {
                    onClick: saveHandler,
                    className: 'mt-2 bg-green-500 text-white p-2 w-full rounded hover:bg-green-600'
                }, 'Save Handler')
            )
        ),

        // Main content
        React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
            message && React.createElement('div', {
                className: `p-2 ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`
            },
                React.createElement('strong', null, message.type === 'error' ? 'Error: ' : 'Success: '),
                message.text
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