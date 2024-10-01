import {LexicalEditor} from 'lexical';
import React, {useState} from 'react';

import {
    Button,
    Modal,
} from '@mui/material';
import {INSERT_LAYOUT_COMMAND} from '../plugins/LayoutPlugin';

const LAYOUTS = [
    {label: '2 columns (equal width)', value: '1fr 1fr'},
    {label: '2 columns (25% - 75%)', value: '1fr 3fr'},
    {label: '3 columns (equal width)', value: '1fr 1fr 1fr'},
    {label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr'},
    {label: '4 columns (equal width)', value: '1fr 1fr 1fr 1fr'},
];

export default function InsertLayoutDialog({activeEditor, onClose}) {
    const [layout, setLayout] = useState(LAYOUTS[0].value);
    const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label;

    const onClick = () => {
        activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
        onClose();
    };

    return (
        <>
            <DropDown
                buttonClassName="toolbar-item dialog-dropdown"
                buttonLabel={buttonLabel}>
                {LAYOUTS.map(({label, value}) => (
                    <DropDownItem
                        key={value}
                        className="item"
                        onClick={() => setLayout(value)}>
                        <span className="text">{label}</span>
                    </DropDownItem>
                ))}
            </DropDown>
            <Button onClick={onClick}>Insert</Button>
        </>
    );
}