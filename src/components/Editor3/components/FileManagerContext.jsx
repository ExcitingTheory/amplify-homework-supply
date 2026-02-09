import React from 'react';

const FileManagerContext = React.createContext(null);

export const FileManagerProvider = ({ children, value }) => {
    return (
        <FileManagerContext.Provider value={value}>
            {children}
        </FileManagerContext.Provider>
    );
};

export const useFileManager = () => {
    const context = React.useContext(FileManagerContext);
    if (!context) {
        throw new Error('useFileManager must be used within FileManagerProvider');
    }
    return context;
};

export default FileManagerContext;
