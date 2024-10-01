'use strict';
import React, { use } from 'react';
import { DataStore } from 'aws-amplify/datastore';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Box,
  Collapse,
  IconButton,
  ListItem,
  List,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import SectionContext from '../../../context/sectionContext';
import UnitContext from '../../../context/unitContext';
import { Assignment, Unit } from '../../../models';

import TimerIcon from '@mui/icons-material/Timer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const formatTime = (countDown) => {
  /**
   * @param {number} countDown
   * @returns {number[]} [hours, minutes, seconds]
   * 
   * @example
   * formatTime(1000) // [0, 0, 1]
   * 
   * @example
   * formatTime(1000 * 60 * 60 * 24) // [24, 0, 0]
   * 
   * @description 
   * Convert milliseconds to hours, minutes, seconds
   * 
   */

  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [hours, minutes, seconds];
};



export default function AssignmentConfiguration() {

  const {
    sections, sectionMap, assignments
  } = React.useContext(SectionContext);

  const {
    unit
  } = React.useContext(UnitContext);

  const [section, setSection] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [openTimerDialog, setOpenTimerDialog] = React.useState(false);
  const [timer, setTimer] = React.useState(unit?.timeLimitSeconds || '');


  React.useEffect(() => {
    console.log('AssignmentConfiguration.useEffect.unit?.timeLimitSeconds', unit?.timeLimitSeconds)
    setTimer(unit?.timeLimitSeconds || '');
  }, [unit?.timeLimitSeconds]);


  const handleTimerChange = async (event) => {
    const _timer = event.target.value;

    console.log('_handleTimerChange.timer', timer);
    if (_timer == timer) {
      return;
    }

    setTimer(_timer);
  };

  const addTimer = async (event) => {
    event.preventDefault()
    // save model to db
    console.log('content state', unit);
    try {
      await DataStore.save(
        Unit.copyOf(unit, updated => {
          updated.timeLimitSeconds = parseInt(timer)
        })
      );
    } catch (errors) {
      console.error(errors)
    }

    setOpenTimerDialog(false)
  }


  const handleDueDateChange = async (event) => {
    const date = new Date(Date.parse(event.target.value));

    const isoDate = date.toISOString();
    console.log('ISO date:', isoDate);
    console.log('dueDate', dueDate);

    if (isoDate == dueDate) {
      return;
    }

    setDueDate(isoDate);

  };

  const handleSectionChange = async (event) => {
    const _section = event.target.value;

    console.log('_handleSectionChange.section', section);
    if (_section == section) {
      return;
    }

    setSection(_section);
  };

  const addDueDate = async (event) => {
    event.preventDefault();
    // save model to db
    console.log('add due date', dueDate);
    console.log('to this section', section);
    // setOpen(false);
    const assignment = {
      unitID: unit.id,
      sectionID: section,
      learner: sectionMap[section].learner,
      dueDate: dueDate
    };

    console.log('assignment', assignment);

    await DataStore.save(new Assignment(assignment));

    // add to the dynamic group list if it doesn't exist
    const learners = unit.learners || [];

    if (!learners.includes(sectionMap[section].learner)) {
      learners.push(sectionMap[section].learner);
      await DataStore.save(Unit.copyOf(unit, updated => {
        updated.learners = learners;
      }));
    }
  };

  const deleteAssignment = async (assignment) => {
    console.log('deleteAssignment', assignment);
    await DataStore.delete(assignment);
  };


  


  const [hours, minutes, seconds] = formatTime(unit?.timeLimitSeconds * 1000)
  const timeString = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':')

  return (
    <>


      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',

        }}
      >
        <Box
          sx={{
            // maxWidth: '30rem',
            padding: '1rem',
          }}
        >
        <h3
          style={{
            textWrap: 'wrap',
          }}>
          Add a timer to this unit?
        </h3>
        <Typography
          sx={{
            textWrap: 'wrap',
          }}
        >
          The timer will start after the user has clicked the "Start" button.
          <br /><br />
          Users will be allowed to continue after the timer has run out, and it will be recorded when the assignment was started and completed.
          The countdown will be displayed at the top of the screen for the duration of the timer.
        </Typography>


        {unit?.timeLimitSeconds > 0 &&
          <Button
            style={{
              width: '100%',
              margin: '1rem auto 1rem auto',
              display: 'block',
            }}
            color='primary'
            onClick={() => setOpenTimerDialog(true)}
            variant='contained'
            size='large'
            startIcon={<TimerIcon />}>
            {timeString}
          </Button>
        }
        {!unit?.timeLimitSeconds > 0 &&
          <Button
          style={{
            width: '100%',
            margin: '1rem auto 1rem auto',
            display: 'block',
          }}
            color='primary'
            variant='contained'
            onClick={() => setOpenTimerDialog(true)}
            startIcon={<TimerIcon />}>
            Add Timer
          </Button>
        }

        <Collapse in={openTimerDialog} >
          <form onSubmit={addTimer}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '1rem',
            }}
          >
              <TextField
                autoFocus
                id="outlined-timer"
                label="Timer (seconds)"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                value={timer}
                onChange={handleTimerChange}
                variant="outlined"
              />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Button
                sx={{
                  margin: '1rem',
                }}
              
              onClick={() => setOpenTimerDialog(false)}>Cancel</Button>
              <Button variant='contained' type="submit" color="primary" autoFocus>
                Ok
              </Button>
            </Box>
          </form>
        </Collapse>

        </Box>


      </Box>


      <Box
        sx={{
          // maxWidth: '30rem',
        }}
      >


        <form onSubmit={addDueDate}>
          <h3
            style={{
              margin: '1rem 1rem 0rem 1rem',
              textWrap: 'wrap',
            }}>Assign a due date to this unit for a section?</h3>

          <Typography sx={{
            margin: '1rem',
            textWrap: 'wrap'
          }}>
            Users will be allowed to continue after the due date has passed.
            The due date will be used to sort the units in the class section.
          </Typography>
          <TextField
            sx={{ margin: '1rem' }}
            id="datetime-local"
            // label="Due Date"
            hiddenLabel
            // ariaLabel='Due Date'
            required
            type="datetime-local"
            defaultValue={dueDate}

            onChange={handleDueDateChange}
          />

          <br />


          <FormControl sx={{ margin: '1rem' }}>
            <InputLabel id="section-select-helper-label">Section</InputLabel>
            <Select
              labelId="section-select-helper-label"
              id="section-select-helper"
              value={section}
              label="Section"
              required
              // variant='contained'
              onClick={(e) => e.stopPropagation()}
              onChange={handleSectionChange}
            >

              {sections?.length > 0 &&
                sections.map((_section, index) => {
                  return (
                    <MenuItem key={index} value={_section.id}
                    >
                      <div>
                        <div style={{
                          overflow: 'hidden',
                          width: '100%',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>{_section.name}:</div>
                        <div style={{
                          overflow: 'hidden',
                          width: '100%',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>{_section.description}</div>
                      </div>

                    </MenuItem>
                  );
                })}
            </Select>
            <FormHelperText>Select a section to assign the due date to</FormHelperText>
          </FormControl>
          {/* </SectionProvider> */}

          <Box sx={{
            margin: '1rem'
          }}>
            {/* <Button onClick={() => setOpenAssignmentDialog(false)}>Done</Button> */}
            <Button type="submit" autoFocus
              variant='contained'
              color='primary'
              style={{
                width: '100%',
                margin: '1rem auto 1rem auto',
                display: 'block',
              }}
              startIcon={<CalendarMonthIcon />}
            >
              Add Due Date
            </Button>
          </Box>
          {
            /**
             * A list of sections that are already assigned to this unit
             */
          }
          <div style={{ margin: '1rem' }} onClick={(e) => e.stopPropagation()}>

            <h4 style={{ margin: '1rem' }}>
              Assigned to Sections
            </h4>
            {assignments?.length > 0 &&
            <List>
              {assignments.map((_assignment, index) => {

                const description = _assignment?.dueDate ? new Date(_assignment?.dueDate).toLocaleString() : 'No due date set';

                const name = sectionMap[_assignment?.sectionID]?.name || 'No section set';
                return (
                  <ListItem key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '0 0 1rem 0',
                    // padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                  }}>

                    <ListItemText primary={name} secondary={description} />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={() => deleteAssignment(_assignment)}
                        variant='contained'
                        color='inherit'
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                    </ListItem>
                )
              })
            }
              </List>          
            } 
          </div>
        </form>
      </Box>
    </>
  );
};

