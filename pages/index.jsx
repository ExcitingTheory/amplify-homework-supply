import React, { useEffect, useState } from "react";
import { getAmplifyClient } from "../src/utils/amplifyClient";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config';

import {
  Button,
  Box,
  Typography,
  AppBar,
  Card,
  CardContent,
  CardMedia,
  Chip,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MainToolbar from '../src/components/MainToolbar'
import MyAuth from "../src/components/authenticator";
import { useRouter } from 'next/router'
import getCachedUrl from '../src/utils/getCachedUrl'
import HistoryIcon from '@mui/icons-material/History';
import AverageIcon from '@mui/icons-material/Timeline';
import HighIcon from '@mui/icons-material/ArrowUpward';
import StarIcon from '@mui/icons-material/Star';
import { FilesProvider } from "../src/context/fileContext";


function getColor(grade = 0) {
  let gradeColor =''

  if(Math.round(grade) > 80){
    gradeColor = 'success'
  } else if(Math.round(grade) > 60){
    gradeColor = 'warning'
  } else if(Math.round(grade) > 50){
    gradeColor = 'error'
  }

  return gradeColor
}


function CardMediaComponent({ s3Key, identityId, level = 'protected', filter = null, grade = null }) {
  const [url, setUrl] = React.useState(null);

  React.useEffect(() => {

    const asyncFunc = async () => {
      console.log('s3Key', s3Key, level, identityId)
      const _url = await getCachedUrl(s3Key, level, identityId)
      setUrl(_url);
    }

    asyncFunc();

  }, [s3Key]);


  console.log('CardMediaComponent', url)
  console.log('CardMediaComponent.filter', filter)


  return (

    <CardMedia
      component="img"
      sx={{
        width: url ? 400 : 151,
        alignSelf: 'left',
        filter: filter,
      }}
      image={url}
    // alt="Live from space album cover"
    />

  )
}



function Index({ signOut, user }) {
  const { t } = useTranslation('pages');
  /**
   * Grades is a page that displays a list of grades.
   * For Instructor users, it displays a list of grades organized by section like a gradebook but for all users in the section.
   * Section id is passed in as a query parameter.
   * For Student users, it displays a list of grades organized by section like a gradebook, but only for their own grades.
   */
  console.log('[Index] Component render, user:', user);
  const [grades, setGrades] = useState([])
  const [sections, setSections] = useState([])
  const [mySections, setMySections] = useState([])
  const [work, setIsWorking] = useState(false)
  const [assignments, setAssignment] = useState([])
  const [myAssignments, setMyAssignment] = useState([])
  const [units, setUnits] = useState([])
  const router = useRouter()
  // const { id } = router.query

  const [myGradeMap, setMyGradeMap] = React.useState([])
  const [myGrades, setMyGrades] = React.useState([])
  const [myAssignmentNeedsGrading, setMyAssignmentNeedsGrading] = React.useState([])

  useEffect(() => {
    if (!user?.username) return;
    const client = getAmplifyClient();
    const myUserId = user.username;
    
    const subscription = client.models.Grade.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('[Index] Grade subscription update:', items.length, 'grades');
        
        // Process my grades (complete only)
        const myCompletedGrades = items.filter(g => g.complete === true && g.owner === myUserId);
        setMyGrades(myCompletedGrades);
        console.log('fetchMyGrades', myCompletedGrades);

        // grades by assignment
        // look for the last grade for each assignment
        // look for the highest grade for each assignment
        const gradesByUnit = {};

        myCompletedGrades.forEach((grade) => {
          if (!gradesByUnit[grade.unitID]) {
            gradesByUnit[grade.unitID] = {
              last: grade,
              highest: grade,
              sum: 0,
              count: 0,
              accuracy: 0,
            };
          }

          if (grade.updatedAt > gradesByUnit[grade.unitID].last.updatedAt) {
            gradesByUnit[grade.unitID].last = grade;
          }

          if (grade.accuracy > gradesByUnit[grade.unitID].highest.accuracy) {
            gradesByUnit[grade.unitID].highest = grade;
          }

          gradesByUnit[grade.unitID].sum += grade.accuracy;
          gradesByUnit[grade.unitID].count += 1;

          if (gradesByUnit[grade.unitID].count > 0) {
            gradesByUnit[grade.unitID].average = gradesByUnit[grade.unitID].sum / gradesByUnit[grade.unitID].count;
          } else {
            gradesByUnit[grade.unitID].average = 0;
          }
        });

        console.log('gradesByUnit', gradesByUnit);
        setMyGradeMap(gradesByUnit);
        setGrades(items);
      },
      error: (error) => {
        console.error('[Index] Grade subscription error:', error);
      }
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username])

  // Consolidated Assignment observer - handles both my and others' assignments
  useEffect(() => {
    if (!user?.username) return;
    const client = getAmplifyClient();
    const myUserId = user.username;
    
    const subscription = client.models.Assignment.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('[Index] Assignment subscription update:', items.length, 'assignments');
        
        const myAssignments = items.filter(a => a.owner === myUserId);
        const othersAssignments = items.filter(a => a.owner !== myUserId);
        console.log('assignmentData', othersAssignments);

        const needsGrading = [];
        othersAssignments.forEach((assignment) => {
          const gradesForAssignment = myGradeMap[assignment?.unitID];
          console.log('gradesForAssignment', gradesForAssignment);
          if (!gradesForAssignment?.last?.accuracy) {
            needsGrading.push(assignment);
          }
        });

        console.log('needsGrading', needsGrading);
        setMyAssignmentNeedsGrading(needsGrading);
        setMyAssignment(myAssignments);
        setAssignment(othersAssignments);
      },
      error: (error) => {
        console.error('[Index] Assignment subscription error:', error);
      }
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username, units, JSON.stringify(myGradeMap)])

  // Consolidated Section observer - handles both my and others' sections
  useEffect(() => {
    console.log('[Index] Section useEffect triggered, user?.username:', user?.username);
    if (!user?.username) return;
    const client = getAmplifyClient();
    const myUserId = user.username;
    const myGroups = user.groups || []; // Cognito groups the user belongs to
    
    const subscription = client.models.Section.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('[Index] Section subscription update:', items.length, 'sections');
        console.log('[Index] Fetching sections for user:', myUserId, 'groups:', myGroups);
        console.log('[Index] Received sections:', items.length, items);
        
        // Sections I own (I'm the instructor)
        const mySections = items.filter(s => s.owner === myUserId);
        // Sections where I'm a student (I'm in the learner group)
        const othersSections = items.filter(s => 
          s.owner !== myUserId && s.learner && myGroups.includes(s.learner)
        );
        
        console.log('[Index] mySections:', mySections.length, 'othersSections (where I am in learner group):', othersSections.length);
        setMySections(mySections);
        setSections(othersSections);
      },
      error: (error) => {
        console.error('[Index] Section subscription error:', error);
      }
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [user?.username])

  useEffect(() => {
    const client = getAmplifyClient();
    
    const subscription = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('[Index] Unit subscription update:', items.length, 'units');
        const unitsById = {};
        items.forEach(function (unit) {
          unitsById[unit.id] = unit;
        });
        setUnits(unitsById);
      },
      error: (error) => {
        console.error('[Index] Unit subscription error:', error);
      }
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [])

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
          <Box sx={{ flexGrow: 1, margin: '1rem' }} >
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('index.title')}
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Box
        style={{
          padding: '2rem 1rem',
        }}>


        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            margin: '1rem auto',
          }}


        >





          {(assignments?.length > 0 && myAssignmentNeedsGrading?.length > 0 && units) &&
            <Box
              style={{
                padding: '1rem',
                marginBottom: '3rem',
                margin: '1rem auto',
                maxWidth: '80rem',
              }}>
              <Typography variant="h3" component="div" sx={{
                flexGrow: 1, padding: '1rem',
                margin: '1rem auto',

              }}>
                {t('index.assignments')}
              </Typography>


              {
                assignments?.map(function (assignment, index) {
                  console.log('(assignments && units).assignment', assignment)
                  console.log('(assignments && units).units', units)
                  // get local time from UTC
                  // get timezone from client browser
                  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  // get timezone from user profile TBD
                  // Convert time
                  const localTime = new Date(assignment.dueDate).toLocaleString(undefined, {
                    timeZone
                  });

                  const itemPrimary = `${localTime} - ${units[assignment.unitID]?.name}`
                  const itemSecondary = units[assignment.unitID]?.description
                  const featuredImage = units[assignment.unitID]?.featuredImage
                  const identityId = units[assignment.unitID]?.identityId

                  const workbookUrl = `/workbook/${assignment.unitID}`
                  const unitUrl = `/unit/${assignment.unitID}`


                  const gradesForUnit = myGradeMap[assignment?.unitID]

                  console.log('gradesForUnit', gradesForUnit)

                  if (gradesForUnit?.last?.accuracy) return null


                  return (
                    <>

                      <Card
                        key={index}
                        elevation={2}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',
                          borderRadius: 2,
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
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
                              {itemPrimary}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                              {itemSecondary}
                            </Typography>
                          </CardContent>


                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>

                            <Button
                              variant="outlined"
                              color="primary"
                              href={workbookUrl}
                              disabled={work}
                              startIcon={<EditNoteIcon />}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: 2,
                                '&:hover': {
                                  boxShadow: 4,
                                },
                              }}
                            >
                              {t('index.viewWorkbook')}
                            </Button>

                          </Box>
                        </Box>
                        {/* <CardMedia
                                component="img"
                                sx={{ width: 151 }}
                                image="/static/images/cards/live-from-space.jpg"
                                alt="Live from space album cover"
                              /> */}
                        {featuredImage &&
                          <CardMediaComponent
                            s3Key={featuredImage}
                            identityId={identityId}
                          />
                        }


                      </Card>


                    </>


                  )
                })
              }
            </Box>
          }

          {(assignments?.length > 0 && units && Object.values(myGradeMap).length > 0) &&
            <Box
              style={{
                padding: '1rem',
                marginBottom: '3rem',
                margin: '1rem auto',
                maxWidth: '80rem',
              }}>
              <Typography variant="h3" component="div" sx={{
                flexGrow: 1, padding: '1rem',
                margin: '1rem auto',

              }}>
                {t('index.completedAssignments')}
              </Typography>


              {
                assignments?.map(function (assignment, index) {
                  console.log('(assignments && units).assignment', assignment)
                  console.log('(assignments && units).units', units)
                  // get local time from UTC
                  // get timezone from client browser
                  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  // get timezone from user profile TBD
                  // Convert time
                  const localTime = new Date(assignment.dueDate).toLocaleString(undefined, {
                    timeZone
                  });
                  const itemPrimary = `${localTime} - ${units[assignment.unitID]?.name}`
                  const itemSecondary = units[assignment.unitID]?.description
                  const featuredImage = units[assignment.unitID]?.featuredImage
                  const identityId = units[assignment.unitID]?.identityId

                  const workbookUrl = `/workbook/${assignment.unitID}`
                  const unitUrl = `/unit/${assignment.unitID}`


                  const gradesForUnit = myGradeMap[assignment?.unitID]

                  console.log('gradesForUnit', gradesForUnit)

                  if (!gradesForUnit?.last?.accuracy) return null

                  // let boxShadow = '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)'

                  // if(Math.round(gradesForUnit?.average) > 80){
                  //   boxShadow = '0px 3px 3px -2px rgba(46, 125, 3,0.7), 0px 3px 4px 0px rgba(46, 125, 3,0.7), 0px 1px 8px 0px rgba(46, 125, 3,0.7)'
                  // } else if(Math.round(gradesForUnit?.average) > 60){
                  //   boxShadow = '0px 3px 3px -2px rgba(237, 108, 2,0.7), 0px 3px 4px 0px rgba(237, 108, 2,0.7), 0px 1px 8px 0px rgba(237, 108, 2,0.7)'
                  // } else if(Math.round(gradesForUnit?.average) > 50){
                  //   boxShadow = '0px 3px 3px -2px rgba(255,23,68,0.7), 0px 3px 4px 0px rgba(255,23,68,0.7), 0px 1px 8px 0px rgba(255,23,68,0.7)'
                  // }

                  // Determine border color based on grade
                  const getBorderColor = (accuracy) => {
                    if (accuracy >= 90) return 'success.main';
                    if (accuracy >= 80) return 'info.main';
                    if (accuracy >= 70) return 'warning.main';
                    return 'error.main';
                  };

                  return (
                    <>

                      <Card
                        data-tour="grade-card"
                        key={index}
                        elevation={2}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',
                          borderRadius: 2,
                          borderLeft: '4px solid',
                          borderLeftColor: getBorderColor(gradesForUnit?.highest?.accuracy || 0),
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
                              {itemPrimary}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                              {itemSecondary}
                            </Typography>
                          </CardContent>
                          {gradesForUnit?.last?.accuracy &&
                            <>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                flexWrap: 'wrap',
                                gap: 1,
                                pl: 2, 
                                pb: 1 
                              }}>
                                <Chip 
                                  icon={<HighIcon />}
                                  color={getColor(gradesForUnit?.highest?.accuracy)}
                                  label={`Highest ${Math.round(gradesForUnit?.highest?.accuracy) || 0}%`}
                                  sx={{ fontWeight: 600 }}
                                />
                                <Chip 
                                  icon={<StarIcon/>}
                                  variant="outlined"
                                  color="primary"
                                  label={`Level ${gradesForUnit?.count || 0}`}
                                  sx={{ fontWeight: 600 }}
                                />

                                {/* <Badge
                                  // anchorOrigin={{
                                  //   vertical: 'bottom',
                                  //   horizontal: 'left',
                                  // }}
                                  // color="inherit"
                                  style={{
                                    margin: '0 1rem 0 0',
                                  }}
                                  badgeContent={`${gradesForUnit?.count || 0}`}>
                                  <StarIcon />
                                </Badge> */}

                              </Box>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1,
                                pl: 2, 
                                pb: 1 
                              }}>
                                <Chip 
                                  icon={<HistoryIcon />}
                                  color={getColor(gradesForUnit?.last?.accuracy)}
                                  label={`Last ${Math.round(gradesForUnit?.last?.accuracy) || 0}%`}
                                  sx={{ fontWeight: 600 }}
                                />
                                <Chip 
                                  icon={<AverageIcon />}
                                  color={getColor(gradesForUnit?.average)}
                                  label={`Average ${Math.round(gradesForUnit?.average) || 0}%`}
                                  sx={{ fontWeight: 600 }}
                                />

                              </Box>
                            </>
                          }

                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>

                            <Button
                              variant="outlined"
                              color="primary"
                              href={workbookUrl}
                              disabled={work}
                              startIcon={<EditNoteIcon />}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: 2,
                                '&:hover': {
                                  boxShadow: 4,
                                },
                              }}
                            >
                              {t('index.viewWorkbook')}
                            </Button>

                          </Box>
                        </Box>
                        {/* <CardMedia
                                component="img"
                                sx={{ width: 151 }}
                                image="/static/images/cards/live-from-space.jpg"
                                alt="Live from space album cover"
                              /> */}
                        {featuredImage &&
                          <CardMediaComponent
                            s3Key={featuredImage}
                            identityId={identityId}
                            filter={'grayscale(1)'}
                          />
                        }


                      </Card>


                    </>


                  )
                })
              }
            </Box>
          }



          {(myAssignments?.length > 0 && units) &&
            <Box
              style={{
                padding: '1rem',
                marginBottom: '3rem',
                margin: '1rem auto',
                maxWidth: '80rem',
              }}>
              <Typography variant="h3" component="div" sx={{
                flexGrow: 1, padding: '1rem',
                margin: '1rem auto',

              }}>
                {t('index.myAssignments')}
              </Typography>


              {
                myAssignments?.map(function (assignment, index) {

                  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  // get timezone from user profile TBD
                  // Convert time
                  const localTime = new Date(assignment.dueDate).toLocaleString(undefined, {
                    timeZone
                  });


                  const itemPrimary = `${localTime} - ${units[assignment.unitID]?.name}`
                  const itemSecondary = units[assignment.unitID]?.description
                  const featuredImage = units[assignment.unitID]?.featuredImage
                  const owner = units[assignment.unitID]?.owner

                  const workbookUrl = `/workbook/${assignment.unitID}`
                  const unitUrl = `/unit/${assignment.unitID}`

                  return (
                    <>

                      <Card
                        elevation={2}
                        key={index}
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
                              {itemPrimary}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                              {itemSecondary}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>

                            <Button
                              variant="outlined"
                              href={workbookUrl}
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
                              {t('index.viewWorkbook')}
                            </Button>

                            <Button
                              variant="outlined"
                              href={unitUrl}
                              disabled={work}
                              startIcon={<EditIcon />}
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
                              {t('index.editUnit')}
                            </Button>

                          </Box>
                        </Box>
                        {/* <CardMedia
                                component="img"
                                sx={{ width: 151 }}
                                image="/static/images/cards/live-from-space.jpg"
                                alt="Live from space album cover"
                              /> */}
                        {featuredImage &&
                          <CardMediaComponent
                            s3Key={featuredImage}
                            owner={owner}
                          />
                        }


                      </Card>


                    </>


                  )
                })
              }
            </Box>
          }

          {(sections?.length == 0 && mySections?.length == 0) &&
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
                    {t('index.noSectionsYet')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      href='sections'
                      disabled={work}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                      }}
                    >
                      {t('index.joinSection')}
                    </Button>

                    <Button
                      variant="outlined"
                      color="primary"
                      href='sections'
                      disabled={work}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                      }}
                    >
                      {t('index.createNewSection')}
                    </Button>
                  </Box>
                </CardContent>
              </Box>
            </Card>

          }
          {mySections?.length > 0 &&

            <Box
              style={{
                padding: '1rem',
                marginBottom: '3rem',
                margin: '1rem auto',
                maxWidth: '80rem',
              }}>
              <Typography variant="h3" component="div" sx={{
                flexGrow: 1, padding: '1rem',
                margin: '1rem auto',

              }}>
                {t('index.mySections')}
              </Typography>


              {
                mySections?.map(function (section, index) {

                  return (
                    <>

                      <Card
                        key={index}
                        elevation={2}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: 'ƒ',
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
                              {section?.name || t('index.untitledSection')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                              {section?.description || t('index.noDescription')}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>

                            <Button
                              variant="outlined"
                              href={`section/${section.id}`}
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
                              {t('index.viewSection')}
                            </Button>

                          </Box>
                        </Box>
                        {/* <CardMedia
                  component="img"
                  sx={{ width: 151 }}
                  image="/static/images/cards/live-from-space.jpg"
                  alt="Live from space album cover"
                /> */}
                        {section?.featuredImage &&
                          <CardMediaComponent
                            s3Key={section.featuredImage}
                            owner={section.owner}
                          />
                        }


                      </Card>


                    </>


                  )
                })
              }
            </Box>

          }

          {sections?.length > 0 &&
            <Box
              style={{
                padding: '1rem',
                marginBottom: '3rem',
                margin: '1rem auto',
                maxWidth: '80rem',
              }}>
              <Typography variant="h3" component="div" sx={{
                flexGrow: 1, padding: '1rem',
                margin: '1rem auto',

              }}>
                {t('index.sections')}
              </Typography>


              {
                sections?.map(function (section, index) {

                  return (
                    <>

                      <Card
                        key={index}
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
                              {section?.name || t('index.untitledSection')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                              {section?.description || t('index.noDescription')}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 1.5 }}>

                            <Button
                              variant="outlined"
                              href={`section/${section.id}`}
                              disabled={work}
                              startIcon={<EditNoteIcon />}
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
                              {t('index.viewSection')}
                            </Button>

                          </Box>
                        </Box>
                        {/* <CardMedia
                              component="img"
                              sx={{ width: 151 }}
                              image="/static/images/cards/live-from-space.jpg"
                              alt="Live from space album cover"
                            /> */}
                        {section?.featuredImage &&
                          <CardMediaComponent
                            s3Key={section.featuredImage}
                            identityId={section.identityId}
                          />
                        }


                      </Card>


                    </>


                  )
                })
              }
            </Box>
          }

        </Box>
      </Box>
    </>
  )
}


function WrappedPage({ signOut, user , ...args }) {
  return (
    <MyAuth>
      <FilesProvider>
        <Index signOut={signOut} user={user} {...args} />
      </FilesProvider>
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


