'use strict';
import React, { use } from 'react';
import { useTranslation } from 'next-i18next';
import { getAmplifyClient } from '../../../utils/amplifyClient';
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
  const { t } = useTranslation('editor.authoring');

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
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: unit.id,
        timeLimitSeconds: parseInt(timer)
      });
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
    const assignment = {
      unitID: unit.id,
      sectionID: section,
      learner: sectionMap[section].learner,
      dueDate: dueDate
    };

    console.log('assignment', assignment);

    const client = getAmplifyClient();
    await client.models.Assignment.create(assignment);

    // add to the dynamic group list if it doesn't exist
    const learners = unit.learners || [];

    if (!learners.includes(sectionMap[section].learner)) {
      learners.push(sectionMap[section].learner);
      await client.models.Unit.update({
        id: unit.id,
        learners: learners
      });
    }
  };

  const deleteAssignment = async (assignment) => {
    console.log('deleteAssignment', assignment);
    const client = getAmplifyClient();
    await client.models.Assignment.delete({ id: assignment.id });
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
          {t('assignmentConfiguration.addTimerQuestion')}
        </h3>
        <Typography
          sx={{
            textWrap: 'wrap',
          }}
        >
          {t('assignmentConfiguration.timerDescription')}
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
            title='Add Timer to Unit'
            onClick={() => setOpenTimerDialog(true)}
            startIcon={<TimerIcon />}>
            {t('assignmentConfiguration.addTimerButton')}
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
                label={t('assignmentConfiguration.timerLabel')}
                title="Set timer in seconds"
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
              
              onClick={() => setOpenTimerDialog(false)}>{t('assignmentConfiguration.cancel')}</Button>
              <Button
                variant='contained'
                title="Set Unit Timer"
                type="submit"
                color="primary"
                autoFocus
                >
                {t('assignmentConfiguration.save')}
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
        data-tour="assignment-settings"
      >


        <form onSubmit={addDueDate}>
          <h3
            style={{
              margin: '1rem 1rem 0rem 1rem',
              textWrap: 'wrap',
            }}>{t('assignmentConfiguration.assignDueDateQuestion')}</h3>

          <Typography sx={{
            margin: '1rem',
            textWrap: 'wrap'
          }}>
            {t('assignmentConfiguration.dueDateDescriptionLine1')}
            {t('assignmentConfiguration.dueDateDescriptionLine2')}
          </Typography>
          <TextField
            sx={{ margin: '1rem' }}
            id="datetime-local"
            data-tour="due-date-picker"
            // label="Due Date"
            hiddenLabel
            // ariaLabel='Due Date'
            required
            label={t('assignmentConfiguration.dueDateLabel')}
            type="datetime-local"
            defaultValue={dueDate}

            onChange={handleDueDateChange}
          />

          <br />


          <FormControl sx={{ margin: '1rem' }}>
            <InputLabel id="section-select-helper-label">{t('assignmentConfiguration.sectionLabel')}</InputLabel>
            <Select
              labelId="section-select-helper-label"
              id="section-select-helper"
              data-tour="unit-selector"
              value={section}
              label={t('assignmentConfiguration.sectionLabel')}
              title="Select Section"
              required
              // variant='contained'
              onClick={(e) => e.stopPropagation()}
              onChange={handleSectionChange}
            >

              {sections?.length > 0 &&
                sections.filter(s => s != null && s.id != null).map((_section, index) => {
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
            <FormHelperText>{t('assignmentConfiguration.selectSectionHelper')}</FormHelperText>
          </FormControl>
          {/* </SectionProvider> */}

          <Box sx={{
            margin: '1rem'
          }}>
            {/* <Button onClick={() => setOpenAssignmentDialog(false)}>Done</Button> */}
            <Button type="submit" autoFocus
              data-tour="create-assignment-button"
              variant='contained'
              title="Add due date to Unit"
              color='primary'
              style={{
                width: '100%',
                margin: '1rem auto 1rem auto',
                display: 'block',
              }}
              startIcon={<CalendarMonthIcon />}
            >
              {t('assignmentConfiguration.addDueDateButton')}
            </Button>
          </Box>
          {
            /**
             * A list of sections that are already assigned to this unit
             */
          }
          <div style={{ margin: '1rem' }} onClick={(e) => e.stopPropagation()}>

            <h4 style={{ margin: '1rem' }}>
              {t('assignmentConfiguration.assignedToSectionsHeading')}
            </h4>
            {assignments?.length > 0 &&
            <List>
              {assignments.map((_assignment, index) => {

                const description = _assignment?.dueDate ? new Date(_assignment?.dueDate).toLocaleString() : t('assignmentConfiguration.noDueDateSet');

                const name = sectionMap[_assignment?.sectionID]?.name || t('assignmentConfiguration.noSectionSet');
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

