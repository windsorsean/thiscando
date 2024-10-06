import React, { useEffect, useRef } from 'react';

const ConfigEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = monaco.editor.create(document.getElementById('configEditor'), {
        value: value,
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        lineNumbers: 'off',
        folding: false,
        scrollBeyondLastLine: false,
        wordWrap: 'on'
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return React.createElement('div', {
    id: 'configEditor',
    className: 'border-b border-gray-300',
    style: {
      height: '30%',
      minHeight: '100px',
      maxHeight: '300px'
    }
  });
};

export default ConfigEditor;