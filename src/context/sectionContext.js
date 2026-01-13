import React from "react";
import { DataStore } from "aws-amplify/datastore";
import { getCurrentUser } from "aws-amplify/auth";
import { Section, Assignment } from "../models"

const SectionContext = React.createContext({
    sections: [],
    sectionMap: {},
    assignments: [],
});

const SectionProvider = ({ children, unitId }) => {

    const [sections, setSections] = React.useState([]);
    const [sectionMap, setSectionMap] = React.useState({});
    const [assignments, setAssignments] = React.useState([]);

    React.useEffect(() => {

        let subscription;

        async function fetchSections() {
            const {
                username,
              } = await getCurrentUser();

            subscription = DataStore.observeQuery(Section,
                s => s.owner.eq(username)
            ).subscribe(({ items }) => {
                let _sectionMap = {}

                items.forEach(item => {
                    _sectionMap[item.id] = item
                })

                // Only update if sections have actually changed
                setSections(prevSections => {
                    const prevStr = JSON.stringify(prevSections);
                    const newStr = JSON.stringify(items);
                    if (prevStr === newStr) {
                        return prevSections; // Return same reference to prevent rerender
                    }
                    return items;
                });

                // Only update if sectionMap has actually changed
                setSectionMap(prevMap => {
                    const prevStr = JSON.stringify(prevMap);
                    const newStr = JSON.stringify(_sectionMap);
                    if (prevStr === newStr) {
                        return prevMap; // Return same reference to prevent rerender
                    }
                    return _sectionMap;
                });

            });
        }

        fetchSections()

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        if(!unitId) return

        let subscription;

        async function fetchAssignments() {
            subscription = DataStore.observeQuery(Assignment,
                s => s.unitID.eq(unitId)
            ).subscribe(({ items }) => {
                // Only update if assignments have actually changed
                setAssignments(prevAssignments => {
                    const prevStr = JSON.stringify(prevAssignments);
                    const newStr = JSON.stringify(items);
                    if (prevStr === newStr) {
                        return prevAssignments; // Return same reference to prevent rerender
                    }
                    return items;
                });
            });
        }

        fetchAssignments()

        return () => {
            subscription?.unsubscribe();
        };
    }, [unitId]);

    // Memoize context value to prevent unnecessary rerenders
    const contextValue = React.useMemo(() => ({
        sections,
        sectionMap,
        assignments,
    }), [sections, sectionMap, assignments]);


    return (
        <SectionContext.Provider
            value={contextValue}
        >
            {children}
        </SectionContext.Provider>
    );
}

export { SectionProvider };

export default SectionContext;
