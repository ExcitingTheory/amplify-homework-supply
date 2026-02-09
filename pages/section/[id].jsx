import React, { useEffect, useState } from "react";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../../next-i18next.config';
import { getAmplifyClient } from '../../src/utils/amplifyClient';
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
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
  DialogActions,
  TextField,
  Paper,
  IconButton,
  Slide,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
} from '@mui/material';

import EditNoteIcon from '@mui/icons-material/EditNote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MainToolbar from '../../src/components/MainToolbar'

import MyAuth from "../../src/components/authenticator";

import CameraIcon from '@mui/icons-material/Camera';
import DeleteIcon from '@mui/icons-material/Delete';
import getCachedUrl from "../../src/utils/getCachedUrl";
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
        width: url ? 400 : 151,
        transition: 'width 0.3s ease-in-out',
        alignSelf: 'left',
      }}
      image={url}
    // alt="Live from space album cover"
    />

  )
}

function SectionDetail({ user, signOut }) {
  const client = getAmplifyClient();
  const { t } = useTranslation('pages');
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

  const [currentUser, setCurrentUser] = useState(null);
  const [section, setSection] = useState(null)
  const [sectionStudents, setSectionStudents] = useState([])
  const [units, setUnits] = useState({})
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
  const [curveEnabled, setCurveEnabled] = React.useState(false);
  const [curveMethod, setCurveMethod] = React.useState('scale-to-top');
  const [selectedCurveAssignments, setSelectedCurveAssignments] = React.useState(new Set());
  const [showFutureAssignments, setShowFutureAssignments] = React.useState(false);
  const [showDraftAssignments, setShowDraftAssignments] = React.useState(false);
  const [gradeOverrideOpen, setGradeOverrideOpen] = React.useState(false);
  const [overrideData, setOverrideData] = React.useState({ student: null, assignment: null, currentGrade: null });
  const [overrideScore, setOverrideScore] = React.useState('');
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [viewAsStudent, setViewAsStudent] = React.useState(false);

  const { id } = router.query

  const [isDragging, setIsDragging] = React.useState(false);
  const [filesToUpload, setFilesToUpload] = React.useState([]);
  const [fileOperations, setFileOperations] = React.useState([]);

  const { session }  = React.useContext(FilesContext);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUser();
  }, []);

  const handleDeleteSection = async () => {
    console.log('handleDeleteSection')
    setDeleteOpen(false)
    if (confirm(t('sectionDetail.deleteSectionConfirm'))) {
      const { errors } = await client.models.Section.delete({ id: section.id });
      if (errors) {
        console.error('Error deleting section:', errors);
      } else {
        router.push('/sections');
      }
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
          throw new Error(t('sectionDetail.uploadImageInvalidFile'));
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
          // update the section with the new file
          const { errors } = await client.models.Section.update({
            id: section.id,
            featuredImage: newFilename,
          });
          
          if (errors) {
            console.error('Error updating section:', errors);
          }
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
    const { errors } = await client.models.Assignment.delete({ id: assignment.id });
    if (errors) {
      console.error('Error deleting assignment:', errors);
    }
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
    const subscription = client.models.Unit.observeQuery({
      // filter: { status: { eq: 'PUBLISHED' } } // Uncomment if needed
    }).subscribe({
      next: ({ items }) => {
        const unitMap = {}
        console.log('unitUpdate', { items })
        items.forEach((unit) => {
          unitMap[unit.id] = unit
        })

        console.log('unitMap', unitMap)
        setUnits(unitMap)
      },
      error: (err) => console.error('Unit subscription error:', err)
    });
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Get the section data
  useEffect(() => {
    console.log('[SectionDetail] Section query useEffect - id:', id);
    if (!id) return
    
    const subscription = client.models.Section.observeQuery({
      filter: { id: { eq: id } }
    }).subscribe({
      next: ({ items }) => {
        console.log('sectionData', items)
        if (items.length > 0) {
          const sectionData = items[0];
          setSection(sectionData);
          
          // Load curve settings from section
          if (sectionData.curveEnabled !== undefined) {
            setCurveEnabled(sectionData.curveEnabled);
          }
          if (sectionData.curveMethod) {
            setCurveMethod(sectionData.curveMethod);
          }
          if (sectionData.curveAssignments) {
            setSelectedCurveAssignments(new Set(sectionData.curveAssignments));
          }
        }
      },
      error: (err) => console.error('Section subscription error:', err)
    });

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [id])

  // Get MY grades (learner view only - shows their personal progress)
  useEffect(() => {
    if (!currentUser?.username) return;
    if (!section?.owner) return; // Wait for section to load
    if (currentUser.username === section.owner) return; // Skip for section owner/instructor
    
    const subscription = client.models.Grade.observeQuery({
      filter: {
        and: [
          { complete: { eq: true } },
          { owner: { eq: currentUser.username } }
        ]
      }
    }).subscribe({
      next: ({ items: grades }) => {
        setMyGrades(grades)

      console.log('fetchMyGrades (learner)', grades)

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
      },
      error: (err) => console.error('My grades subscription error:', err)
    });

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [currentUser?.username, section?.owner])

  useEffect(() => {
    if (units == {}) return
    // if (!isOwner || !isTeacher) return 
    
    const subscription = client.models.Grade.observeQuery({
      filter: {
        and: [
          { complete: { eq: true } },
          { accuracy: { ne: null } }
        ]
      }
    }).subscribe({
      next: ({ items: grades }) => {


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
      },
      error: (err) => console.error('All grades subscription error:', err)
    });

    return function cleanup() {
      subscription.unsubscribe();
    }
  }, [units])

  useEffect(() => {
    if (!id) return
    
    const subscription = client.models.Assignment.observeQuery({
      filter: { sectionID: { eq: id } }
    }).subscribe({
      next: ({ items }) => {
        console.log('_sectionAssignments', items)
        setSectionAssignments(items)
      },
      error: (err) => console.error('Assignments subscription error:', err)
    });

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

      if (userAttributes?.sub !== section.owner) {

        console.log('fetchSectionStudents.user.username !== section.owner', currentUser?.username, section.owner)
        setSectionStudents([{
          id: currentUser?.username,
          email: userAttributes?.email, // TODO: Determine if email is something we want to expose?
          name: userAttributes?.name || currentUser?.username
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

  // Filter assignments based on visibility settings
  const visibleAssignments = React.useMemo(() => {
    const now = new Date();
    return sectionAssignments.filter(assignment => {
      // Students cannot see draft assignments
      if (assignment.status === 'DRAFT') {
        return isOwner && showDraftAssignments;
      }
      
      // Filter by due date (assignments with future due dates)
      // Only apply this filter for instructors who have the toggle
      if (assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        if (dueDate > now) {
          return isOwner && showFutureAssignments;
        }
      }
      
      return true;
    });
  }, [sectionAssignments, showFutureAssignments, showDraftAssignments, isOwner]);

  const totalAssignments = sectionAssignments.length;
  const visibleAssignmentsCount = visibleAssignments.length;

  // Calculate curve data for each assignment
  const calculateCurveData = () => {
    const curveData = {};
    
    visibleAssignments.forEach((assignment) => {
      const grades = [];
      Object.values(sectionStudents).forEach((student) => {
        const grade = gradeMap[student.id]?.[assignment.unitID]?.highest?.accuracy;
        if (grade !== undefined && grade !== null && !isNaN(grade)) {
          grades.push(grade);
        }
      });
      
      if (grades.length === 0) {
        curveData[assignment.unitID] = { maxScore: 0, avgScore: 0, adjustment: 0 };
        return;
      }
      
      const maxScore = Math.max(...grades);
      const avgScore = grades.reduce((sum, g) => sum + g, 0) / grades.length;
      
      // Different curve methods
      let adjustment = 0;
      if (curveMethod === 'scale-to-top') {
        // Scale so highest score becomes 100%
        adjustment = maxScore > 0 ? 100 / maxScore : 1;
      } else if (curveMethod === 'linear-adjustment') {
        // Add points to make average 75%
        adjustment = 75 - avgScore;
      }
      
      curveData[assignment.unitID] = { maxScore, avgScore, adjustment };
    });
    
    return curveData;
  };

  const curveData = calculateCurveData();

  // Apply curve to a grade
  const applyCurve = (grade, assignmentId) => {
    if (!curveEnabled || !grade || isNaN(grade)) return grade;
    
    // Only apply curve if this assignment is selected
    if (!selectedCurveAssignments.has(assignmentId)) return grade;
    
    const curve = curveData[assignmentId];
    if (!curve) return grade;
    
    if (curveMethod === 'scale-to-top') {
      return Math.min(100, Math.round(grade * curve.adjustment));
    } else if (curveMethod === 'linear-adjustment') {
      return Math.min(100, Math.max(0, Math.round(grade + curve.adjustment)));
    }
    
    return grade;
  };

  // Toggle assignment curve selection
  const toggleCurveAssignment = (assignmentId) => {
    setSelectedCurveAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  // Select all assignments for curve
  const selectAllCurveAssignments = () => {
    setSelectedCurveAssignments(new Set(visibleAssignments.map(a => a.unitID)));
  };

  // Clear all curve selections
  const clearAllCurveAssignments = () => {
    setSelectedCurveAssignments(new Set());
  };

  // Save curve settings to section when they change
  useEffect(() => {
    if (!section?.id || !isOwner) return;
    
    const saveCurveSettings = async () => {
      try {
        const { errors } = await client.models.Section.update({
          id: section.id,
          curveEnabled,
          curveMethod,
          curveAssignments: Array.from(selectedCurveAssignments),
        });
        
        if (errors) {
          console.error('Error saving curve settings:', errors);
        }
      } catch (error) {
        console.error('Error saving curve settings:', error);
      }
    };
    
    // Debounce the save to avoid too many updates
    const timeoutId = setTimeout(saveCurveSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [curveEnabled, curveMethod, selectedCurveAssignments, section?.id, isOwner]);

  const handleGradeCellClick = (student, assignment, currentGrade) => {
    if (!isOwner) return; // Only instructors can override grades
    
    setOverrideData({ student, assignment, currentGrade });
    setOverrideScore(currentGrade?.accuracy?.toString() || '');
    setGradeOverrideOpen(true);
  };

  const handleGradeOverrideClose = () => {
    setGradeOverrideOpen(false);
    setOverrideData({ student: null, assignment: null, currentGrade: null });
    setOverrideScore('');
  };

  const handleGradeOverrideSave = async () => {
    const score = parseFloat(overrideScore);
    
    if (isNaN(score) || score < 0 || score > 100) {
      alert(t('sectionDetail.overrideGrade.invalidScore'));
      return;
    }

    try {
      const { student, assignment, currentGrade } = overrideData;
      
      if (currentGrade) {
        // Update existing grade
        const { errors } = await client.models.Grade.update({
          id: currentGrade.id,
          accuracy: score,
          percentComplete: 100,
          complete: true,
        });
        
        if (errors) {
          console.error('Error updating grade:', errors);
          alert(t('sectionDetail.overrideGrade.saveFailed'));
          return;
        }
      } else {
        // Create new grade for this student
        const { errors } = await client.models.Grade.create({
          unitID: assignment.unitID,
          assignmentID: assignment.id,
          owner: student.id, // Student owns the grade so they can see it
          instructor: currentUser?.username,
          accuracy: score,
          percentComplete: 100,
          complete: true,
          data: JSON.stringify({}), // Empty data for manual override
        });
        
        if (errors) {
          console.error('Error creating grade:', errors);
          alert(t('sectionDetail.overrideGrade.saveFailed'));
          return;
        }
      }
      
      handleGradeOverrideClose();
    } catch (error) {
      console.error('Error saving grade override:', error);
      alert(t('sectionDetail.overrideGrade.saveFailed'));
    }
  };

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
        elevation={2}
        sx={{
          width: '90vw',
          margin: '5rem auto',
          maxWidth: '80rem',
          borderRadius: 2,
          borderLeft: '4px solid',
          borderLeftColor: 'primary.main',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
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
                verticalAlign: 'middle',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                wrap: 'wrap',

              }}
            >
          {inProgress &&
          t('sectionDetail.uploadingImage')
          }
          {isDragging &&
          t('sectionDetail.uploadImagePrompt')
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
                <Typography>
                  {t('sectionDetail.noFeaturedImage')}.
                  {t('sectionDetail.dragAndDropPrompt')}
                </Typography>
              </Typography>
            </Box>
          }

        </div>

        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
            <Box>
              <Typography gutterBottom variant="h3" component="div">
                {section?.name}
              </Typography>

              <Typography gutterBottom variant="h5" component="div">
                {t('sectionDetail.joinCode')} {section?.code}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {section?.description}
              </Typography>
            </Box>
            {isOwner && (
              <Tooltip title={viewAsStudent ? t('sectionDetail.switchToInstructorView') : t('sectionDetail.previewStudentView')}>
                <Button
                  variant={viewAsStudent ? "contained" : "outlined"}
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setViewAsStudent(!viewAsStudent)}
                  sx={{ minWidth: 180 }}
                >
                  {viewAsStudent ? t('sectionDetail.studentView') : t('sectionDetail.instructorView')}
                </Button>
              </Tooltip>
            )}
          </Box>

        </CardContent>
        {/* <CardActions>
        <Button size="small">Share</Button>
        <Button size="small">Learn More</Button>
      </CardActions> */}
      </Card>

      {Object.keys(sectionStudents).length > 0 && (isOwner || isTeacher) && !viewAsStudent &&

        <Box
        sx={{
          width: '90vw',
          maxWidth: '90vw',
          padding: '1rem',
          marginBottom: '3rem',
          margin: '0 auto',
        }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, padding: '1rem' }}>
            {t('sectionDetail.students')}
          </Typography>

          <TableContainer component={Paper}>
            <Table
              aria-label="simple table"
              size="small"
            >

              <TableHead>
                <TableRow>
                  <TableCell>{t('sectionDetail.studentHeader')}</TableCell>
                  <TableCell align="right">{t('sectionDetail.emailHeader')}</TableCell>
                  <TableCell align="right">{t('sectionDetail.actionsHeader')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.values(sectionStudents).map((student, studentKey) => {
                  return (
                    <TableRow
                      key={student.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                        '& td, & th': { backgroundColor: 'inherit' },
                      }}
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
        </Box>
      }

      <Box
        sx={{
          width: '90vw',
          maxWidth: '90vw',
          padding: '1rem',
          marginBottom: '3rem',
          margin: '0 auto',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', gap: 2 }}>
            <Typography variant="h5" component="div">
              {t('sectionDetail.gradebook')}
              {visibleAssignmentsCount < totalAssignments && isOwner && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {t('sectionDetail.showingAssignments', { visible: visibleAssignmentsCount, total: totalAssignments })}
                </Typography>
              )}
            </Typography>
            
            {/* Instructor-only controls */}
            {isOwner && !viewAsStudent && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showFutureAssignments}
                      onChange={(e) => setShowFutureAssignments(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={t('sectionDetail.showFutureAssignments')}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showDraftAssignments}
                      onChange={(e) => setShowDraftAssignments(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={t('sectionDetail.showDraftAssignments')}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={curveEnabled}
                      onChange={(e) => setCurveEnabled(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={t('sectionDetail.applyCurve')}
                />
                
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>{t('sectionDetail.curveMethod')}</InputLabel>
                  <Select
                    value={curveMethod}
                    onChange={(e) => setCurveMethod(e.target.value)}
                    label={t('sectionDetail.curveMethod')}
                    disabled={!curveEnabled}
                  >
                    <MenuItem value="scale-to-top">{t('sectionDetail.scaleToTopMethod')}</MenuItem>
                    <MenuItem value="linear-adjustment">{t('sectionDetail.linearAdjustmentMethod')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        
        {/* Curve Assignment Selection */}
        {curveEnabled && isOwner && !viewAsStudent && (
          <Box sx={{ padding: '0 1rem 1rem 1rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('sectionDetail.selectAssignmentsToCurve')} ({selectedCurveAssignments.size}/{visibleAssignments.length})
              </Typography>
              <Button 
                size="small" 
                onClick={selectAllCurveAssignments}
                disabled={selectedCurveAssignments.size === visibleAssignments.length}
              >
                {t('sectionDetail.selectAll')}
              </Button>
              <Button 
                size="small" 
                onClick={clearAllCurveAssignments}
                disabled={selectedCurveAssignments.size === 0}
              >
                {t('sectionDetail.clearAll')}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {visibleAssignments.map((assignment) => {
                const unitName = units[assignment.unitID]?.name || 'Unknown';
                const isSelected = selectedCurveAssignments.has(assignment.unitID);
                return (
                  <Chip
                    key={assignment.id}
                    label={unitName}
                    onClick={() => toggleCurveAssignment(assignment.unitID)}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        {/* Curve Debug Information - only show for selected assignments */}
        {curveEnabled && isOwner && !viewAsStudent && selectedCurveAssignments.size > 0 && (
          <Box sx={{ padding: '0 1rem 1rem 1rem' }}>
            <Typography variant="caption" color="text.secondary">
              {t('sectionDetail.curveDebugInfo')} Method = {curveMethod} | 
              {Array.from(selectedCurveAssignments).map((unitId) => {
                const data = curveData[unitId];
                if (!data) return '';
                const unitName = units[unitId]?.name || unitId;
                if (curveMethod === 'scale-to-top') {
                  return ` ${unitName}: max=${data.maxScore.toFixed(1)}%, scale=${data.adjustment.toFixed(2)}x`;
                } else {
                  return ` ${unitName}: avg=${data.avgScore.toFixed(1)}%, adjust=+${data.adjustment.toFixed(1)}%`;
                }
              }).filter(Boolean).join(' | ')}
            </Typography>
          </Box>
        )}
        
        {/* Student View - Simple Two Column Table */}
        {(!isOwner || viewAsStudent) && (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table aria-label="student grades" size="small" sx={{ minWidth: 400 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('sectionDetail.assignmentHeader')}</TableCell>
                  <TableCell align="right">{t('sectionDetail.gradeHeader')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleAssignments.map((assignment) => {
                  const isDraft = assignment.status === 'DRAFT';
                  const isFuture = assignment.dueDate && new Date(assignment.dueDate) > new Date();
                  const canHaveGrades = !isDraft && !isFuture;
                  
                  const studentId = currentUser?.username;
                  const rawHighest = canHaveGrades ? myGradeMap[assignment.unitID]?.highest?.accuracy : undefined;
                  const grade = rawHighest !== undefined && rawHighest !== null && !isNaN(rawHighest)
                    ? `${Math.round(rawHighest)}%`
                    : '-';
                  
                  return (
                    <TableRow 
                      key={assignment.id}
                      onClick={() => setSelectedRow(selectedRow === assignment.id ? null : assignment.id)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: selectedRow === assignment.id ? '#e3f2fd' : 'transparent',
                        '&:nth-of-type(odd)': { backgroundColor: selectedRow === assignment.id ? '#e3f2fd' : '#fafafa' },
                        '&:hover': { backgroundColor: selectedRow === assignment.id ? '#e3f2fd' : '#f5f5f5' },
                        '& td': { backgroundColor: 'inherit' },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>{units[assignment.unitID]?.name}</TableCell>
                      <TableCell align="right">{grade}</TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Total Row */}
                <TableRow sx={{ backgroundColor: '#f5f5f5', '& td': { backgroundColor: 'inherit' } }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('sectionDetail.totalAverage')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {(() => {
                      let totalGrade = 0;
                      let completedCount = 0;
                      
                      visibleAssignments.forEach((assignment) => {
                        const isDraft = assignment.status === 'DRAFT';
                        const isFuture = assignment.dueDate && new Date(assignment.dueDate) > new Date();
                        const canHaveGrades = !isDraft && !isFuture;
                        
                        if (canHaveGrades) {
                          const grade = myGradeMap[assignment.unitID]?.highest?.accuracy;
                          if (grade !== undefined && grade !== null && !isNaN(grade)) {
                            totalGrade += grade;
                            completedCount++;
                          }
                        }
                      });
                      
                      const average = completedCount > 0 ? Math.round(totalGrade / completedCount) : 0;
                      const completion = visibleAssignments.length > 0 
                        ? Math.round((completedCount / visibleAssignments.length) * 100) 
                        : 0;
                      
                      return completedCount > 0 ? `${average}% (${completion}% complete)` : '- (0% complete)';
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Instructor View - Full Gradebook */}
        {isOwner && !viewAsStudent && (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table
            aria-label="simple table"
            size="small"
            sx={{ minWidth: 650, tableLayout: 'auto' }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: '#fff',
                  zIndex: 10,
                  minWidth: 150,
                  boxSizing: 'border-box',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                  borderRight: '2px solid #e0e0e0',
                }}>{t('sectionDetail.learnerHeader')}</TableCell>
                {visibleAssignments.map((assignment) => {
                  const unitName = units[assignment.unitID]?.name;
                  const isDraft = assignment.status === 'DRAFT';
                  const isFuture = assignment.dueDate && new Date(assignment.dueDate) > new Date();
                  
                  return (
                    <TableCell align="right" key={assignment.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {unitName}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {isDraft && <Chip label="Draft" size="small" color="warning" />}
                          {isFuture && <Chip label="Future" size="small" color="info" />}
                        </Box>
                      </Box>
                    </TableCell>
                  )
                })}
                <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  Total (Completion)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(sectionStudents).map((student, studentKey) => {
                // Calculate totals for this student
                let totalGrade = 0;
                let totalCurvedGrade = 0;
                let completedAssignments = 0;
                
                visibleAssignments.forEach((assignment) => {
                  // Only count grades for published, non-future assignments
                  const isDraft = assignment.status === 'DRAFT';
                  const isFuture = assignment.dueDate && new Date(assignment.dueDate) > new Date();
                  const canHaveGrades = !isDraft && !isFuture;
                  
                  if (canHaveGrades) {
                    const highest = gradeMap[student.id]?.[assignment.unitID]?.highest?.accuracy;
                    if (highest !== undefined && highest !== null && !isNaN(highest)) {
                      totalGrade += highest;
                      const curvedGrade = applyCurve(highest, assignment.unitID);
                      totalCurvedGrade += curvedGrade;
                      completedAssignments++;
                    }
                  }
                });
                
                const averageGrade = completedAssignments > 0 ? Math.round(totalGrade / completedAssignments) : 0;
                const averageCurvedGrade = completedAssignments > 0 ? Math.round(totalCurvedGrade / completedAssignments) : 0;
                const completionPercentage = visibleAssignments.length > 0 
                  ? Math.round((completedAssignments / visibleAssignments.length) * 100) 
                  : 0;
                
                const displayAverage = curveEnabled ? averageCurvedGrade : averageGrade;
                
                return (
                  <TableRow
                    key={student.id}
                    onClick={() => setSelectedRow(selectedRow === student.id ? null : student.id)}
                    sx={{ 
                      '&:last-child td, &:last-child th': { borderBottom: 0 },
                      cursor: 'pointer',
                      backgroundColor: selectedRow === student.id ? '#e3f2fd' : '#fff',
                      '&:nth-of-type(odd)': { backgroundColor: selectedRow === student.id ? '#e3f2fd' : '#fafafa' },
                      '&:hover': { backgroundColor: selectedRow === student.id ? '#e3f2fd' : '#f5f5f5' },
                      '& td, & th': { backgroundColor: 'inherit' },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell 
                      component="th" 
                      scope="row" 
                      key={studentKey}
                      sx={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'inherit',
                        zIndex: 9,
                        minWidth: 150,
                        boxSizing: 'border-box',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                        borderRight: '2px solid #e0e0e0',
                      }}
                    >
                      {student.name}
                    </TableCell>
                    {visibleAssignments.map((assignment) => {
                      console.log('student.id', student.id)
                      console.log('assignment.unitID', assignment.unitID)

                      // Future and draft assignments cannot have grades yet
                      const isDraft = assignment.status === 'DRAFT';
                      const isFuture = assignment.dueDate && new Date(assignment.dueDate) > new Date();
                      const canHaveGrades = !isDraft && !isFuture;

                      console.log('gradeMap[student.id]?.[assignment.unitID]', gradeMap[student.id]?.[assignment.unitID])
                      const rawHighest = canHaveGrades ? gradeMap[student.id]?.[assignment.unitID]?.highest?.accuracy : undefined;
                      const rawAverage = canHaveGrades ? gradeMap[student.id]?.[assignment.unitID]?.average : undefined;
                      
                      const highest = rawHighest !== undefined && rawHighest !== null && !isNaN(rawHighest)
                        ? Math.round(applyCurve(rawHighest, assignment.unitID))
                        : '-';
                      const average = rawAverage !== undefined && rawAverage !== null && !isNaN(rawAverage)
                        ? Math.round(applyCurve(rawAverage, assignment.unitID))
                        : '-';
      
                      // Debug logging for curve verification
                      if (curveEnabled && rawHighest !== undefined && rawHighest !== null) {
                        console.log(`[CURVE] Student: ${student.name}, Assignment: ${units[assignment.unitID]?.name}`);
                        console.log(`  Raw Highest: ${rawHighest}%, Curved: ${highest}%`);
                        console.log(`  Curve Data:`, curveData[assignment.unitID]);
                      }

                      const colGrade = `${highest}% (${average}%)`
                      const gradeRecord = gradeMap[student.id]?.[assignment.unitID]?.highest;

                      return (
                        <TableCell 
                          align="right" 
                          key={assignment.id}
                        >
                          {isOwner ? (
                            <Tooltip title={t('sectionDetail.editTooltip')} arrow>
                              <span
                                onClick={() => handleGradeCellClick(student, assignment, gradeRecord)}
                                style={{
                                  cursor: 'pointer',
                                  display: 'inline-block',
                                }}
                              >
                                {colGrade}
                              </span>
                            </Tooltip>
                          ) : (
                            colGrade
                          )}
                        </TableCell>
                      )
                    })}
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontWeight: 'bold', 
                        backgroundColor: '#f5f5f5',
                        color: completionPercentage === 100 ? '#2e7d32' : '#666'
                      }}
                    >
                      {completedAssignments > 0 ? `${displayAverage}%` : '-'} ({completionPercentage}%)
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Box>

      {!sectionAssignments &&
        <div>{t('sectionDetail.loading')}</div>
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
            {t('sectionDetail.assignments')}
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
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      },
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
                          <EditNoteIcon />&nbsp;{t('sectionDetail.viewWorkbook')}
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
              {isOwner && !viewAsStudent && (
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
            {t('sectionDetail.deleteSection')}
          </Button>


          </Box>
              )}

        {/* Grade Override Dialog */}
        <Dialog open={gradeOverrideOpen} onClose={handleGradeOverrideClose}>
          <DialogTitle>
            {t('sectionDetail.overrideGrade.title')}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {overrideData.student && overrideData.assignment && (
                <>
                  {t('sectionDetail.overrideGrade.student')} <strong>{overrideData.student.name}</strong><br />
                  {t('sectionDetail.overrideGrade.assignment')} <strong>{units[overrideData.assignment.unitID]?.name}</strong><br />
                  {t('sectionDetail.overrideGrade.currentGrade')} <strong>{overrideData.currentGrade?.accuracy ? `${Math.round(overrideData.currentGrade.accuracy)}%` : t('sectionDetail.overrideGrade.noGrade')}</strong><br /><br />
                  {t('sectionDetail.overrideGrade.prompt')}
                </>
              )}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label={t('sectionDetail.overrideGrade.label')}
              type="number"
              fullWidth
              variant="outlined"
              value={overrideScore}
              onChange={(e) => setOverrideScore(e.target.value)}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleGradeOverrideClose}>{t('sectionDetail.overrideGrade.cancel')}</Button>
            <Button onClick={handleGradeOverrideSave} variant="contained" color="primary">
              {t('sectionDetail.overrideGrade.save')}
            </Button>
          </DialogActions>
        </Dialog>
        
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
export { SectionDetail }

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components'], nextI18nextConfig)),
    },
  }
}
