/**
 * @fileoverview UnitCompletedPlugin - Displays unit completion modal.
 * @module UnitCompletedPlugin
 * 
 * Shows a congratulatory modal when a unit is completed, displaying
 * the unit name, top grades/scores, and action buttons (Try Again, Peer Review).
 * The modal persists across navigation until the student explicitly starts a new attempt.
 */

import * as React from 'react';
import { useContext, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

import UnitContext from '../../../context/unitContext';
import { useXP } from '../../../context/gamificationContext';
import { OpenPeerReviewButton } from '../../PeerReview/OpenPeerReviewButton';
import { HomeworkXPSummary } from '../../Gamification/HomeworkXPSummary';
import { PersonalBestBanner } from '../../Gamification/PersonalBestBanner';
import { getAmplifyClient } from '../../../utils/amplifyClient';
import {
    Modal,
    Card,
    Typography,
    Box,
    Button,
    Divider,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';


/**
 * UnitCompletedPlugin - Displays modal when unit is completed.
 * 
 * Shows a modal with unit name, recent grades, and action buttons.
 * If retryEnabled is true on the unit, a "Try Again" button creates a new grade.
 * An "Open for Peer Review" button launches the peer review flow.
 * The modal cannot be dismissed by backdrop click — student must take an action.
 * 
 * @returns {JSX.Element} Unit completion modal component
 */
export default function UnitCompletedPlugin() {
    const { t } = useTranslation('workbook');
    const router = useRouter();

    const {
        unit,
        name,
        grade,
        showUnitComplete,
        setShowUnitComplete,
        personalBestResult,
        setPersonalBestResult,
        createGrade,
        recentGrades = [],
    } = useContext(UnitContext) || {};

    const [retrying, setRetrying] = useState(false);
    const { totalXP, xpLogs } = useXP();

    const retryEnabled = unit?.retryEnabled === true;
    // Most recent completed grade for peer review
    const latestCompletedGrade = recentGrades[0];

    const handleTryAgain = async () => {
        setRetrying(true);
        try {
            await createGrade(0, false);
            setShowUnitComplete(false);
        } catch (err) {
            console.error('[UnitCompletedPlugin] Error creating new grade:', err);
        } finally {
            setRetrying(false);
        }
    };

    const handleCreateRoom = async (gradeId, invitedUserIds) => {
        const client = getAmplifyClient();
        const { data: room } = await client.models.HomeworkRoom.create({
            gradeId,
            status: 'open',
            peerGroup: invitedUserIds,
        });
        return room.id;
    };

    const handleRoomCreated = (roomId) => {
        router.push(`/review/${roomId}`);
    };


    return (
        <Modal
            open={showUnitComplete}
            onClose={(_, reason) => {
                // Only allow close if retryEnabled, or if there's an active incomplete grade
                if (retryEnabled || grade) {
                    setShowUnitComplete(false);
                }
                // Otherwise: no backdrop/escape dismiss — student must use Try Again
            }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"

            sx={{
                overflow: 'auto',
            }}

            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: 'blur(5px)',
                    },
                },
            }}

        >
            <Card
                data-tour="results"
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70vw',
                    maxWidth: '700px',
                    bgcolor: 'background.paper',
                    boxShadow: '0 0 10px 3px rgba(0, 0, 0, .3)',
                    backdropFilter: 'blur(5px)',
                    overflow: 'auto',
                    maxHeight: '90vh',
                }}
            >

                <Typography variant="h3" component="h3" sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                    margin: '2rem 0.5rem 0.5rem',

                }}>
                    {t('unitCompletedPlugin.completionMessage')} {name}
                </Typography>

                <Typography variant="h6" component="h6" sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                }}>
                    {t('unitCompletedPlugin.sectionHeading')}
                </Typography>

                {/* Personal Best Banner */}
                {personalBestResult?.isNewBest && (
                    <Box sx={{ mx: 2, mt: 1 }}>
                        <PersonalBestBanner
                            open={true}
                            newScore={personalBestResult.bestScore}
                            previousBest={personalBestResult.previousBest}
                            onClose={() => setPersonalBestResult?.(null)}
                        />
                    </Box>
                )}

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
                        maxHeight: '40vh',
                        overflow: 'auto',
                    }}

                >
                    {recentGrades.map((grade, index) => {
                        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        const localTime = new Date(grade?.createdAt).toLocaleString(undefined, {
                            timeZone
                        });

                        const _roundedAccuracy = Math.round(grade?.accuracy * 100) / 100

                        return (
                            <li key={index}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', margin: '0' }}>
                                    <Typography variant="h6" component="div" sx={{
                                        textAlign: 'left',
                                        paddingLeft: '2rem',
                                    }}>
                                        {`${localTime}`}
                                    </Typography>

                                    <div style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        flexGrow: 1,
                                        borderBottom: '1px dashed currentColor',
                                        margin: '0 0.4rem',
                                        position: 'relative',
                                        top: '-0.5rem',
                                    }}>
                                    </div>

                                    <Typography variant="h6" component="div" sx={{
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

                {/* XP Summary for this homework */}
                {xpLogs.length > 0 && (() => {
                    // Show XP earned from this grade's reference
                    const gradeId = latestCompletedGrade?.id;
                    const relevantLogs = gradeId
                        ? xpLogs.filter(l => l.referenceId === gradeId)
                        : xpLogs.slice(-3);
                    if (relevantLogs.length === 0) return null;
                    const lineItems = relevantLogs.map(l => ({
                        label: l.reason?.replace(/_/g, ' ') || 'XP',
                        xp: l.xpAmount || 0,
                    }));
                    const earnedXP = lineItems.reduce((s, i) => s + i.xp, 0);
                    return (
                        <Box sx={{ px: 3, pb: 1 }}>
                            <HomeworkXPSummary
                                lineItems={lineItems}
                                totalXP={earnedXP}
                                cumulativeXP={totalXP}
                            />
                        </Box>
                    );
                })()}

                <Divider sx={{ mx: 2 }} />

                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 3,
                    alignItems: 'center',
                }}>
                    {retryEnabled && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<ReplayIcon />}
                            onClick={handleTryAgain}
                            disabled={retrying}
                            sx={{ width: '100%', maxWidth: '400px' }}
                        >
                            {retrying
                                ? t('unitCompletedPlugin.retrying', 'Starting new attempt...')
                                : t('unitCompletedPlugin.tryAgain', 'Try Again')
                            }
                        </Button>
                    )}

                    {latestCompletedGrade && (
                        <OpenPeerReviewButton
                            gradeId={latestCompletedGrade.id}
                            onCreateRoom={handleCreateRoom}
                            onRoomCreated={handleRoomCreated}
                        />
                    )}
                </Box>
            </Card>
        </Modal>
    )
}



