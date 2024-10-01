import React, { useState, useEffect } from "react";
import { Unit } from "../src/models";
import { DataStore } from 'aws-amplify/datastore';
import {
    Button,
    Box,
    Typography,
    AppBar,
    Card,
    CardContent,
    CardMedia
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/router'
import MainToolbar from '../src/components/MainToolbar'

import MyAuth from "../src/components/authenticator";
import IconEdit from "@mui/icons-material/Edit";
import EditNoteIcon from '@mui/icons-material/EditNote';

import getCachedUrl from '../src/utils/getCachedUrl'

import { fetchAuthSession } from 'aws-amplify/auth'

function CardMediaComponent({ s3Key, identityId, level = 'protected' }) {
    const [url, setUrl] = React.useState(null);


    React.useEffect(() => {

        if (!s3Key) return

        const fetchUrl = async () => {
            const _url = await getCachedUrl(s3Key, level, identityId)
            setUrl(_url);
        }

        fetchUrl();

    }, [s3Key]);

    return (

        <CardMedia
            component="img"
            sx={{
                width: 151,
                alignSelf: 'left',
            }}
            image={url}
        // alt="Live from space album cover"
        />

    )
}

function Units() {
    /**
     * Units is a page that displays a list of units.
     * For Instructor users, it displays a list of units they are teaching.
     * For Student users, it displays a list of units they are enrolled in.
     * For Admin users, it displays a list of all units.
     * 
     * Units can be created by Instructors and Admins.
     * Units can be edited by Instructors and Admins.
     * Units can be deleted by Admins.
     * 
     * Units can be searched by name.
     * Units can be filtered by status (draft, published, inactive, archived).
     * Units can be sorted by name, status, and date created.
     * 
     * Units can be exported as a CSV file.
     * Units can be imported as a CSV file.
     * 
     * Units can be archived by Instructors and Admins.
     * Units can be unarchived by Instructors and Admins.
     * Units can be deleted by Admins.
     * 
     * Units can be copied by Instructors and Admins.
     */
    const [draftUnits, setDraftUnits] = useState([])
    const [publishedUnits, setPublishedUnits] = useState([])
    const [archivedUnits, setArchivedUnits] = useState([])

    const [work, setIsWorking] = useState(false)
    const router = useRouter()


    useEffect(() => {
        fetchPublishedUnits()
        async function fetchPublishedUnits() {
            const unitData = await DataStore.query(Unit, (u) => u.status.eq('PUBLISHED'))
            setPublishedUnits(unitData)
        }
        const subscription = DataStore.observe(Unit).subscribe(() => fetchPublishedUnits())

        return function cleanup() {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        fetchArchivedUnits()
        async function fetchArchivedUnits() {
            const unitData = await DataStore.query(Unit, (u) => u.status.eq('ARCHIVED'))
            setArchivedUnits(unitData)
        }
        const subscription = DataStore.observe(Unit).subscribe(() => fetchArchivedUnits())

        return function cleanup() {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        fetchDraftUnits()
        async function fetchDraftUnits() {
            const unitData = await DataStore.query(Unit, (u) => u.and(u => [
                u.status.ne('ARCHIVED'),
                u.status.ne('PUBLISHED')
            ]))
            setDraftUnits(unitData)
        }
        const subscription = DataStore.observe(Unit).subscribe(() => fetchDraftUnits())

        return function cleanup() {
            subscription.unsubscribe();
        }
    }, [])



    async function createUnit(event) {

        setIsWorking(true)
        event.preventDefault()

        const {
            identityId,
        } = await fetchAuthSession();

        try {
            const newUnit = await DataStore.save(
                new Unit({
                    name: '',
                    description: '',
                    identityId
                })
            );
            console.log('newUnit', newUnit)
            router.push(`/unit/${newUnit.id}`)
            // setIsWorking(false)
        } catch (errors) {
            console.error(errors)
            //   throw new Error(errors[0].message)
        }

        //   setOpen(false);
    }


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
                    <Box sx={{ flexGrow: 1, margin: '1rem' }} />
                </MainToolbar>
            </AppBar>
            <Box
                style={{
                    // padding: '2rem 1rem',
                    marginTop: '3rem'
                }}
            >

                <div style={{
                    margin: '0',
                    padding: '2rem',
                    flexGrow: '1',
                    minWidth: 'min-content',
                    // center the text both horizontally and vertically
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // maxWidth: '50rem'

                }}>
                    <Typography variant="h2" component="div" sx={{
                        flexGrow: 1,
                    }}>
                        Units&nbsp;
                    </Typography>
                    <Button variant="outlined" color="primary" disabled={work} onClick={createUnit}><AddIcon />&nbsp;Create New</Button>
                </div>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        margin: '1rem auto',
                    }}
                >


                    {(publishedUnits.length == 0) &&
                        //embed url to create a new section
                        <Card
                            elevation={3}
                            sx={{
                                display: 'flex',
                                margin: '3rem auto',
                            }}>

                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flex: '1 1 auto', padding: '2rem' }}>
                                    <Typography component="div" variant="h5">
                                        No Published Units Yet
                                        <br />
                                        <Button
                                            variant="text"
                                            color="inherit"
                                            onClick={createUnit}
                                            disabled={work}
                                            style={{

                                                maxWidth: 'fit-content',
                                            }}
                                        >
                                            Create New Unit
                                        </Button>
                                    </Typography>
                                </CardContent>
                            </Box>
                        </Card>

                    }
                    {publishedUnits.length > 0 &&
                        <>
                            <Typography variant="h4" component="div" sx={{
                                flexGrow: 1,
                                width: '80vw',
                                margin: '1rem auto',
                            }}>
                                Published Units
                            </Typography>
                            {
                                publishedUnits.map(function (unit) {
                                    return (

                                        <Card
                                            key={unit.id}
                                            elevation={3}
                                            sx={{
                                                display: 'flex',
                                                margin: '1rem auto',
                                            }}>


                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <CardContent sx={{ flex: '1 1 auto', padding: '2rem' }}>
                                                    <Typography component="div" variant="h5">
                                                        {unit.name || 'Untitled Unit'}
                                                    </Typography>
                                                    <Typography variant="subtitle1" color="text.secondary" component="div"
                                                        sx={{
                                                            width: 'calc(80vw - 151px)',
                                                            wordWrap: 'break-word',
                                                            // float: 'left'
                                                        }}
                                                    >
                                                        {unit.description || ''}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', margin: '0rem 0rem 2rem 2rem' }}>
                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        href={`/workbook/${unit.id}`}
                                                        disabled={work}
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                        }}
                                                    >

                                                        <EditNoteIcon
                                                            style={{
                                                                marginRight: '0.5rem'
                                                            }}
                                                        />
                                                        View Workbook
                                                    </Button>

                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        href={`/unit/${unit.id}`}
                                                        disabled={work}
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                        }}
                                                    >

                                                        <IconEdit
                                                            style={{
                                                                marginRight: '0.5rem'
                                                            }}
                                                        />
                                                        Edit Unit
                                                    </Button>
                                                </Box>
                                            </Box>


                                            <CardMediaComponent
                                                s3Key={unit?.featuredImage}
                                                identityId={unit?.identityId}
                                            />


                                        </Card>
                                    )
                                })
                            }
                        </>
                    }




                    {draftUnits.length > 0 &&
                        <>
                            <Typography variant="h4" component="div" sx={{
                                flexGrow: 1,
                                width: '80vw',
                                margin: '1rem auto',
                            }}>
                                My Drafts
                            </Typography>
                            {
                                draftUnits.map(function (unit) {
                                    return (

                                        <Card
                                            key={unit.id}
                                            elevation={3}
                                            sx={{
                                                display: 'flex',
                                                margin: '1rem auto',
                                            }}>


                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <CardContent sx={{ flex: '1 1 auto', padding: '2rem' }}>
                                                    <Typography component="div" variant="h5">
                                                        {unit.name || 'Untitled Unit'}
                                                    </Typography>
                                                    <Typography variant="subtitle1" color="text.secondary" component="div"
                                                        sx={{
                                                            width: 'calc(80vw - 151px)',
                                                            wordWrap: 'break-word',
                                                            // float: 'left'
                                                        }}
                                                    >
                                                        {unit.description || ''}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', margin: '0rem 0rem 2rem 2rem' }}>
                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        href={`/workbook/${unit.id}`}
                                                        disabled={work}
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                        }}
                                                    >

                                                        <EditNoteIcon
                                                            style={{
                                                                marginRight: '0.5rem'
                                                            }}
                                                        />
                                                        View Workbook
                                                    </Button>

                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        href={`/unit/${unit.id}`}
                                                        disabled={work}
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                        }}
                                                    >

                                                        <IconEdit
                                                            style={{
                                                                marginRight: '0.5rem'
                                                            }}
                                                        />
                                                        Edit Unit
                                                    </Button>
                                                </Box>
                                            </Box>


                                            <CardMediaComponent
                                                s3Key={unit?.featuredImage}
                                                identityId={unit?.identityId}
                                            />


                                        </Card>
                                    )
                                })
                            }
                        </>
                    }

                    {archivedUnits.length > 0 &&
                        <>
                            <Typography variant="h4" component="div" sx={{
                                flexGrow: 1,
                                width: '80vw',
                                margin: '1rem auto',
                            }}>
                                Archived Units
                            </Typography>
                            {
                                archivedUnits.map(function (unit) {
                                    return (

                                        <Card
                                            key={unit.id}
                                            elevation={3}
                                            sx={{
                                                display: 'flex',
                                                margin: '1rem auto',
                                            }}>


                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <CardContent sx={{ flex: '1 1 auto', padding: '2rem' }}>
                                                    <Typography component="div" variant="h5">
                                                        {unit.name || 'Untitled Unit'}
                                                    </Typography>
                                                    <Typography variant="subtitle1" color="text.secondary" component="div"
                                                        sx={{
                                                            width: 'calc(80vw - 151px)',
                                                            wordWrap: 'break-word',
                                                            // float: 'left'
                                                        }}
                                                    >
                                                        {unit.description || ''}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', margin: '0rem 0rem 2rem 2rem' }}>
                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        href={`/workbook/${unit.id}`}
                                                        disabled={work}
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                        }}
                                                    >

                                                        <EditNoteIcon
                                                            style={{
                                                                marginRight: '0.5rem'
                                                            }}
                                                        />
                                                        View Workbook
                                                    </Button>

                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        href={`/unit/${unit.id}`}
                                                        disabled={work}
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                        }}
                                                    >

                                                        <IconEdit
                                                            style={{
                                                                marginRight: '0.5rem'
                                                            }}
                                                        />
                                                        Edit Unit
                                                    </Button>
                                                </Box>
                                            </Box>


                                            <CardMediaComponent
                                                s3Key={unit?.featuredImage}
                                                identityId={unit?.identityId}
                                            />


                                        </Card>
                                    )
                                })
                            }
                        </>
                    }







                </Box>
            </Box></>)
}


function WrappedPage() {
    return (
        <MyAuth>
            <Units />
        </MyAuth>
    )
}

export default WrappedPage
