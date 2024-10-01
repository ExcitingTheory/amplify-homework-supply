import React, { useEffect, useState } from "react";
import { Assignment, Grade, Section, Unit } from "../src/models";
import { DataStore } from 'aws-amplify/datastore';

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
        width: 151,
        alignSelf: 'left',
        filter: filter,
      }}
      image={url}
    // alt="Live from space album cover"
    />

  )
}



function Index({ signOut, user }) {
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
  const [assignments, setAssignment] = useState([])
  const [myAssignments, setMyAssignment] = useState([])
  const [units, setUnits] = useState([])
  const router = useRouter()
  // const { id } = router.query

  const [myGradeMap, setMyGradeMap] = React.useState([])
  const [myGrades, setMyGrades] = React.useState([])
  const [myAssignmentNeedsGrading, setMyAssignmentNeedsGrading] = React.useState([])

  useEffect(() => {
    // if (!id) return
    fetchMyGrades()
    async function fetchMyGrades() {
      const grades = await DataStore.query(Grade, (g) =>
        g.and(g => [
          g.complete.eq(true),
          g.owner.eq(user.username)]))
      setMyGrades(grades)

      console.log('fetchMyGrades', grades)

      // grades by assignment
      // look for the last grade for each assignment
      // look for the highest grade for each assignment
      // limit the grades by the assignment duedae and updated date

      const gradesByUnit = {}

      grades.forEach((grade) => {
        if (!gradesByUnit[grade.unitID]) {
          gradesByUnit[grade.unitID] = {
            last: grade,
            highest: grade,
            sum: 0,
            count: 0,
            accuracy: 0,
          }
        }

        if (grade.updatedAt > gradesByUnit[grade.unitID].last.updatedAt) {
          gradesByUnit[grade.unitID].last = grade
        }

        if (grade.accuracy > gradesByUnit[grade.unitID].highest.accuracy) {
          gradesByUnit[grade.unitID].highest = grade
        }

        gradesByUnit[grade.unitID].sum += grade.accuracy
        gradesByUnit[grade.unitID].count += 1

        if (gradesByUnit[grade.unitID].count > 0) {
          gradesByUnit[grade.unitID].average = gradesByUnit[grade.unitID].sum / gradesByUnit[grade.unitID].count
        } else {
          gradesByUnit[grade.unitID].average = 0
        }

      })

      console.log('gradesByUnit', gradesByUnit)

      setMyGradeMap(gradesByUnit)
    }
    const subscription = DataStore.observe(Grade).subscribe(() => fetchMyGrades())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [])


  useEffect(() => {
    fetchMyAssignments()
    async function fetchMyAssignments() {
      const myUserId = user.username
      const assignmentData = await DataStore.query(Assignment, a => a.owner.eq(myUserId))
      setMyAssignment(assignmentData)
    }
    const subscription = DataStore.observe(Assignment).subscribe(() => fetchMyAssignments())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [units])

  useEffect(() => {
    fetchAssignments()
    async function fetchAssignments() {
      const myUserId = user.username
      const assignmentData = await DataStore.query(Assignment, a => a.owner.ne(myUserId))
      console.log('assignmentData', assignmentData)

      const needsGrading = []

      assignmentData.forEach((assignment) => {
        const gradesForAssignment = myGradeMap[assignment?.unitID]
        console.log('gradesForAssignment', gradesForAssignment)
        if (!gradesForAssignment?.last?.accuracy) {
          needsGrading.push(assignment)
        }
      })

      console.log('needsGrading', needsGrading)
      setMyAssignmentNeedsGrading(needsGrading)
      setAssignment(assignmentData)
    }
    const subscription = DataStore.observe(Assignment).subscribe(() => fetchAssignments())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [units, JSON.stringify(myGradeMap)])

  useEffect(() => {
    fetchGrades()
    async function fetchGrades() {
      const gradeData = await DataStore.query(Grade)
      setGrades(gradeData)
    }
    const subscription = DataStore.observe(Grade).subscribe(() => fetchGrades())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [])

  useEffect(() => {
    fetchSections()
    async function fetchSections() {
      const myUserId = user.username
      const sectionData = await DataStore.query(Section, s => s.owner.ne(myUserId))
      setSections(sectionData)
    }
    const subscription = DataStore.observe(Section).subscribe(() => fetchSections())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [])

  useEffect(() => {
    fetchMySections()
    async function fetchMySections() {
      const myUserId = user.username
      const sectionData = await DataStore.query(Section, s => s.owner.eq(myUserId))
      setMySections(sectionData)
    }
    const subscription = DataStore.observe(Section).subscribe(() => fetchMySections())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [])

  useEffect(() => {
    fetchUnits()
    async function fetchUnits() {
      const unitData = await DataStore.query(Unit)
      const unitsById = {}
      unitData.forEach(function (unit) {
        unitsById[unit.id] = unit
      })
      setUnits(unitsById)
    }
    const subscription = DataStore.observe(Unit).subscribe(() => fetchUnits())

    return function cleanup() {
      subscription.unsubscribe();
    }
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
              Language Supply
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





          {(assignments.length > 0 && myAssignmentNeedsGrading.length > 0 && units) &&
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
                Assignments
              </Typography>


              {
                assignments.map(function (assignment, index) {
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
                        elevation={3}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',
                        }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: '1'
                        }}>
                          <CardContent sx={{ flex: '1 0 auto' }}>
                            <Typography component="div" variant="h5">
                              {itemPrimary}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                              {itemSecondary}
                            </Typography>
                          </CardContent>


                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>

                            <Button
                              variant="text"
                              color="inherit"
                              href={workbookUrl}
                              disabled={work}
                              style={{
                                maxWidth: 'fit-content',
                              }}
                            >
                              <EditNoteIcon />&nbsp;View Workbook
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

          {(assignments.length > 0 && units && Object.values(myGradeMap).length > 0) &&
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
                Completed Assignments
              </Typography>


              {
                assignments.map(function (assignment, index) {
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

                  return (
                    <>

                      <Card
                        key={index}
                        elevation={3}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',
                          // boxShadow,
                        }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: '1'
                        }}>
                          <CardContent sx={{ flex: '1 0 auto' }}>
                            <Typography component="div" variant="h5">
                              {itemPrimary}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                              {itemSecondary}
                            </Typography>
                          </CardContent>
                          {gradesForUnit?.last?.accuracy &&
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>

                                <Chip icon={<HighIcon />}
                                  style={{
                                    margin: '0 1rem 0 0',
                                  }}
                                  color={getColor(gradesForUnit?.highest?.accuracy)}
                                  label={`Highest ${Math.round(gradesForUnit?.highest?.accuracy) || 0}%`}
                                />

<Chip icon={<StarIcon/>}
                    style={{
                      margin: '0 1rem 0 0',
                      
                    }}
                    variant="contained"
                    label={`Level ${gradesForUnit?.count || 0}`}
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
                              <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
                                <Chip icon={<HistoryIcon />}
                                  style={{
                                    margin: '0 1rem 0 0',
                                  }}
                                  color={getColor(gradesForUnit?.last?.accuracy)}
                                  label={`Last ${Math.round(gradesForUnit?.last?.accuracy) || 0}%`}
                                />
                                <Chip icon={<AverageIcon />}
                                  style={{
                                    margin: '0 1rem 0 0',
                                  }}
                                  color={getColor(gradesForUnit?.average)}
                                  label={`Average ${Math.round(gradesForUnit?.average) || 0}%`}
                                />

                              </Box>
                            </>
                          }

                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>

                            <Button
                              variant="text"
                              color="inherit"
                              href={workbookUrl}
                              disabled={work}
                              style={{
                                maxWidth: 'fit-content',
                              }}
                            >
                              <EditNoteIcon />&nbsp;View Workbook
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



          {(myAssignments.length > 0 && units) &&
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
                My Assignments
              </Typography>


              {
                myAssignments.map(function (assignment, index) {

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
                        elevation={3}
                        key={index}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',                  
                        }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: '1'
                        }}>
                          <CardContent sx={{ flex: '1 0 auto' }}>
                            <Typography component="div" variant="h5">
                              {itemPrimary}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                              {itemSecondary}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>

                            <Button
                              variant="text"
                              color="inherit"
                              href={workbookUrl}
                              disabled={work}
                              style={{
                                maxWidth: 'fit-content',
                              }}
                            >
                              <EditNoteIcon />&nbsp;View Workbook
                            </Button>

                            <Button
                              variant="text"
                              color="inherit"
                              href={unitUrl}
                              disabled={work}
                              style={{
                                maxWidth: 'fit-content',
                              }}
                            >
                              <EditIcon />&nbsp;Edit Unit
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

          {(sections.length == 0 && mySections.length == 0) &&
            //embed url to create a new section
            <Card
              elevation={3}
              sx={{
                display: 'flex',
                margin: '1rem auto',
                width: '90vw',
                maxWidth: '80rem',
              }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: '1'
              }}>
                <CardContent sx={{ flex: '1 1 auto', padding: '2rem' }}>
                  <Typography component="div" variant="h5">
                    No Sections Yet
                    <br />
                    <Button
                      variant="contained"
                      color="primary"
                      href='sections'
                      disabled={work}
                      style={{

                        maxWidth: 'fit-content',
                      }}
                    >
                      Join Section?
                    </Button>

                    <Button
                      variant="text"
                      color="inherit"
                      href='sections'
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
          {mySections.length > 0 &&

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
                My Sections
              </Typography>


              {
                mySections.map(function (section, index) {

                  return (
                    <>

                      <Card
                        key={index}
                        elevation={3}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',
                        }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: '1'
                        }}>
                          <CardContent sx={{ flex: '1 0 auto' }}>
                            <Typography component="div" variant="h5">
                              {section?.name || "Untitled Section"}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                              {section?.description || "No description"}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>

                            <Button
                              variant="text"
                              color="inherit"
                              href={`section/${section.id}`}
                              disabled={work}
                              style={{
                                maxWidth: 'fit-content',
                              }}
                            >
                              <PeopleIcon />&nbsp;View Section
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

          {sections.length > 0 &&
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
                Sections
              </Typography>


              {
                sections.map(function (section, index) {

                  return (
                    <>

                      <Card
                        key={index}
                        elevation={3}
                        sx={{
                          display: 'flex',
                          margin: '1rem auto',
                          width: '90vw',
                          maxWidth: '80rem',
                        }}>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: '1'
                        }}>
                          <CardContent sx={{ flex: '1 0 auto' }}>
                            <Typography component="div" variant="h5">
                              {section?.name || "Untitled Section"}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                              {section?.description || "No description"}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>

                            <Button
                              variant="text"
                              color="inherit"
                              href={`section/${section.id}`}
                              disabled={work}
                              style={{
                                maxWidth: 'fit-content',
                              }}
                            >
                              <EditNoteIcon />&nbsp;View Section
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


function WrappedPage() {
  return (
    <MyAuth>
      <Index />
    </MyAuth>
  )
}

export default WrappedPage

