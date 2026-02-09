import React, { useEffect, useState } from "react";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config';
import { getAmplifyClient } from "../src/utils/amplifyClient";
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';

import { createSectionGroup } from '../src/graphql/mutations';
import { fetchAuthSession } from 'aws-amplify/auth';

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
import InstructorDashboard from '../src/components/InstructorDashboard';

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
            width: url ? 400 : 151,
            transition: 'width 0.3s ease-in-out',
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
    const { t } = useTranslation('pages');
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

            const amplifyClient = getAmplifyClient();
            const sectionResponse = await amplifyClient.models.Section.create({
                name: form.get('name').toString(),
                description: form.get('description').toString(),
                code: response.data.createSectionGroup,
                learner: response.data.createSectionGroup,
                identityId
            });
            
            if (sectionResponse.errors) {
                console.error('Error creating section:', sectionResponse.errors);
                throw new Error(sectionResponse.errors[0].message);
            }

            setIsWorking(false);
        } catch (errors) {
            console.error(errors);
            setIsWorking(false);
        }

        setOpen(false);

    }



    useEffect(() => {
        const amplifyClient = getAmplifyClient();
        
        const subscription = amplifyClient.models.Section.observeQuery().subscribe({
            next: ({ items }) => {
                console.log('[Sections] Section subscription update:', items.length, 'sections');
                console.log('sectionData', items);
                setSections(items);
            },
            error: (error) => {
                console.error('[Sections] Section subscription error:', error);
            }
        });

        return function cleanup() {
            subscription.unsubscribe();
        };
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
                data-tour="sections-page"
                style={{
                    padding: '2rem 1rem',
                }}>



                <Dialog 
                    data-tour="section-form"
                    open={open} 
                    onClose={handleClose} 
                    aria-labelledby="form-dialog-title"

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
                        <DialogTitle>{t('sections.newSection.title')}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                {t('sections.newSection.description')}
                            </DialogContentText>
                            <br />


                            <TextField
                                sx={{ width: '100%' }}
                                required
                                id="name"
                                name="name"
                                label={t('sections.newSection.nameLabel')}
                                variant="outlined"
                            /><br /><br />
                            <TextField
                                sx={{ width: '100%' }}
                                required
                                multiline
                                rows={4}
                                id="description"
                                name="description"
                                label={t('sections.newSection.descriptionLabel')}
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
                                {t('sections.newSection.cancel')}
                            </Button>
                            <Button disabled={work} type="submit" variant="contained">
                                {t('sections.newSection.create')}
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
                            {t('sections.title')}&nbsp;
                        </Typography>
                        <Button 
                            data-tour="create-section-button"
                            variant="outlined" 
                            color="primary" 
                            disabled={work} 
                            onClick={handleClickOpen}
                        >
                            <AddIcon />&nbsp;{t('sections.createNew')}
                        </Button>
                    </div>
                    
                    {/* Instructor Dashboard with aggregate stats and leaderboards */}
                    {sections.length > 0 && <InstructorDashboard sections={sections} />}
                    
                    {!sections &&
                        <div>{t('sections.loading')}</div>
                    }

{sections.length == 0 &&
            //embed url to create a new section
            <Card
              elevation={3}
              sx={{
                display: 'flex',
                margin: '1rem auto',
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
                    {t('sections.noSectionsYet')}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleClickOpen}
                    disabled={work}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    {t('sections.createNewSection')}
                  </Button>
                </CardContent>
              </Box>
            </Card>

          }
                    {sections &&
                        sections.map(function (section) {
                            console.log('!!!section', section)
                            return (


                                <Card
                                    key={section.id}
                                    data-tour="section-card"
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
                                                {section?.name || t('sections.untitledSection')}
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                                                {section?.description || ''}
                                            </Typography>
                                        </CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>
                                            <Button
                                                variant="outlined"
                                                href={`/section/${section.id}`}
                                                disabled={work}
                                                startIcon={<PeopleIcon />}
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
                                                {t('sections.viewSection')}
                                            </Button>
                                        </Box>
                                    </Box>
                                    {section?.featuredImage &&
                                        <CardMediaComponent
                                            s3Key={section?.featuredImage}
                                            identityId={section?.identityId}
                                        />
                                    }

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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components'], nextI18nextConfig)),
    },
  }
}
