/**
 * @fileoverview StoryProgressPlugin - Auto-populates grade data for Storybook stories.
 * @module StoryProgressPlugin
 * 
 * This plugin is only used in Storybook stories to automatically create grade data
 * after the editor state loads, using the actual auto-generated node keys.
 */

import { useEffect, useContext } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import UnitContext from '../../../context/unitContext';
import { DataStore } from 'aws-amplify/datastore';
import { Grade } from '../../../models';


export default function StoryProgressPlugin() {
    const { unit, grade, saveGrade } = useContext(UnitContext);
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Only run for the progress story
        if (unit?.id !== 'workbook-with-progress-id') {
            return;
        }

        // Wait for editor state to be loaded
        const timeout = setTimeout(() => {
            editor.getEditorState().read(() => {
                const root = editor.getEditorState()._nodeMap;
                const exerciseNodes = {
                    'meaning-association': [],
                    'quiz': [],
                    'custom-answer': [],
                };
                
                // Collect all exercise node keys
                root.forEach((node, key) => {
                    if (exerciseNodes[node.__type] !== undefined) {
                        exerciseNodes[node.__type].push(key);
                    }
                });
                
                console.log('[StoryProgressPlugin] Exercise node keys:', exerciseNodes);
                console.log('[StoryProgressPlugin] grade:', grade);
                console.log('[StoryProgressPlugin] grade.data:', grade?.data);
                console.log('[StoryProgressPlugin] typeof grade.data:', typeof grade?.data);
                console.log('[StoryProgressPlugin] grade.data keys:', grade?.data ? Object.keys(grade.data) : 'no data');
                
                // Only populate if grade data is empty or doesn't have exercise keys
                const hasExerciseData = grade?.data && typeof grade.data === 'object' && 
                    Object.keys(grade.data).some(key => !isNaN(Number(key)));
                console.log('[StoryProgressPlugin] hasExerciseData:', hasExerciseData);
                
                // Early return if no grade available yet
                if (!grade) {
                    console.log('[StoryProgressPlugin] Grade not yet loaded, will retry on next update');
                    return;
                }
                
                if (!hasExerciseData) {
                    const gradeData = {};
                    
                    // Meaning association - partial progress (60% complete in Easy mode, 40% in Hard)
                    exerciseNodes['meaning-association'].forEach((key, index) => {
                        if (index === 0) {
                            gradeData[String(key)] = {
                                tabIndex: 0,
                                complete: false,
                                easy: {
                                    verifiedAnswers: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3'],
                                    attemptedAnswers: {
                                        'vocab-word-1': [],
                                        'vocab-word-2': ['vocab-word-3'],
                                        'vocab-word-3': [],
                                    },
                                    attemptsCount: 4,
                                    accuracy: 0.75,
                                    percentComplete: 0.6,
                                    complete: false,
                                },
                                hard: {
                                    verifiedAnswers: ['vocab-word-1', 'vocab-word-2'],
                                    attemptedAnswers: {
                                        'vocab-word-1': ['vocab-word-1'],
                                        'vocab-word-2': ['vocab-word-3', 'vocab-word-2'],
                                    },
                                    percentComplete: 0.4,
                                    complete: false,
                                },
                                learn: {
                                    verifiedAnswers: ['vocab-word-1'],
                                    attemptedAnswers: {
                                        'vocab-word-1': ['vocab-word-1'],
                                    },
                                    attemptsCount: 1,
                                    accuracy: 1.0,
                                    percentComplete: 0.2,
                                    complete: false,
                                },
                            };
                        }
                    });
                    
                    // Quiz - 2 out of 4 questions answered (50% complete)
                    exerciseNodes['quiz'].forEach((key, index) => {
                        if (index === 0) {
                            gradeData[String(key)] = {
                                accuracy: 0.5,
                                attemptedAnswers: {
                                    '0': '0',
                                    '1': '1',
                                },
                                correctAnswers: {
                                    '0': '0',
                                },
                                complete: false,
                            };
                        }
                    });
                    
                    // Custom answers - both completed
                    exerciseNodes['custom-answer'].forEach((key, index) => {
                        gradeData[String(key)] = {
                            accuracy: 1.0,
                            complete: true,
                            userResponse: index === 0 ? 'Dog' : 'A farewell greeting',
                            feedback: index === 0 
                                ? 'Correct! "犬" (inu) means "dog" in Japanese.' 
                                : 'Great! "さようなら" (sayounara) is indeed a farewell greeting.',
                        };
                    });
                    
                    console.log('[StoryProgressPlugin] Seeding grade with data:', gradeData);
                    
                    // Update the grade with real node keys using Grade.copyOf
                    const updatedGrade = Grade.copyOf(grade, draft => {
                        draft.data = gradeData;
                        draft.percentComplete = 0.65;
                        draft.accuracy = 0.75;
                    });
                    
                    console.log('[StoryProgressPlugin] updatedGrade:', updatedGrade);
                    console.log('[StoryProgressPlugin] updatedGrade.data:', updatedGrade.data);
                    
                    // Use DataStore.save directly (saveGrade expects different format)
                    DataStore.save(updatedGrade).catch(err => 
                        console.error('[StoryProgressPlugin] Failed to save grade:', err)
                    );
                }
            });
        }, 200);

        return () => clearTimeout(timeout);
    }, [editor, unit?.id, grade]);

    return null;
}
