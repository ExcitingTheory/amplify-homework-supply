import React, { useEffect, useState } from "react";
import { getAmplifyClient } from "../src/utils/amplifyClient";

import {
    Button,
    Box,
    Typography,
    AppBar,
    Card,
    Container,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from '../src/Link';

import MainToolbar from '../src/components/MainToolbar'

import MyAuth from "../src/components/authenticator";

import { useRouter } from 'next/router'

function Grades({ signOut, user }) {
    /**
     * Grades is a page that displays a list of grades.
     * For Instructor users, it displays a list of grades organized by section like a gradebook but for all users in the section.
     * Section id is passed in as a query parameter.
     * For Student users, it displays a list of grades organized by section like a gradebook, but only for their own grades.
     */
    const [grades, setGrades] = useState([])
    const [sections, setSections] = useState([])
    const [mySections, setMySections] = useState([])
    const [work, setIsWorking] = useState(false)
    const router = useRouter()

    const { id } = router.query

    const assignments = []

    useEffect(() => {
        const client = getAmplifyClient();
        
        const subscription = client.models.Grade.observeQuery().subscribe({
            next: ({ items }) => {
                console.log('[Grades] Grade subscription update:', items.length, 'grades');
                setGrades(items);
            },
            error: (error) => {
                console.error('[Grades] Grade subscription error:', error);
            }
        });

        return function cleanup() {
            subscription.unsubscribe();
        };
    }, [])

    useEffect(() => {
        if (!user?.username) return;
        const client = getAmplifyClient();
        const myUserId = user.username;
        
        const subscription = client.models.Section.observeQuery().subscribe({
            next: ({ items }) => {
                console.log('[Grades] Section subscription update (others):', items.length, 'sections');
                // Filter client-side for sections not owned by me
                const othersSections = items.filter(s => s.owner !== myUserId);
                setSections(othersSections);
            },
            error: (error) => {
                console.error('[Grades] Section subscription error:', error);
            }
        });

        return function cleanup() {
            subscription.unsubscribe();
        };
    }, [user?.username])

    useEffect(() => {
        if (!user?.username) return;
        const client = getAmplifyClient();
        const myUserId = user.username;
        
        const subscription = client.models.Section.observeQuery().subscribe({
            next: ({ items }) => {
                console.log('[Grades] Section subscription update (mine):', items.length, 'sections');
                // Filter client-side for sections owned by me
                const mySections = items.filter(s => s.owner === myUserId);
                setMySections(mySections);
            },
            error: (error) => {
                console.error('[Grades] My Section subscription error:', error);
            }
        });

        return function cleanup() {
            subscription.unsubscribe();
        };
    }, [user?.username])

    console.log('Grades.grades', grades)

    return (
        <>
            <AppBar
                position="fixed"
                color="default"
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.72)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <MainToolbar>
                    <Box sx={{ flexGrow: 1, margin: '1rem' }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Grades
                        </Typography>
                    </Box>
                </MainToolbar>
            </AppBar>

            {/**
         * Display the users individual grades.
         * 
         * Grades should be displayed in a table with rows for each assignment
         * and column for the best grade and the most recent grade
         * 
         * 
         */}

            <Container

                style={{
                    padding: '2rem 1rem',
                    marginTop: '3rem'
                }}>
                {/* <h1>hello {user.username}</h1>
            <button onClick={signOut}>Sign Out</button> */}

                <h1>Grades</h1>

                <Box>
                    {!grades &&
                        <div>Loading...</div>
                    }






                    {/**
        * If the user has sections, display a list of sections to choose from.
        */}

                    <Container
                        style={{
                            padding: '2rem 1rem',
                            marginTop: '3rem'
                        }}>

                        {
                            !sections &&
                            <div>Loading...</div>

                        }
                        {
                            sections &&
                            <>
                                <h1>Sections</h1>
                                <>
                                    {sections.map((section, index) => (
                                        <Card

                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'left',
                                                alignItems: 'left',
                                                width: '100%',
                                                height: '100%',
                                                padding: '1rem',
                                                margin: '1rem',
                                                borderRadius: '5px',
                                                border: '1px solid #ccc',
                                                boxShadow: '0 0 3px rgba(0,0,0,0.1)'

                                            }}
                                            key={index}
                                        >
                                            <Link href={`/section/${section.id}`}>
                                                {section.name}
                                                <br />
                                                {section.description}
                                            </Link>
                                        </Card>
                                    ))}
                                </>
                            </>

                        }

                        {
                            mySections &&
                            <>
                                <h1>My Sections</h1>
                                <>
                                    {mySections.map((section, index) => (
                                        <Card

                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'left',
                                                alignItems: 'left',
                                                width: '100%',
                                                height: '100%',
                                                padding: '1rem',
                                                margin: '1rem',
                                                borderRadius: '5px',
                                                border: '1px solid #ccc',
                                                boxShadow: '0 0 3px rgba(0,0,0,0.1)'

                                            }}
                                            key={index}
                                        >
                                            <Link href={`/section/${section.id}`}>
                                                {section.name}
                                                <br />
                                                {section.description}
                                            </Link>
                                        </Card>
                                    ))}
                                </>
                            </>

                        }


                    </Container>
                    {/* <Container
            style={{
                padding: '2rem 1rem',
                marginTop: '3rem'
            }}>

            <h1>hello {user.username}</h1>
            <button onClick={signOut}>Sign Out</button>
    
            <h1>Grades</h1>
    
            <Box>
            {!grades &&
                <div>Loading...</div>
            }
            {/**
             * TODO: This should be a table with columns for each assignment and rows for each student.
             * The table should be sortable by assignment name, student name, and grade.
             * The table should be filterable by assignment name, student name, and grade.
             * The table should be editable by clicking on a grade and changing it.
             * The table should be exportable to CSV.
             * The table should be printable.
             * The table should be able to be saved as a PDF.
             * The table should be able to be saved as an image.
             * The table should be able to be saved as a spreadsheet.
             * The table should be able to be saved as a Word document.
             * The table should be able to be saved as a Google Doc.
             * The table should be able to be saved as a PDF.
             */}

                    {
                        /**
                         * TODO: This should be a table with columns for each assignment and rows for each student.
                         */
                    }
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Assignment</th> {/**
                             * TODO This should be a column for each assignment.
                             */}
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments &&
                                assignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>{assignment.student}</td> {/**
                                 * TODO Look up the student's name from the student's ID.*/}

                                        <td>{assignment.name}</td>
                                        {/**
                                 * TODO this is the unit name*/}

                                        <td>{assignment.grade}</td> {
                                            /**
                                             * for each assignment, look up the grade for the student and display it here.*/
                                        }
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                </Box>
            </Container>
        </>
    )
}


function WrappedPage() {
    return (
        <MyAuth>
            <Grades />
        </MyAuth>
    )
}

export default WrappedPage

