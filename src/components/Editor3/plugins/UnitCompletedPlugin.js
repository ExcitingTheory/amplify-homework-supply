/**
 * @fileoverview UnitCompletedPlugin - Displays unit completion modal.
 * @module UnitCompletedPlugin
 * 
 * Shows a congratulatory modal when a unit is completed, displaying
 * the unit name and top grades/scores.
 */

import * as React from 'react';
import { useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import UnitContext from '../../../context/unitContext';
import {
    Modal,
    Card,
    Typography,
    Box,
    Button,
} from '@mui/material';


/**
 * UnitCompletedPlugin - Displays modal when unit is completed.
 * 
 * Shows a modal with unit name and recent grades when the user completes
 * all exercises in a unit. Controlled by showUnitComplete from UnitContext.
 * 
 * @returns {JSX.Element} Unit completion modal component
 */
export default function UnitCompletedPlugin() {
    const { t } = useTranslation('components');

    const {
        name,
        showUnitComplete,
        setShowUnitComplete,
        recentGrades = [],
    } = useContext(UnitContext) || {};


    console.log('unitcompleted_PPPPlugin', name)


    return (
        <Modal
            open={showUnitComplete}
            onClose={() => {
                setShowUnitComplete(false)
            }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"

            sx={{
                overflow: 'auto',
            }}

            slotProps={{
                backdrop: {
                    sx: {
                        //Your style here....
                        backdropFilter: 'blur(5px)',
                    },
                },
            }}

        >
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

                <Typography variant="h3" component="h3" sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                    margin: '2rem 0.5rem 0.5rem',

                }}>
                    {t('unitCompletedPlugin.completionMessage')} {name}
                </Typography>

                {/* <Typography variant="h6" component="h6" sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                    margin: '0.5rem',
                }}>
                    {`${description}`}
                </Typography> */}

                <Typography variant="h6" component="h6" sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                    // margin: '1rem',
                }}>
                    {t('unitCompletedPlugin.sectionHeading')}
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
                <Box sx={{ display: 'flex', justifyContent: 'center', margin: '1rem' }}>
                    <Button
                        variant="contained"
                        sx={{
                            margin: '2rem',
                            width: '100%',
                        }}
                        onClick={() => {
                            setShowUnitComplete(false)
                        }}
                    >
                        {t('unitCompletedPlugin.continueButton')}
                    </Button>
                </Box>
            </Card>
        </Modal>
    )
}



