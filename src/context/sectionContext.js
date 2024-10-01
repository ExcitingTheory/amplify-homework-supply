import React from "react";
import { DataStore } from "aws-amplify/datastore";
import { getCurrentUser } from "aws-amplify/auth";
import { Section, Assignment } from "../models"

const SectionContext = React.createContext();

const SectionProvider = ({ children, unitId }) => {

    const [sections, setSections] = React.useState([]);
    const [sectionMap, setSectionMap] = React.useState([]);
    const [assignments, setAssignments] = React.useState([]);

    React.useEffect(() => {

        async function fetchSections() {
            // const currentUser = await getCurrentUser()
            // const { username } = currentUser

            const {
                username,
              } = await getCurrentUser();

            console.log('SectionProvider username', username)
            const subscription = DataStore.observeQuery(Section,
                s => s.owner.eq(username)
            ).subscribe(({ items }) => {
                console.log("Section.items", items)

                let sectionMap = {}

                items.forEach(item => {
                    sectionMap[item.id] = item
                })

                console.log('sectionMap', sectionMap)

                setSections(items);

                setSectionMap(sectionMap)

            });
            return () => {
                subscription.unsubscribe();
            };
        }


        fetchSections()
    }, []);

    React.useEffect(() => {

        if(!unitId) return

        async function fetchAssignments() {
            const subscription = DataStore.observeQuery(Assignment,
                s => s.unitID.eq(unitId)
            ).subscribe(({ items }) => {
                console.log("assignments.items", items)
                setAssignments(items);
            });
            return () => {
                subscription.unsubscribe();
            };
        }


        fetchAssignments()
    }, [unitId]);


    return (
        <SectionContext.Provider
            value={{
                sections,
                sectionMap,
                assignments,
            }}
        >
            {children}
        </SectionContext.Provider>
    );
}

export { SectionProvider };

export default SectionContext;
