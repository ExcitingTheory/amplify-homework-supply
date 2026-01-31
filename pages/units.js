import React, { useState, useEffect } from "react";
import { getAmplifyClient } from "../src/utils/amplifyClient";
import { useTranslation } from 'react-i18next';
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
                width: url ? 400 : 151,
                alignSelf: 'left',
            }}
            image={url}
        // alt="Live from space album cover"
        />

    )
}

function Units() {
    const { t } = useTranslation('pages');
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


    // Consolidated Unit observer - handles published, archived, and draft units with client-side filtering
    useEffect(() => {
        const client = getAmplifyClient();
        
        const subscription = client.models.Unit.observeQuery().subscribe({
            next: ({ items }) => {
                console.log('[Units] Unit subscription update:', items.length, 'units');
                
                // Filter client-side by status
                const published = items.filter(u => u.status === 'PUBLISHED');
                const archived = items.filter(u => u.status === 'ARCHIVED');
                const draft = items.filter(u => u.status !== 'ARCHIVED' && u.status !== 'PUBLISHED');
                
                setPublishedUnits(published);
                setArchivedUnits(archived);
                setDraftUnits(draft);
            },
            error: (error) => {
                console.error('[Units] Unit subscription error:', error);
            }
        });

        return function cleanup() {
            subscription.unsubscribe();
        };
    }, [])



    async function createUnit(event) {

        setIsWorking(true)
        event.preventDefault()

        const {
            identityId,
        } = await fetchAuthSession();

        try {
            const client = getAmplifyClient();
            const response = await client.models.Unit.create({
                name: '',
                description: '',
                identityId
            });
            
            if (response.errors) {
                console.error('Error creating unit:', response.errors);
                throw new Error(response.errors[0].message);
            }
            
            console.log('newUnit', response.data);
            router.push(`/unit/${response.data.id}`);
        } catch (errors) {
            console.error(errors);
            setIsWorking(false);
        }
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
                        {t('units.title')}&nbsp;
                    </Typography>
                    <Button variant="outlined" color="primary" disabled={work} onClick={createUnit}><AddIcon />&nbsp;{t('units.createNew')}</Button>
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
                                width: 'fit-content',
                                maxWidth: '500px',
                                minHeight: '300px',
                                borderRadius: 3,
                            }}>

                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexGrow: '1',
                                p: 4,
                            }}>
                                <CardContent sx={{ 
                                    flex: '1 1 auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                }}>
                                    <Typography component="div" variant="h5" sx={{ mb: 3 }}>
                                        {t('units.noPublishedUnits')}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={createUnit}
                                        disabled={work}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            px: 3,
                                            py: 1,
                                            borderRadius: 2,
                                        }}
                                    >
                                        {t('units.createNewUnit')}
                                    </Button>
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
                                {t('units.publishedUnits')}
                            </Typography>
                            {
                                publishedUnits.map(function (unit) {
                                    return (

                                        <Card
                                            key={unit.id}
                                            elevation={2}
                                            sx={{
                                                display: 'flex',
                                                margin: '1rem auto',
                                                width: '90vw',
                                                maxWidth: '80rem',
                                                borderRadius: 2,
                                                borderLeft: '4px solid',
                                                borderLeftColor: 'grey.900',
                                                transition: 'all 0.3s ease-in-out',
                                                '&:hover': {
                                                    elevation: 6,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                },
                                            }}>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flexGrow: '1',
                                                p: 0.5,
                                            }}>
                                                <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
                                                    <Typography component="div" variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {unit.name || 'Untitled Unit'}
                                                    </Typography>
                                                    <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                                                        {unit.description || ''}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>
                                                    <Button
                                                        variant="outlined"
                                                        href={`/workbook/${unit.id}`}
                                                        disabled={work}
                                                        startIcon={<EditNoteIcon />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 3,
                                                            py: 1,
                                                            mr: 1,
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            color: 'grey.900',
                                                            borderColor: 'grey.900',
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                borderColor: 'grey.900',
                                                                backgroundColor: 'grey.50',
                                                            },
                                                        }}
                                                    >
                                                        View Workbook
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        href={`/unit/${unit.id}`}
                                                        disabled={work}
                                                        startIcon={<IconEdit />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 3,
                                                            py: 1,
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            color: 'grey.900',
                                                            borderColor: 'grey.900',
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                borderColor: 'grey.900',
                                                                backgroundColor: 'grey.50',
                                                            },
                                                        }}
                                                    >
                                                        {t('units.editUnit')}
                                                    </Button>
                                                </Box>
                                            </Box>
                                            {unit?.featuredImage &&
                                                <CardMediaComponent
                                                    s3Key={unit?.featuredImage}
                                                    identityId={unit?.identityId}
                                                />
                                            }


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
                                {t('units.myDrafts')}
                            </Typography>
                            {
                                draftUnits.map(function (unit) {
                                    return (

                                        <Card
                                            key={unit.id}
                                            elevation={2}
                                            sx={{
                                                display: 'flex',
                                                margin: '1rem auto',
                                                width: '90vw',
                                                maxWidth: '80rem',
                                                borderRadius: 2,
                                                borderLeft: '4px solid',
                                                borderLeftColor: 'grey.900',
                                                transition: 'all 0.3s ease-in-out',
                                                '&:hover': {
                                                    elevation: 6,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                },
                                            }}>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flexGrow: '1',
                                                p: 0.5,
                                            }}>
                                                <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
                                                    <Typography component="div" variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {unit.name || t('units.untitledUnit')}
                                                    </Typography>
                                                    <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                                                        {unit.description || ''}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>
                                                    <Button
                                                        variant="outlined"
                                                        href={`/workbook/${unit.id}`}
                                                        disabled={work}
                                                        startIcon={<EditNoteIcon />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 3,
                                                            py: 1,
                                                            mr: 1,
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            color: 'grey.900',
                                                            borderColor: 'grey.900',
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                borderColor: 'grey.900',
                                                                backgroundColor: 'grey.50',
                                                            },
                                                        }}
                                                    >
                                                        {t('units.viewWorkbook')}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        href={`/unit/${unit.id}`}
                                                        disabled={work}
                                                        startIcon={<IconEdit />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 3,
                                                            py: 1,
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            color: 'grey.900',
                                                            borderColor: 'grey.900',
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                borderColor: 'grey.900',
                                                                backgroundColor: 'grey.50',
                                                            },
                                                        }}
                                                    >
                                                        {t('units.editUnit')}
                                                    </Button>
                                                </Box>
                                            </Box>
                                            {unit?.featuredImage &&
                                                <CardMediaComponent
                                                    s3Key={unit?.featuredImage}
                                                    identityId={unit?.identityId}
                                                />
                                            }


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
                                {t('units.archivedUnits')}
                            </Typography>
                            {
                                archivedUnits.map(function (unit) {
                                    return (

                                        <Card
                                            key={unit.id}
                                            elevation={2}
                                            sx={{
                                                display: 'flex',
                                                margin: '1rem auto',
                                                width: '90vw',
                                                maxWidth: '80rem',
                                                borderRadius: 2,
                                                borderLeft: '4px solid',
                                                borderLeftColor: 'grey.900',
                                                transition: 'all 0.3s ease-in-out',
                                                '&:hover': {
                                                    elevation: 6,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                },
                                            }}>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flexGrow: '1',
                                                p: 0.5,
                                            }}>
                                                <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
                                                    <Typography component="div" variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {unit.name || t('units.untitledUnit')}
                                                    </Typography>
                                                    <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                                                        {unit.description || ''}
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>
                                                    <Button
                                                        variant="outlined"
                                                        href={`/workbook/${unit.id}`}
                                                        disabled={work}
                                                        startIcon={<EditNoteIcon />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 3,
                                                            py: 1,
                                                            mr: 1,
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            color: 'grey.900',
                                                            borderColor: 'grey.900',
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                borderColor: 'grey.900',
                                                                backgroundColor: 'grey.50',
                                                            },
                                                        }}
                                                    >
                                                        {t('units.viewWorkbook')}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        href={`/unit/${unit.id}`}
                                                        disabled={work}
                                                        startIcon={<IconEdit />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            px: 3,
                                                            py: 1,
                                                            borderRadius: 2,
                                                            boxShadow: 2,
                                                            color: 'grey.900',
                                                            borderColor: 'grey.900',
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                borderColor: 'grey.900',
                                                                backgroundColor: 'grey.50',
                                                            },
                                                        }}
                                                    >
                                                        {t('units.editUnit')}
                                                    </Button>
                                                </Box>
                                            </Box>
                                            {unit?.featuredImage &&
                                                <CardMediaComponent
                                                    s3Key={unit?.featuredImage}
                                                    identityId={unit?.identityId}
                                                />
                                            }


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
