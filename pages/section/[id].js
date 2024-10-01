import React, { useEffect, useState } from "react";
import { Section, Grade, Assignment, Unit } from "../../src/models";
import { DataStore } from 'aws-amplify/datastore';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from "aws-amplify/auth";
import { createSectionGroup } from '../../src/graphql/mutations';
import { listSectionStudents } from '../../src/graphql/queries';
import { uploadData } from 'aws-amplify/storage';

import { useRouter } from 'next/router'

import {
  Button,
  Box,
  AppBar,
  Card,
  Typography,
  CardMedia,
  CardContent,
  CardActions,
  Container,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  Paper,
  IconButton,
  Slide,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import EditNoteIcon from '@mui/icons-material/EditNote';
import MainToolbar from '../../src/components/MainToolbar'

import MyAuth from "../../src/components/authenticator";

import CameraIcon from '@mui/icons-material/Camera';
import DeleteIcon from '@mui/icons-material/Delete';
import getCachedUrl from "../../src/utils/getCachedUrl";
import { get } from "http";
import FilesContext from "../../src/context/fileContext";

// import { fetchAuthSession } from '@aws-amplify/auth';

function FeaturedImage({ style, s3Key, identityId }) {

  const [url, setUrl] = React.useState(null);


  React.useEffect(() => {

    const asyncFunc = async () => {
      
      const _url = await getCachedUrl(s3Key, 'protected', identityId);
      setUrl(_url);
    }

    asyncFunc();

  }, [s3Key]);

  return <img
    src={url}
    style={style}
  />
}


function CardMediaComponent({ s3Key, identityId, level = 'protected' }) {
  const [url, setUrl] = React.useState(null);


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


const client = generateClient();

function SectionDetail({ user, signOut }) {
  /**
   * The SectionDetail page displays the section in a single page
   * 
   * The SectionDetail page can be accessed by clicking on a section in the Sections page.
   * 
   * The SectionDetail page displays the following information:
   * 
   * Section Name
   * Section Description
   * Section Code
   * 
   * The SectionDetail page displays the following actions:
   * 
   * Edit Section
   * Delete Section
   * 
   * The SectionDetail page displays the following information for each learner:
   * 
   * My Grade
   * My Assignments
   * 
   */

  const router = useRouter()

  const [section, setSection] = useState([])
  const [sectionStudents, setSectionStudents] = useState([])
  const [units, setUnits] = useState([])
  const [myGrades, setMyGrades] = useState([])
  const [gradeMap, setGradeMap] = useState({})
  const [myGradeMap, setMyGradeMap] = useState({})
  const [grades, setGrades] = useState([])
  const [sectionAssignments, setSectionAssignments] = useState([])
  const [work, setIsWorking] = useState(false)
  const [open, setOpen] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [isTeacher, setIsTeacher] = React.useState(false);
  const [ownerId, setOwnerId] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);

  const { id } = router.query

  const [isDragging, setIsDragging] = React.useState(false);
  const [filesToUpload, setFilesToUpload] = React.useState([]);
  const [fileOperations, setFileOperations] = React.useState([]);

  const { session }  = React.useContext(FilesContext);

  const handleDeleteSection = async () => {
    console.log('handleDeleteSection')
    setDeleteOpen(false)
    if (confirm('Are you sure you want to delete this section?')) {
      await DataStore.delete(section)
      router.push('/sections')
    }
  }

  React.useEffect(() => {

    const asyncFunc = async () => {
      // when audio files change, upload them to S3
      // and update the entry in the database

      if (filesToUpload.length === 0) {
        return;
      }

      const identityId = session.identityId;

      let newFilename;
      // show loading indicator
      setInProgress(true);


      const fileKeys = await Promise.allSettled(filesToUpload.map(async (fileInput) => {
        const { file } = fileInput;
        console.log('file', file);

        if (file?.type?.includes('image')) {
          newFilename = `featured-images/${file.name}`
        }

        if (!newFilename) {
          throw new Error('Please upload an image file with a valid extension.');
        }

        // TODO - add support for featured video and featured audio
        /**else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
            newFilename = `audio/${_uuid}-${file.name}`
            // Way to determine length of audio file?
        } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
            newFilename = `files/${_uuid}-${file.name}`
        }*/

        console.log('uploading newFilename', newFilename);
        console.log('uploading file', fileInput);
        console.log('fileOperations', fileOperations);

        const result = await uploadData({
          key: newFilename,
          data: file,
          options: {
            contentType: file.type,
            contentLength: file.size,
            accessLevel: 'protected',
            identityId, 
            progressCallback(progress) {
              console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

              setFileOperations((prev) => {
                const newFileOperations = [...prev];
                newFileOperations[fileInput.index].progress = Math.round(progress.loaded / progress.total * 100) + '%';
                return newFileOperations;
              })
            }
          }
        });

      }));



      // timeout to allow for S3? to update
      setTimeout(async () => {
        setFilesToUpload([]);
        setFileOperations([]);

        // Hide loading indicator

        try {
          // update the unit with the new file
          await DataStore.save(
            Section.copyOf(section, (updated) => {
              updated.featuredImage = newFilename;
            }));
  
        } catch (error) {
          console.error(error);
        }

        setInProgress(false);

      }, 10000);
    };

    asyncFunc();

  }, [filesToUpload]);


  const handleDragOver = (e) => {
    console.log('handleDragOver');
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDrop = async (event) => {
    console.log('dropped');
    event.preventDefault();
    event.stopPropagation();

    console.log(event.dataTransfer.files);

    const files = Array.from(event.dataTransfer.files);

    console.log('files>>>>', files);

    const _toupload = files.map((f, index) => {
      return {
        file: f,
        index,
      }
    });

    const _fileOperations = files.map((f) => ({ name: f.name, progress: '0%' }));


    console.log('_toupload', _toupload);
    console.log('_fileOperations', _fileOperations);

    setFilesToUpload(_toupload);
    setFileOperations(_fileOperations);

    setIsDragging(false);
  };


  console.log('section', section)

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDeleteOpen = () => {
    setDeleteOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddAssignment = () => {
    console.log('handleAddAssignment')
  }

  const handleDeleteAssignment = async (assignment) => {
    console.log('handleDeleteAssignment')
    await DataStore.delete(assignment)
  }

  const handleImageUpload = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    console.log('event', event)

    // const form = new FormData(event.target)
    // let response

    // try {
    //   const createInput = {
    //     name: form.get('name').toString(),
    //     description: form.get('description').toString(),
    //     // file
    //   }

    //   console.log('createInput', createInput);

    //   response = await client.graphql({
    //     query: createSectionGroup,
    //     variables: createInput,
    //   })

    // } catch (errors) {
    //   console.error(errors)
    //   //   throw new Error(errors[0].message)
    // }

  }



  // Get the unit data
  useEffect(() => {
    const _units = DataStore.observeQuery(Unit/*, (u) =>
      u.status.eq('PUBLISHED')
    */).subscribe((unitUpdate) => {
      const unitMap = {}
      console.log('unitUpdate', unitUpdate)
      unitUpdate.items.forEach((unit) => {
        unitMap[unit.id] = unit
      })

      console.log('unitMap', unitMap)
      setUnits(unitMap)
    })
    return () => {
      _units.unsubscribe()
    }
  }, [])

  // Get the section data
  useEffect(() => {
    if (!id) return
    fetchSections()
    async function fetchSections() {
      const sectionData = await DataStore.query(Section, (s) =>
        s.id.eq(id)
      )

      console.log('sectionData', sectionData)
      setSection(sectionData[0])
    }
    const subscription = DataStore.observe(Section).subscribe(() => fetchSections())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [id])

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

        console.log('fetchMyGrades.grade', grade)
        if (!gradesByUnit[grade.unitID]) {
          gradesByUnit[grade.unitID] = {
            last: grade,
            highest: grade,
            average: 0,
            sum: 0,
            count: 0,
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
    if (units == {}) return
    // if (!isOwner || !isTeacher) return 
    fetchGrades()
    async function fetchGrades() {

      const grades = await DataStore.query(Grade, (g) =>
        g.and(g => [
          g.complete.eq(true),
          g.accuracy.ne(null),
        ]))


      // grades by user and assignment
      // look for the last grade for each assignment
      // look for the highest grade for each assignment
      // limit the grades by the assignment duedae and updated date

      const gradesByUserUnit = {}

      grades.forEach((grade) => {

        if (!gradesByUserUnit[grade.owner]) {
          gradesByUserUnit[grade.owner] = {}
        }

        if (!gradesByUserUnit[grade.owner][grade.unitID]) {
          gradesByUserUnit[grade.owner][grade.unitID] = {
            highest: grade,
            average: 0,
            sum: 0,
            count: 0,
          }
        }

        if (grade.updatedAt > units[grade.unitID]?.dueDate) {
          return
        }

        if (grade.accuracy > gradesByUserUnit[grade.owner][grade.unitID].highest.accuracy) {
          gradesByUserUnit[grade.owner][grade.unitID].highest = grade
        }

        gradesByUserUnit[grade.owner][grade.unitID].sum += grade.accuracy
        gradesByUserUnit[grade.owner][grade.unitID].count += 1
        

        if (gradesByUserUnit[grade.owner][grade.unitID].count > 0) {
          gradesByUserUnit[grade.owner][grade.unitID].average = gradesByUserUnit[grade.owner][grade.unitID].sum / gradesByUserUnit[grade.owner][grade.unitID].count
        } 

        


      })

      console.log('gradesByUserUnit', gradesByUserUnit)

      setGrades(grades)
      setGradeMap(gradesByUserUnit)
    }
    const subscription = DataStore.observe(Grade).subscribe(() => fetchGrades())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [units])

  useEffect(() => {
    if (!id) return
    fetchSectionAssignments()
    async function fetchSectionAssignments() {
      const _sectionAssignments = await DataStore.query(Assignment, (a) =>
        a.sectionID.eq(id)
      )

      console.log('_sectionAssignments', _sectionAssignments)

      setSectionAssignments(_sectionAssignments)

    }
    const subscription = DataStore.observe(Assignment).subscribe(() => fetchSectionAssignments())

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [id, JSON.stringify(myGradeMap), JSON.stringify(gradeMap) , JSON.stringify(myGrades), JSON.stringify(grades)])




  // get all students in this section if the user owns the section
  useEffect(() => {
    if (!section?.code) return
    // if (!isTeacher || !isOwner) return

    fetchSectionStudents()
    async function fetchSectionStudents() {
      // use ampllify api to get all students in this section
      // const user = await getCurrentUser()
      const userAttributes = await fetchUserAttributes();

      // console.log('userAttributes', userAttributes)

      // const userData = await getUser(currentUser)
      // console.log('userData', userData)

      // setUser(userAttributes)
      // setName(userAttributes?.name || '')
      // setEmail(userAttributes?.email || '')
      // setUsername(userAttributes?.sub || '')


      if (userAttributes?.sub !== section.owner) {

        console.log('fetchSectionStudents.user.username !== section.owner', user.username, section.owner)
        setSectionStudents([{
          id: user.username,
          email: userAttributes?.email, // TODO: Determine if email is something we want to expose?
          name: userAttributes?.name
        }])
        return
      }

      // console.log('fetchSectionStudents.user.username === section.owner', user.username, section.owner)

      const _sectionStudents = await client.graphql({
        query: listSectionStudents,
        variables: {
          sectionCode: section.code,
        }
      })

      console.log('_sectionStudents', _sectionStudents)

      const sectionStudentsData = {}
      console.log('_sectionStudents', _sectionStudents.data.listSectionStudents)
      _sectionStudents.data.listSectionStudents.forEach((sectionStudent) => {
        sectionStudentsData[sectionStudent.id] = sectionStudent
      })

      console.log('fetchSectionStudents', sectionStudentsData)

      setSectionStudents(sectionStudentsData)
      setIsOwner(true)

    }

  }, [section?.code])

  console.log('section students', sectionStudents)
  console.log('section', section)
  console.log('sectionAssignments', sectionAssignments)
  console.log('grades', grades)
  console.log('myGrades', myGrades)
  console.log('gradeMap', gradeMap)
  console.log('myGradeMap', myGradeMap)

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


      <Card
        elevation={3}
        sx={{
          width: '90vw',
          margin: '3rem auto',
          maxWidth: '80rem',
        }}>
        {/* {section?.featuredImage &&
          <CardMediaComponent
          s3Key={section?.featuredImage}
          owner={section?.owner}
        />
        }
        {!section?.featuredImage &&
          <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            // alignItems: 'center',
            // justifyContent: 'center',
            // padding: '1rem',
            // height: '100%',
            // width: '100%',
          }}
          > */}





        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            // padding: '1rem',
            // border: '1px solid black',
            // backgroundColor: 'rgb(255, 255, 255, 0.1)',
          }}

          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={(e) => {
            console.log('onDragLeaveListItem');
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
        >

          {(isDragging || inProgress) && (

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={(e) => {
                console.log('onDragLeave');
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}


              style={{
                color: '#000',
                fontSize: '2rem',
                fontWeight: 'bold',
                textAlign: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 100,
                backgroundColor: 'rgb(255, 255, 255, 0.5)',
                backdropFilter: 'blur(3px)',
                textAlign: 'center',
                verticalAlign: 'middle',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                wrap: 'wrap',

              }}
            >
          {inProgress &&
          `Uploading Image`
          }
          {isDragging &&
          `Upload Image`
          }
            </div>
          )}

          {section?.featuredImage &&

            <FeaturedImage
              s3Key={section.featuredImage}
              identityId={section?.identityId}
              style={{

                objectFit: 'cover',
                width: '100%',
                height: '100%',
                maxHeight: '50vh',

                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#333',
                backgroundColor: 'rgba(255, 255, 255, 0)'

              }}
            />

            // </Box>
          }
          {!section?.featuredImage &&

            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                // height: '100%',
                // width: '100%',
                border: '1px dashed #666',
              }}
            >
              <Typography
                variant="body1"
                // component="h3"
                sx={{
                  flexGrow: 1,
                  textWrap: 'wrap',
                }}
              >
                <CameraIcon
                  sx={{
                    fontSize: '2rem',
                    margin: '1rem auto',
                    display: 'block',
                  }}
                /><br />
                No featured image set.
                Drag and drop an image here to set it as the featured image.
              </Typography>
            </Box>
          }

        </div>


        {/* </Box> */}
        {/* } */}

        <CardContent>
          <Typography gutterBottom variant="h3" component="div">
            {section?.name}
          </Typography>

          <Typography gutterBottom variant="h5" component="div">
            Join Code: {section?.code}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {section?.description}
          </Typography>

        </CardContent>
        {/* <CardActions>
        <Button size="small">Share</Button>
        <Button size="small">Learn More</Button>
      </CardActions> */}
      </Card>

      {Object.keys(sectionStudents).length > 0 && (isOwner || isTeacher) &&

        <Container
        style={{
          padding: '1rem',
          marginBottom: '3rem'
        }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, padding: '1rem' }}>
            Students
          </Typography>

          <TableContainer component={Paper}>
            <Table
              aria-label="simple table"
              size="small"
            >

              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell align="right">Email</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.values(sectionStudents).map((student, studentKey) => {
                  return (
                    <TableRow
                      key={student.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" key={studentKey}>
                        {student.name}
                      </TableCell>
                      <TableCell align="right">{student.email}</TableCell>
                      <TableCell align="right">
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(student)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      }

      <Container
        style={{
          padding: '1rem',
          marginBottom: '3rem'
        }}>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1, padding: '1rem' }}>
          Gradebook
        </Typography>
        <TableContainer component={Paper}>
          <Table
            aria-label="simple table"
            size="small"
          >
            <TableHead>
              <TableRow>
                <TableCell>Learner</TableCell>
                {sectionAssignments.map((assignment) => {
                  return (
                    <TableCell align="right">{
                      units[assignment.unitID]?.name
                    }</TableCell>
                  )
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(sectionStudents).map((student, studentKey) => {
                return (
                  <TableRow
                    key={student.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" key={studentKey}>
                      {student.name}
                    </TableCell>
                    {sectionAssignments.map((assignment) => {
                      console.log('student.id', student.id)
                      console.log('assignment.unitID', assignment.unitID)

                      console.log('gradeMap[student.id]?.[assignment.unitID]', gradeMap[student.id]?.[assignment.unitID])
                      const highest = Math.round(gradeMap[student.id]?.[assignment.unitID]?.highest?.accuracy) || '-'
                      const average = Math.round(gradeMap[student.id]?.[assignment.unitID]?.average) || '-'
      
                      const colGrade = `${highest}% (${average}%)`

                      return (
                        <TableCell align="right">{colGrade}</TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {!sectionAssignments &&
        <div>Loading...</div>
      }
      {sectionAssignments &&
        <Box
        style={{
          padding: '1rem',
          marginBottom: '3rem',
          margin: '1rem auto',
          maxWidth: '80rem',
        }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, padding: '1rem',
          margin: '1rem auto',

        }}>
            Assignments
          </Typography>


          {
            sectionAssignments.map(function (assignment) {

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

              return (
                <>

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
              <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
              }}
              >
        <Button
          sx={{
            flexGrow: 1,
            margin: '5rem auto',
            padding: '1rem 3rem',
          }}
          variant="outlined" color="error" onClick={handleDeleteSection}>
          Delete Section
        </Button>


        </Box>
        
    </>
  )
}
function WrappedPage() {
  return (
    <MyAuth>
      <SectionDetail />
    </MyAuth>
  )
}

export default WrappedPage
