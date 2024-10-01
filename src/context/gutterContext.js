import React from "react";

const GutterContext = React.createContext();

const GutterProvider = ({ children }) => {

    const gutterRefs = {}

    function addGutterRef(blockKey, ref) {
        gutterRefs[blockKey] = ref;
    }

    function fetchGutterRef(blockKey) {
        return gutterRefs[blockKey];
    }


    return (
        <GutterContext.Provider
            value={{
                gutterRefs,
                addGutterRef,
                fetchGutterRef: (blockKey) => fetchGutterRef(blockKey) 
            }}
        >
            {children}
        </GutterContext.Provider>
    );
}

export { GutterProvider };

export default GutterContext;
