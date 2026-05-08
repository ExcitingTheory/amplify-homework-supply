import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd-multi-backend'
import { HTML5toTouch } from 'rdndmb-html5-to-touch'
import { Stack, FormControlLabel, IconButton, Switch } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ClearIcon from '@mui/icons-material/Clear';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

export default function SortableAnswers({
    answers,
    onQuestionChange,
    onCorrectChange,
    onQuestionDelete,
    onQuestionReorder
}) {

    function list() {
        console.log('answers', answers)
        const _answers = answers || [];
        return _answers.map((answer, index) => (
            <Answer
                data={answer}
                answers={answers}
                index={index}
                key={index}
                onQuestionChange={onQuestionChange}
                onCorrectChange={onCorrectChange}
                onQuestionDelete={onQuestionDelete}
                onQuestionReorder={onQuestionReorder}
            />
        ))
    }

    return (
        <DndProvider options={HTML5toTouch}>
            {list()}
        </DndProvider>
    );
}

function Answer({ data, index, answers, onQuestionReorder, onQuestionChange, onCorrectChange, onQuestionDelete }) {
    const t = useTranslations('components');
    console.log('Answer', data)
    const [{ isDragging }, drag] = useDrag({
        type: 'answer',
        item: { type: 'answer', id: index, index },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [{ isOver }, drop] = useDrop({
        accept: 'answer',
        drop: (draggedItem, monitor) => {
            const draggedIndex = draggedItem.index;
            const droppedIndex = index;

            if (draggedIndex === droppedIndex) {
                return;
            }

            const newAnswers = reorder(
                answers,
                draggedIndex,
                droppedIndex
            );

            onQuestionReorder(newAnswers)
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    });

    return (
        <div ref={drop} style={{ backgroundColor: isOver ? 'var(--mui-palette-action-hover, lightblue)' : 'var(--mui-palette-background-paper, white)' }}>
            <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
                <Stack
                    border="thin solid"
                    padding="0.5rem"
                    margin="0.5rem"
                    direction="row"
                    spacing={2}
                    maxWidth="40rem"

                    alignItems="center"
                >
                    <DragIndicatorIcon />
                    <TextField
                        label={t('sortableAnswers.answerLabel', { number: index + 1 })}
                        value={data.answer || ''}
                        onChange={(event) => { onQuestionChange(event, index) }}
                        fullWidth
                        inputRef={(input) => {
                            if (input != null && !input?.value) {
                                input.focus();
                            }
                        }}
                    />
                    <FormControlLabel
                        value={data.correct}
                        data-tour="correct-checkbox"
                        control={<Switch color="primary" checked={data.correct} />}
                        label={data.correct ? t('sortableAnswers.correct') : t('sortableAnswers.incorrect')}
                        onChange={(event) => { onCorrectChange(event, index) }}
                        labelPlacement="bottom"
                    />
                    <IconButton
                        aria-label={t('actions.delete', { ns: 'common' })}
                        onClick={() => { onQuestionDelete(index) }}
                    >
                        <ClearIcon />
                    </IconButton>

                </Stack>
            </div>
        </div>
    );
}
