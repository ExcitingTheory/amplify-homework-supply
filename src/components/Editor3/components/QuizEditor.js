import React, { useState, useRef, useEffect } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Stack from '@mui/material/Stack';
// import { GutterContext } from '../context/gutterContext';
import SortableAnswers from '../../SortableAnswers';
import { $isQuizNode } from '../plugins/QuizPlugin';

import {
    $getNodeByKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';


const QuizEditor = ({
    className,
    nodeKey,
    data,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [grade, setGrade] = useState(0.0);
    const [attemptedAnswers, setAttemptedAnswers] = useState({});
    const [correct, setCorrect] = useState({});
    //   const questionValue = useRef(data);
    const [questionValue, _setQuestionValue] = useState(data);
    const [invalidQuestion, setInvalidQuestion] = useState(false);
    const [verifiedAnswers, setVerifiedAnswers] = useState({});

    const [editor] = useLexicalComposerContext();


    const setQuestionValue = (data) => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isQuizNode(node)) {
                node.saveData(data);
            }
        });
    };



    useEffect(() => {
        _setQuestionValue(data);
    }, [data]);



    const onClick = () => {
        if (editMode) {
            return;
        }

        setEditMode(true);
        startEdit();
    };

    const onValueChange = (evt) => {
        let value = evt.target.value;
        let invalid = false;
        setInvalidQuestion(invalid);
        _setQuestionValue(value);
        setQuestionValue(value);
    };

    const onCorrectChange = (evt, id) => {
        let checked = evt.target.checked;
        let tmp = JSON.parse(JSON.stringify(questionValue));
        tmp[id].correct = checked;
        _setQuestionValue(tmp);
        setQuestionValue(tmp);
    };

    const onQuestionChange = (evt, id) => {
        let value = evt.target.value;
        let tmp = JSON.parse(JSON.stringify(questionValue));
        tmp[id].answer = value;
        _setQuestionValue(tmp);
        setQuestionValue(tmp);
    };

    const gradeAnswer = (e, thisKey, thisAnswer, questionContent) => {
        e.preventDefault();
        e.stopPropagation();
        const { correct: isCorrect } = thisAnswer;
        const isChecked = e.target.checked;

        let _verifiedAnswers = { ...verifiedAnswers };
        let _attemptedAnswers = { ...attemptedAnswers };
        let _isLocked = isLocked;
        let _grade = grade;
        let _correct = {};

        if (!_verifiedAnswers) {
            _verifiedAnswers = {};
        }
        if (!_attemptedAnswers) {
            _attemptedAnswers = {};
        }

        questionContent.forEach((question, questionKey) => {
            if (question.correct === true) {
                _correct[questionKey] = question;
            }
        });

        _attemptedAnswers[thisKey] = thisAnswer;

        if (isCorrect === true && isChecked === true) {
            _verifiedAnswers[thisKey] = thisAnswer;
        } else if (isCorrect === true && isChecked === false) {
            delete _verifiedAnswers[thisKey];
            delete _attemptedAnswers[thisKey];
        } else if (isCorrect === false && isChecked === false) {
            delete _attemptedAnswers[thisKey];
        }

        const correctArr = Object.entries(_correct);
        const verifiedArr = Object.entries(_verifiedAnswers);
        const attemptedArr = Object.entries(_attemptedAnswers);

        _grade = Math.floor((verifiedArr.length / correctArr.length) * 100);

        if (attemptedArr.length === correctArr.length) {
            _isLocked = true;
        }

        if (verifiedArr.length === correctArr.length) {
            _isLocked = true;
        }

        setAttemptedAnswers(_attemptedAnswers);
        setVerifiedAnswers(_verifiedAnswers);
        setIsLocked(_isLocked);
        setCorrect(_correct);
        setGrade(_grade);
    };

    const onQuestionReorder = (answers) => {
        _setQuestionValue(answers);
        setQuestionValue(answers);
    };

    const onQuestionDelete = (id) => {
        let tmp = JSON.parse(JSON.stringify(questionValue));
        tmp.splice(id, 1);
        _setQuestionValue(tmp);
        setQuestionValue(tmp);
    };

    const onAddQuestion = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        let tmp = JSON.parse(JSON.stringify(questionValue));

        const nextId = tmp.length + 1;
        tmp.push({
            id: `id-${nextId}`,
            answer: "",
            correct: false
        });

        setQuestionValue(tmp);
    };

    const save = () => {
        setQuestionValue(questionValue);
        setInvalidQuestion(false);
        setEditMode(false);
    };

    const reset = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAttemptedAnswers({});
        setVerifiedAnswers({});
        setIsLocked(false);
        setGrade(0.0);
    };

    const remove = () => {
        console.log('remove')
    };

    const startEdit = () => {
        console.log('startEdit')
    };

    let checkboxes = [];

    if (questionValue && questionValue.length > 0) {
        checkboxes = questionValue.map((data, key) => {
            let _attemptedAnswers = attemptedAnswers || {}
            if (!_attemptedAnswers) {
                _attemptedAnswers = {};
            }
            let checked = false;
            if (_attemptedAnswers[key]) {
                checked = true;
            }
            return (
                <FormControlLabel
                    key={key}
                    control={<Checkbox checked={checked} disabled={isLocked} onClick={(e) => { gradeAnswer(e, key, data, questionValue) }} />}
                    label={data.answer}
                />
            );
        });
    }



    return (
        <div className={className} contentEditable={false} readOnly
            style={{
                display: 'flex',
                flexDirection: 'column',
                // alignItems: 'center',
                marginBottom: '2rem',

            }}
        >
            <style global jsx>{`
        figure[data-block=true] {
          margin: 0;
        }
      `}</style>
            {!editMode &&
                <>
                    <Card elevation={2} sx={{
                        flexGrow: 1,
                        width: '100%',
                        maxWidth: '900px',
                }}>
                        <Toolbar>
                            <Button
                                size='small'
                                onClick={onClick}
                            >
                                Edit
                            </Button>
                            <Box sx={{ flexGrow: 1 }}></Box>
                            <Button
                                size='small'
                                onClick={reset}
                            >
                                Reset
                            </Button>
                            <Box>
                                Grade: {grade}
                            </Box>
                        </Toolbar>
                    </Card>
                    <FormGroup>
                        {checkboxes}
                    </FormGroup>
                </>
            }
            {editMode &&
                <>
                    <Card elevation={3} sx={{ flexGrow: 1, marginBottom: '1rem' }}>
                        <Toolbar>
                            <Button
                                size='small'
                                disabled={invalidQuestion}
                                onClick={save}
                            >
                                {invalidQuestion ? 'Invalid' : 'Done'}
                            </Button>
                            <Box sx={{ flexGrow: 1 }}></Box>
                            {/* <Button
                                size='small'
                                onClick={remove}
                            >
                                Remove
                            </Button> */}
                        </Toolbar>
                    </Card>
                    <SortableAnswers
                        answers={questionValue}
                        onQuestionChange={onQuestionChange}
                        onCorrectChange={onCorrectChange}
                        onQuestionDelete={onQuestionDelete}
                        onQuestionReorder={onQuestionReorder}
                    />
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        border="thin solid #E8E8E8"
                        padding="0.5rem"
                        margin="0.5rem"
                        maxWidth="40rem"
                    >
                        <DragIndicatorIcon />
                        <TextField
                            placeholder="Add Answer"
                            onClick={onAddQuestion}
                            fullWidth
                        />
                    </Stack>
                </>
            }
        </div>
    );
};


export default QuizEditor;