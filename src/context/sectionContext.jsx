import React, { useReducer } from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';
import { sectionReducer, initialState, actionTypes } from './reducers/sectionReducer';

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
    const [state, dispatch] = useReducer(sectionReducer, initialState);

    React.useEffect(() => {
        console.log('[SectionContext] useEffect triggered', { authLoading, hasUser: !!user, userSub: user?.attributes?.sub });
        // Wait for auth to be ready
        if (authLoading || !user) {
            console.log('[SectionContext] Waiting for auth...', { authLoading, hasUser: !!user });
            return;
        }

        const subscriptions = [];
        let cancelled = false;

        async function fetchSections() {
            const userId = user.attributes.sub;
            console.log('[SectionContext] Fetching sections for userId:', userId);
            const client = getAmplifyClient();

            try {
                const { data: initialSections, errors } = await client.models.Section.list();
                if (cancelled) return;
                if (errors?.length) console.error('[SectionContext] Initial fetch errors:', errors);

                const validItems = (initialSections || []).filter(item => item != null && item.id != null);
                console.log('[SectionContext] Initial sections:', validItems.length);
                dispatch({ type: actionTypes.SET_SECTIONS, payload: validItems });

                if (cancelled) return;

                const createSub = client.models.Section.onCreate().subscribe({
                    next: (response) => {
                        const newSection = response?.data;
                        if (!newSection || !newSection.id) return;
                        console.log('[SectionContext] Section created:', newSection.id);
                        dispatch({ type: actionTypes.ADD_SECTION, payload: newSection });
                    },
                    error: (error) => handleSubscriptionError('Section onCreate', error)
                });
                subscriptions.push(createSub);

                const updateSub = client.models.Section.onUpdate().subscribe({
                    next: (response) => {
                        const updated = response?.data;
                        if (!updated || !updated.id) return;
                        dispatch({ type: actionTypes.UPDATE_SECTION, payload: updated });
                    },
                    error: (error) => handleSubscriptionError('Section onUpdate', error)
                });
                subscriptions.push(updateSub);

                const deleteSub = client.models.Section.onDelete().subscribe({
                    next: (response) => {
                        const deleted = response?.data;
                        if (!deleted || !deleted.id) return;
                        dispatch({ type: actionTypes.DELETE_SECTION, payload: deleted.id });
                    },
                    error: (error) => handleSubscriptionError('Section onDelete', error)
                });
                subscriptions.push(deleteSub);
            } catch (error) {
                console.error('[SectionContext] fetchSections error:', error);
            }
        }

        fetchSections();

        return () => {
            console.log('[SectionContext] Cleaning up subscriptions');
            cancelled = true;
            subscriptions.forEach(sub => sub.unsubscribe());
        };
    }, [user, authLoading]);

    React.useEffect(() => {
        if (!unitId) return;

        const subscriptions = [];
        let cancelled = false;

        async function fetchAssignments() {
            const client = getAmplifyClient();
            try {
                const { data: initialAssignments, errors } = await client.models.Assignment.list({
                    filter: { unitID: { eq: unitId } }
                });
                if (cancelled) return;
                if (errors?.length) console.error('[SectionContext] Assignment fetch errors:', errors);

                const validItems = (initialAssignments || []).filter(item => item != null && item.id != null);
                dispatch({ type: actionTypes.SET_ASSIGNMENTS, payload: validItems });

                if (cancelled) return;

                const createSub = client.models.Assignment.onCreate({
                    filter: { unitID: { eq: unitId } }
                }).subscribe({
                    next: (response) => {
                        const newAssignment = response?.data;
                        if (!newAssignment || !newAssignment.id) return;
                        dispatch({ type: actionTypes.ADD_ASSIGNMENT, payload: newAssignment });
                    },
                    error: (error) => handleSubscriptionError('Assignment onCreate', error)
                });
                subscriptions.push(createSub);

                const updateSub = client.models.Assignment.onUpdate({
                    filter: { unitID: { eq: unitId } }
                }).subscribe({
                    next: (response) => {
                        const updated = response?.data;
                        if (!updated || !updated.id) return;
                        dispatch({ type: actionTypes.UPDATE_ASSIGNMENT, payload: updated });
                    },
                    error: (error) => handleSubscriptionError('Assignment onUpdate', error)
                });
                subscriptions.push(updateSub);

                const deleteSub = client.models.Assignment.onDelete({
                    filter: { unitID: { eq: unitId } }
                }).subscribe({
                    next: (response) => {
                        const deleted = response?.data;
                        if (!deleted || !deleted.id) return;
                        dispatch({ type: actionTypes.DELETE_ASSIGNMENT, payload: deleted.id });
                    },
                    error: (error) => handleSubscriptionError('Assignment onDelete', error)
                });
                subscriptions.push(deleteSub);
            } catch (error) {
                console.error('[SectionContext] fetchAssignments error:', error);
            }
        }

        fetchAssignments();

        return () => {
            cancelled = true;
            subscriptions.forEach(sub => sub.unsubscribe());
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
            
            dispatch({ type: actionTypes.SET_SECTIONS, payload: validItems });
        } catch (error) {
            console.error('[SectionContext] Refetch error:', error);
        }
    }, []);

    // Memoize context value to prevent unnecessary rerenders
    const contextValue = React.useMemo(() => ({
        sections: state.sections,
        sectionMap: state.sectionMap,
        assignments: state.assignments,
        refetchSections,
    }), [state.sections, state.sectionMap, state.assignments, refetchSections]);


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
