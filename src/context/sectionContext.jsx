import React from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';

const SectionContext = React.createContext({
    sections: [],
    sectionMap: {},
    assignments: [],
});

/**
 * Check if a subscription error is transient (safe to ignore).
 * DuplicatedOperationError occurs during rapid mount/unmount cycles
 * (React StrictMode, navigation) and resolves on its own.
 */
function isTransientSubscriptionError(error) {
    const msg = error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
    return msg.includes('DuplicatedOperationError');
}

function handleSubscriptionError(label, error) {
    if (isTransientSubscriptionError(error)) {
        console.warn(`[SectionContext] ${label}: transient DuplicatedOperationError (safe to ignore)`);
        return;
    }
    console.error(`[SectionContext] ${label}:`, error);
}

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

        // Track subscriptions for cleanup
        const subscriptions = [];
        let cancelled = false;

        async function fetchSections() {
            const userId = user.attributes.sub;
            console.log('[SectionContext] Fetching sections for userId:', userId);

            const client = getAmplifyClient();

            try {
                // Initial fetch
                const { data: initialSections, errors } = await client.models.Section.list();
                if (cancelled) return;
                if (errors?.length) {
                    console.error('[SectionContext] Initial fetch errors:', errors);
                }
                
                const validItems = (initialSections || []).filter(item => item != null && item.id != null);
                console.log('[SectionContext] Initial sections:', validItems.length, validItems.map(s => ({ id: s.id, name: s.name, owner: s.owner })));
                
                // Update state with initial data
                updateSectionsState(validItems);

                if (cancelled) return;
                
                // Subscribe to new sections
                const createSub = client.models.Section.onCreate().subscribe({
                    next: (response) => {
                        console.log('[SectionContext] onCreate raw response:', JSON.stringify(response, null, 2));
                        const newSection = response?.data;
                        if (!newSection || !newSection.id) {
                            console.log('[SectionContext] onCreate - no valid section data, returning');
                            return;
                        }
                        console.log('[SectionContext] Section created:', newSection.id);
                        setSections(prev => {
                            // Avoid duplicates
                            if (prev.some(s => s.id === newSection.id)) return prev;
                            console.log('[SectionContext] Adding new section to state');
                            return [...prev, newSection];
                        });
                        setSectionMap(prev => ({ ...prev, [newSection.id]: newSection }));
                    },
                    error: (error) => handleSubscriptionError('Section onCreate', error)
                });
                subscriptions.push(createSub);
                
                // Subscribe to section updates
                const updateSub = client.models.Section.onUpdate().subscribe({
                    next: (response) => {
                        const updatedSection = response?.data;
                        if (!updatedSection || !updatedSection.id) return;
                        console.log('[SectionContext] Section updated:', updatedSection.id);
                        setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
                        setSectionMap(prev => ({ ...prev, [updatedSection.id]: updatedSection }));
                    },
                    error: (error) => handleSubscriptionError('Section onUpdate', error)
                });
                subscriptions.push(updateSub);
                
                // Subscribe to section deletions
                const deleteSub = client.models.Section.onDelete().subscribe({
                    next: (response) => {
                        const deletedSection = response?.data;
                        if (!deletedSection || !deletedSection.id) return;
                        console.log('[SectionContext] Section deleted:', deletedSection.id);
                        setSections(prev => prev.filter(s => s.id !== deletedSection.id));
                        setSectionMap(prev => {
                            const newMap = { ...prev };
                            delete newMap[deletedSection.id];
                            return newMap;
                        });
                    },
                    error: (error) => handleSubscriptionError('Section onDelete', error)
                });
                subscriptions.push(deleteSub);
                
            } catch (error) {
                console.error('[SectionContext] fetchSections error:', error);
            }
        }
        
        function updateSectionsState(validItems) {
            let _sectionMap = {};
            validItems.forEach(item => {
                _sectionMap[item.id] = item;
            });
            
            setSections(prevSections => {
                const prevStr = JSON.stringify(prevSections);
                const newStr = JSON.stringify(validItems);
                if (prevStr === newStr) {
                    return prevSections;
                }
                console.log('[SectionContext] Updating sections state');
                return validItems;
            });
            
            setSectionMap(prevMap => {
                const prevStr = JSON.stringify(prevMap);
                const newStr = JSON.stringify(_sectionMap);
                if (prevStr === newStr) {
                    return prevMap;
                }
                console.log('[SectionContext] Updating sectionMap state');
                return _sectionMap;
            });
        }

        fetchSections();

        return () => {
            console.log('[SectionContext] Cleaning up subscriptions');
            cancelled = true;
            subscriptions.forEach(sub => sub?.unsubscribe());
        };
    }, [user, authLoading]);

    React.useEffect(() => {
        if(!unitId) return

        const subscriptions = [];
        let cancelled = false;

        async function fetchAssignments() {
            const client = getAmplifyClient();

            try {
                // Initial fetch with filter
                const { data: initialAssignments, errors } = await client.models.Assignment.list({
                    filter: { unitID: { eq: unitId } }
                });
                if (cancelled) return;
                if (errors?.length) {
                    console.error('[SectionContext] Assignment fetch errors:', errors);
                }
                
                const validItems = (initialAssignments || []).filter(item => item != null && item.id != null);
                updateAssignmentsState(validItems);

                if (cancelled) return;
                
                // Subscribe to new assignments with filter
                const createSub = client.models.Assignment.onCreate({
                    filter: { unitID: { eq: unitId } }
                }).subscribe({
                    next: (response) => {
                        const newAssignment = response?.data;
                        if (!newAssignment || !newAssignment.id) return;
                        if (newAssignment.unitID !== unitId) return; // Double-check filter
                        console.log('[SectionContext] Assignment created:', newAssignment.id);
                        setAssignments(prev => {
                            if (prev.some(a => a.id === newAssignment.id)) return prev;
                            return [...prev, newAssignment];
                        });
                    },
                    error: (error) => handleSubscriptionError('Assignment onCreate', error)
                });
                subscriptions.push(createSub);
                
                // Subscribe to assignment updates
                const updateSub = client.models.Assignment.onUpdate({
                    filter: { unitID: { eq: unitId } }
                }).subscribe({
                    next: (response) => {
                        const updatedAssignment = response?.data;
                        if (!updatedAssignment || !updatedAssignment.id) return;
                        if (updatedAssignment.unitID !== unitId) return;
                        console.log('[SectionContext] Assignment updated:', updatedAssignment.id);
                        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
                    },
                    error: (error) => handleSubscriptionError('Assignment onUpdate', error)
                });
                subscriptions.push(updateSub);
                
                // Subscribe to assignment deletions
                const deleteSub = client.models.Assignment.onDelete({
                    filter: { unitID: { eq: unitId } }
                }).subscribe({
                    next: (response) => {
                        const deletedAssignment = response?.data;
                        if (!deletedAssignment || !deletedAssignment.id) return;
                        console.log('[SectionContext] Assignment deleted:', deletedAssignment.id);
                        setAssignments(prev => prev.filter(a => a.id !== deletedAssignment.id));
                    },
                    error: (error) => handleSubscriptionError('Assignment onDelete', error)
                });
                subscriptions.push(deleteSub);
                
            } catch (error) {
                console.error('[SectionContext] fetchAssignments error:', error);
            }
        }
        
        function updateAssignmentsState(validItems) {
            setAssignments(prevAssignments => {
                const prevStr = JSON.stringify(prevAssignments);
                const newStr = JSON.stringify(validItems);
                if (prevStr === newStr) {
                    return prevAssignments;
                }
                return validItems;
            });
        }

        fetchAssignments();

        return () => {
            cancelled = true;
            subscriptions.forEach(sub => sub?.unsubscribe());
        };
    }, [unitId]);

    // Refetch sections - can be called after create/update operations
    const refetchSections = React.useCallback(async () => {
        console.log('[SectionContext] Manual refetch triggered');
        const client = getAmplifyClient();
        try {
            const { data: fetchedSections, errors } = await client.models.Section.list();
            if (errors) {
                console.error('[SectionContext] Refetch errors:', errors);
            }
            const validItems = (fetchedSections || []).filter(item => item != null && item.id != null);
            console.log('[SectionContext] Refetch complete, sections:', validItems.length);
            
            let _sectionMap = {};
            validItems.forEach(item => {
                _sectionMap[item.id] = item;
            });
            
            setSections(validItems);
            setSectionMap(_sectionMap);
        } catch (error) {
            console.error('[SectionContext] Refetch error:', error);
        }
    }, []);

    // Memoize context value to prevent unnecessary rerenders
    const contextValue = React.useMemo(() => ({
        sections,
        sectionMap,
        assignments,
        refetchSections,
    }), [sections, sectionMap, assignments, refetchSections]);


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
