const API_BASE_URL = '/do';
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const handleResponse = async (response) => {
    const data = await response.json();
    if (isLocal) { console.log({ data }) };
    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }
    return data;
};

const apiCall = async (endpoint, body) => {
    if (isLocal) { console.log({ endpoint, body }) };
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return handleResponse(response);
};

export const authenticate = (authCode) => apiCall('listhandlers', { auth_code: authCode });

export const loadHandler = (name, authCode) => apiCall('loadhandler', { name, auth_code: authCode });

export const loadConfig = (handler, authCode) => apiCall('loadconfig', { handler, auth_code: authCode });

export const saveHandler = (name, code, authCode) => apiCall('addhandler', { name, code, auth_code: authCode });

export const saveConfig = (config, authCode) => apiCall('addconfig', { ...config, auth_code: authCode });

export const deleteHandler = (name, authCode) => apiCall('deletehandler', { name, auth_code: authCode });

export const deleteConfig = (name, authCode) => apiCall('deleteconfig', { name, auth_code: authCode });

export const listHandlers = (authCode) => apiCall('listhandlers', { auth_code: authCode });

export const getHandlerTemplate = (authCode) => apiCall('gethandlertemplate', { auth_code: authCode });

export const getConfigTemplate = (authCode) => apiCall('getconfigtemplate', { auth_code: authCode });