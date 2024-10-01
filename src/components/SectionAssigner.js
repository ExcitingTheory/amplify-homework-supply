'use strict';
import React from 'react';
import { DataStore } from 'aws-amplify/datastore';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import SectionContext from '../context/sectionContext';
import { Assignment, Unit } from '../models';


export const SectionAssigner = ({ setOpenAssignmentDialog, openAssignmentDialog, ContentModel }) => {

  const {
    sections, sectionMap, assignments
  } = React.useContext(SectionContext);

  // console.log('SectionAssigner.sections', sections)
  const [section, setSection] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');


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
      unitID: ContentModel.id,
      sectionID: section,
      learner: sectionMap[section].learner,
      dueDate: dueDate
    };

    console.log('assignment', assignment);

    await DataStore.save(new Assignment(assignment));

    // add to the dynamic group list if it doesn't exist
    const learners = ContentModel.learners || []  ;

    if (!learners.includes(sectionMap[section].learner)) {
      learners.push(sectionMap[section].learner);
      await DataStore.save(Unit.copyOf(ContentModel, updated => {
        updated.learners = learners;
      }));
    }
  };

  const deleteAssignment = async (assignment) => {
    console.log('deleteAssignment', assignment);
    await DataStore.delete(assignment);
  };



  return (
    <Dialog
      open={openAssignmentDialog}
      onClose={() => setOpenAssignmentDialog(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      slotProps={{
        backdrop: {
          sx: {
            //Your style here....
            backdropFilter: 'blur(1px)'
          },
        },
      }}
    >
      <form onSubmit={addDueDate} sx={{ width: '100%' }}>
        <DialogTitle id="alert-dialog-title" sx={{
          margin: '1rem 1rem 0rem 1rem'
        }}>{"Assign a due date to this unit for a section?"}</DialogTitle>
        <DialogContent>

          {
            /**
             * TODO: Add a list of assignments that are already assigned to this unit
             */
          }
          <DialogContentText id="alert-dialog-description" sx={{
            margin: '1rem'
          }}>
            Users will be allowed to continue after the due date has passed.
            The due date will be used to sort the units in the class section.
          </DialogContentText>
          <TextField
            sx={{ margin: '1rem' }}
            id="datetime-local"
            label="Due Date"
            required
            type="datetime-local"
            onClick={(e) => e.stopPropagation()}
            defaultValue={dueDate}
            onChange={handleDueDateChange}
            InputLabelProps={{
              shrink: true,
            }} />
          {
            /**
             * TODO: Add a select for sections
             *
             * This will allow the user to select which sections to assign the due date to
             *
             */
          }
          {/* <SectionProvider> */}
          <FormControl sx={{ width: '90%', margin: '1rem' }}>
            <InputLabel id="section-select-helper-label">Section</InputLabel>
            <Select
              labelId="section-select-helper-label"
              id="section-select-helper"
              value={section}
              label="Section"
              required
              onClick={(e) => e.stopPropagation()}
              onChange={handleSectionChange}
            >
              {/* <MenuItem value={0}>
              <em>None</em>
            </MenuItem> */}
              {
                /**
                 * TODO Make this actually work
                 */
              }
              {/* <MenuItem value={1}>All Sections</MenuItem> */}

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

        </DialogContent>
        <DialogActions sx={{
          margin: '1rem'
        }}>
          <Button onClick={() => setOpenAssignmentDialog(false)}>Done</Button>
          <Button type="submit" autoFocus
            variant='contained'
            color='primary'
          >
            Add
          </Button>
        </DialogActions>
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
            assignments.map((_assignment, index) => {
              return (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '1rem',
                  padding: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                }}>
                  <div>
                    <div style={{
                      overflow: 'hidden',
                      width: '100%',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{_assignment.dueDate}</div>
                    <div style={{
                      overflow: 'hidden',
                      width: '100%',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{sectionMap[_assignment.sectionID]?.name}</div>
                    {
                      /**
                       * TODO Add a description to sections,
                       * fix the way it scrolls off the right of the screen
                       */
                    }

                    {/* <div style={{
                              overflow: 'hidden',
                              width: '100%',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>{sectionMap[_assignment.sectionID]?.description}</div> */}
                  </div>
                  <div>
                    <Button
                      // disabled
                      onClick={() => {
                        console.log('delete assignment', _assignment);
                        deleteAssignment(_assignment);
                      }}
                      endIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}

        </div>
      </form>
    </Dialog>
  );
};
