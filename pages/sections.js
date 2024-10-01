import React, { useEffect, useState } from "react";
import { Section } from "../src/models";
import { DataStore } from 'aws-amplify/datastore';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';

import { createSectionGroup } from '../src/graphql/mutations';

import { fetchAuthSession } from '@aws-amplify/auth';

import PeopleIcon from '@mui/icons-material/People';


import {
    Button,
    Box,
    AppBar,
    Card,
    Typography,
    TextField,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CardContent,
    CardMedia,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';

import MainToolbar from '../src/components/MainToolbar'
import MyAuth from "../src/components/authenticator";
import getCachedUrl from "../src/utils/getCachedUrl";

const client = generateClient();


function CardMediaComponent({ s3Key, identityId, level = 'protected' }) {
    const [url, setUrl] = React.useState(null);

    console.log('CardMediaComponent.s3Key', s3Key)
    console.log('CardMediaComponent.identityId', identityId)
    console.log('CardMediaComponent.level', level)
  
  
    React.useEffect(() => {
  
      const asyncFunc = async () => {
        const _url = await getCachedUrl(s3Key, level, identityId)
        setUrl(_url);
      }
  
      asyncFunc();
  
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



function Sections() {
    /**
     * Sections is a page that displays a list of sections.
     * For Instructor users, it displays a list of sections they are teaching.
     * For Student users, it displays a list of sections they are enrolled in.
     * For Admin users, it displays a list of all sections.
     * 
     * Sections can be created by Instructors and Admins. 
     * Sections can be edited by Instructors and Admins.
     * Sections can be deleted by Admins.
     * 
     * Sections can be searched by name.
     * Sections can be filtered by status (draft, published, inactive, archived).
     * Sections can be sorted by name, status, and date created.
     * 
     * Sections can be exported as a CSV file.
     * Sections can be imported as a CSV file.
     * 
     * Sections can be archived by Instructors and Admins.
     * Sections can be unarchived by Instructors and Admins.
     * 
     * Sections can be deleted by Admins.
     * 
     * Sections can be copied by Instructors and Admins.
     * 
     */
    const [sections, setSections] = useState([])
    const [work, setIsWorking] = useState(false)
    const [open, setOpen] = React.useState(false);

    console.log('sections', sections)

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    async function handleCreate(event) {
        setIsWorking(true)
        event.preventDefault()

        const currentUser = await getCurrentUser();
        const { username: owner } = currentUser;


        console.log('event', event)

        const form = new FormData(event.target)
        let response

        try {
            const createInput = {
                name: form.get('name').toString(),
                description: form.get('description').toString(),
            }

            console.log('createInput', createInput);

            response = await client.graphql({
                query: createSectionGroup,
                variables: createInput,
            })

            console.log('createSectionGroup.response', response)

        } catch (errors) {
            console.error(errors)
            //   throw new Error(errors[0].message)
        }

        try {
            const {
                identityId,
            } = await fetchAuthSession();

            await DataStore.save(
                new Section({
                    name: form.get('name').toString(),
                    description: form.get('description').toString(),
                    code: response.data.createSectionGroup,
                    learner: response.data.createSectionGroup,
                    identityId
                })
            );

            setIsWorking(false)
        } catch (errors) {
            console.error(errors)
            //   throw new Error(errors[0].message)
        }

        setOpen(false);

    }



    useEffect(() => {
        fetchSections()
        async function fetchSections() {
            const sectionData = await DataStore.query(Section)

            console.log('sectionData', sectionData)
            setSections(sectionData)
        }
        const subscription = DataStore.observe(Section).subscribe(() => fetchSections())

        return function cleanup() {
            subscription.unsubscribe();
        }
    }, [])

    // console.log('sections', sections)

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
                    padding: '2rem 1rem',
                }}>



                <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title"

                    slotProps={{
                        backdrop: {
                            sx: {
                                //Your style here....
                                backdropFilter: 'blur(1px)'
                            },
                        },
                    }}
                >
                    <form onSubmit={handleCreate}>

                        <DialogTitle id="form-dialog-title">New Section</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Create a new Section by entering the following information
                            </DialogContentText>
                            <br />


                            <TextField
                                sx={{ width: '100%' }}
                                required
                                id="name"
                                name="name"
                                label="Name"
                                variant="outlined"
                            /><br /><br />
                            <TextField
                                sx={{ width: '100%' }}
                                required
                                multiline
                                rows={4}
                                id="description"
                                name="description"
                                label="Description"
                                variant="outlined"
                            /><br /><br />

                            <br /><br />

                        </DialogContent>
                        <DialogActions
                            sx={{
                                padding: '2rem',                                
                            }}
                        >
                            <Button disabled={work} onClick={handleClose} color="primary" variant="outlined">
                                Cancel
                            </Button>
                            <Button disabled={work} type="submit" variant="contained">
                                Create
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>


                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        margin: '1rem auto',
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
                            Sections&nbsp;
                        </Typography>
                        <Button variant="outlined" color="primary" disabled={work} onClick={handleClickOpen}><AddIcon />&nbsp;Create New</Button>
                    </div>
                    {!sections &&
                        <div>Loading...</div>
                    }

{sections.length == 0 &&
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
                    No Sections Yet
                    <br />
                    <Button
                      variant="text"
                      color="inherit"
                      onClick={handleClickOpen}
                      disabled={work}
                      style={{

                        maxWidth: 'fit-content',
                      }}
                    >
                      Create New Section
                    </Button>
                  </Typography>
                </CardContent>
              </Box>
            </Card>

          }
                    {sections &&
                        sections.map(function (section) {
                            console.log('!!!section', section)
                            return (


                                <Card
                                    elevation={3}
                                    key={section.id}
                                    sx={{
                                        display: 'flex',
                                        margin: '1rem auto',
                                    }}>

                                    
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <CardContent sx={{ flex: '1 1 auto', padding: '2rem' }}>
                                            <Typography component="div" variant="h5">
                                                {section?.name || 'Untitled Section'}

                                                {/* <Button
            variant="text"
            color="inherit"
            href={`/section/${section.id}`}
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
            View {section.name || 'Untitled Section'}
          </Button> */}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary" component="div"
                                                sx={{
                                                    // textWrap: 'wrap',
                                                    // display: 'flex',
                                                    // flexDirection: 'row',
                                                    // flexGrow: 1,
                                                    width: 'calc(80vw - 151px)',
                                                    wordWrap: 'break-word',
                                                    // float: 'left'
                                                }}
                                            >
                                                {section?.description || ''}
                                            </Typography>
                                        </CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '0rem 0rem 2rem 2rem' }}>
                                            {/* <IconButton aria-label="previous">
            {theme.direction === 'rtl' ? <SkipNextIcon /> : <SkipPreviousIcon />}
          </IconButton> */}

                                            <Button
                                                variant="text"
                                                color="inherit"
                                                href={`/section/${section.id}`}
                                                disabled={work}
                                                style={{
                                                    maxWidth: 'fit-content',
                                                }}
                                            >

                                                <PeopleIcon
                                                    style={{
                                                        marginRight: '0.5rem'
                                                    }}
                                                />
                                                View Section
                                            </Button>

                                            {/* <IconButton aria-label="next">
            {theme.direction === 'rtl' ? <SkipPreviousIcon /> : <SkipNextIcon />}
          </IconButton> */}
                                        </Box>
                                    </Box>

                                    <CardMediaComponent
                                        s3Key={section?.featuredImage}
                                        identityId={section?.identityId}
                                    />

                                </Card>
                            )
                        })
                    }
                </Box>
            </Box>
        </>
    )
}


function WrappedPage() {
    return (
        <MyAuth>
            <Sections />
        </MyAuth>
    )
}

export default WrappedPage
