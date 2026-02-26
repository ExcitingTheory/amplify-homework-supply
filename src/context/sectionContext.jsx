import React from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';

const SectionContext = React.createContext({
    sections: [],
    sectionMap: {},
    assignments: [],
});

const SectionProvider = ({ children, unitId }) => {
    // Get auth state from centralized context
    const { user, isLoading: authLoading } = React.useContext(AuthContext);

    const [sections, setSections] = React.useState([]);
    const [sectionMap, setSectionMap] = React.useState({});
    const [assignments, setAssignments] = React.useState([]);

    React.useEffect(() => {
        console.log('[SectionContext] useEffect triggered', { authLoading, hasUser: !!user, userSub: user?.attributes?.sub });
        // Wait for auth to be ready
        if (authLoading || !user) {
            console.log('[SectionContext] Waiting for auth...', { authLoading, hasUser: !!user });
            return;
        }

        let subscription;

        async function fetchSections() {
            const username = user.attributes.sub;
            console.log('[SectionContext] Fetching sections for user:', username);

            const client = getAmplifyClient();

            subscription = client.models.Section.observeQuery({
                filter: {
                    owner: { eq: username }
                }
            }).subscribe({
                next: ({ items }) => {
                    console.log('[SectionContext] Received sections:', items.length, items.map(s => ({ id: s.id, name: s.name, owner: s.owner })));
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
                        console.log('[SectionContext] Updating sections state');
                        return items;
                    });

                    // Only update if sectionMap has actually changed
                    setSectionMap(prevMap => {
                        const prevStr = JSON.stringify(prevMap);
                        const newStr = JSON.stringify(_sectionMap);
                        if (prevStr === newStr) {
                            return prevMap; // Return same reference to prevent rerender
                        }
                        console.log('[SectionContext] Updating sectionMap state');
                        return _sectionMap;
                    });
                },
                error: (error) => {
                    console.error('[SectionContext] Section subscription error:', error);
                }
            });
        }

        fetchSections()

        return () => {
            console.log('[SectionContext] Cleaning up subscription');
            subscription?.unsubscribe();
        };
    }, [user, authLoading]);

    React.useEffect(() => {
        if(!unitId) return

        let subscription;

        async function fetchAssignments() {
            const client = getAmplifyClient();

            subscription = client.models.Assignment.observeQuery({
                filter: {
                    unitID: { eq: unitId }
                }
            }).subscribe({
                next: ({ items }) => {
                    // Only update if assignments have actually changed
                    setAssignments(prevAssignments => {
                        const prevStr = JSON.stringify(prevAssignments);
                        const newStr = JSON.stringify(items);
                        if (prevStr === newStr) {
                            return prevAssignments; // Return same reference to prevent rerender
                        }
                        return items;
                    });
                },
                error: (error) => {
                    console.error('[SectionContext] Assignment subscription error:', error);
                }
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
