import { DataStore } from 'aws-amplify/datastore';
import { useRouter } from 'next/router'
import { Unit } from '../../src/models'
import { Workbook } from '../../src/components/Editor3'
import React, { useState, useEffect, useContext, useRef } from "react";

import MyAuth from "../../src/components/authenticator";

import { FilesProvider } from '../../src/context/fileContext'
import { DictionaryProvider } from '../../src/context/dictionaryContext'

import { UnitProvider } from '../../src/context/unitContext'
import UnitContext from '../../src/context/unitContext';
import Box from '@mui/material/Box';

import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MainToolbar from '../../src/components/MainToolbar';
import AppBar from '@mui/material/AppBar';

/**
 * @returns {JSX.Element}
 * 
 * @example
 * <TimerWrappedEditor />
 * 
 * @description
 * If the unit needs a timer, display a timer and a progress bar. Otherwise, display the editor.
 */
function TimerWrappedEditor() {
  const { unit, grade, createGrade, recentGrades } = useContext(UnitContext)

  const unitTimeLimitSeconds = unit?.timeLimitSeconds || 0
  const needsTimer = unitTimeLimitSeconds > 0 ? true : false

  console.log('TimerWrappedEditor.grade', grade)

  const timerStarted = grade?.createdAt

  return (<>

    {(needsTimer && !timerStarted) &&
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


{recentGrades.length == 0 &&
      <Card
        elevation={5}
        sx={{
          // center
          // position: 'absolute',
          // top: '25%',
          // left: '50%',
          // transform: 'translate(-50%, -50%)',

          padding: '1rem',
          width: '97vw',
          margin: '1rem auto',
          textAlign: 'center',
        }}>
          <Typography variant="h4" component="h4" sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      margin: '2rem 0.5rem 0.5rem',
  
                  }}>
                      {`${unit?.name}`}
                  </Typography>

                  <Typography variant="h6" component="h6" sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      // margin: '1rem',
                  }}>
                      {`${unit?.description}`}
                  </Typography>

                  <Typography variant="h6" component="h6" sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      margin: '2rem',
                  }}>

        This is a timed exercise, press start to begin the timer and answer the questions.
        </Typography>
        <Button variant='contained'
          onClick={async () => {
            console.log("start")
            await createGrade()
          }}
        >Start</Button>
      </Card>
}
{recentGrades.length > 0 &&


  <Card
                  sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '70vw',
                      bgcolor: 'background.paper',
                      boxShadow: '0 0 10px 3px rgba(0, 0, 0, .3)',
                      backdropFilter: 'blur(5px)',
                      overflow: 'auto',
                      // p: 4,
                  }}
              >
  
                  <Typography variant="h4" component="h4" sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      margin: '2rem 0.5rem 0.5rem',
  
                  }}>
                      {`${unit?.name}`}
                  </Typography>

                  <Typography variant="h6" component="h6" sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      // margin: '1rem',
                  }}>
                      {`${unit?.description}`}
                  </Typography>

                  

  
                 
  
                  <style global jsx>{`
  
                      ol.recent-grades {
                          list-style-type: none;
                          counter-reset: my-counter;
                      }
                      
                      ol.recent-grades li::before {
                          content: counter(my-counter);
                          counter-increment: my-counter;
                          font-weight: bold;
                          font-size: 1.5em;
                          position: relative;
                          left: -1.5rem;
                          top: 2rem;
                          margin-right: -0.5em;
                      }
  
                  `}</style>
  
  
                  <ol
                      className='recent-grades'
                      style={{
                          padding: '0 2rem',
                          margin: '1rem 2rem',
                          maxHeight: '50vh',
                          overflow: 'auto',
                          // alignContent: 'center',
                          // backgroundColor: 'rgb(248 248 248)',
                          // borderRadius: '3px',
                          // border: '1px solid #e0e0e0',
                      }}
  
                  >
                      {recentGrades.map((grade, index) => {
                          // get local time from UTC
                          // get timezone from client browser
                          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                          // get timezone from user profile TBD
                          // Convert time
                          const localTime = new Date(grade?.createdAt).toLocaleString(undefined, {
                              timeZone
                          });
  
                          const _roundedAccuracy = Math.round(grade?.accuracy * 100) / 100
  
  
                          console.log('grade', grade)
                          return (
                              <li key={index}
                                  style={{
                                      // padding: '1rem',
                                      // margin: '0.25rem',
                                  }}
                              >
                                  <Box sx={{ display: 'flex', justifyContent: 'center', margin: '0' }}>
                                      <Typography variant="h6" component="div" sx={{
                                          // flex: 1,
                                          textAlign: 'left',
                                          paddingLeft: '2rem',
                                          // margin: '1rem',
                                      }}>
                                          {`${localTime}`}
                                      </Typography>
  
                                      <div style={{
                                          flex: 1,
                                          textAlign: 'center',
                                          flexGrow: 1,
                                          borderBottom: '1px dashed #000',
                                          margin: '0 0.4rem',
                                          position: 'relative',
                                          top: '-0.5rem',
                                          // margin: '1rem',
                                      }}>
                                      </div>
  
                                      <Typography variant="h6" component="div" sx={{
                                          // flex: 1,
                                          textAlign: 'right',
                                          margin: '0',
                                      }}>
                                          {`${_roundedAccuracy}%`}
                                      </Typography>
                                  </Box>
                              </li>
                          )
                      })}
                  </ol>
                  <Typography variant="h6" component="h6" sx={{
                      flexGrow: 1,
                      textAlign: 'center',
                      margin: '2rem',
                  }}>

                    This is a timed exercise, press start to begin the timer and answer the questions.
                    <br /><br /><Button variant='contained'
                      onClick={async () => {
                        console.log("start")
                        await createGrade()
                      }}
                    >Start</Button>
                  </Typography>
              </Card>
  
                        }
    </>}
    {(!needsTimer || needsTimer && timerStarted) &&
      <Workbook />
    }

  </>)
}

function WorkbookPage() {
  /**
   * @returns {JSX.Element}
   * 
   * @example
   * <WorkbookPage />
   * 
   * @description
   * Display a workbook. The workbook is based on a Unit. Each unit is a collection of blocks from draftjs.
   */
  const router = useRouter()
  if (router.isFallback) {
    return (
      <div>
        <h1>Loading&hellip;</h1>
      </div>
    )
  }

  const { id } = router.query

  return (
    <FilesProvider>
      <DictionaryProvider>
        <UnitProvider id={id}>
          <TimerWrappedEditor />
        </UnitProvider>
      </DictionaryProvider>
    </FilesProvider>
  )

}

function WrappedPage() {
  return (
    <MyAuth>
      <WorkbookPage />
    </MyAuth>
  )
}

export default WrappedPage


