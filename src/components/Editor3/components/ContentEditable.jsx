import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import * as React from 'react';

export default function LexicalContentEditable({
    className,
}) {
    return (<>
        <style jsx>{`
            .ContentEditable__root {
                border: 0;
                font-size: 15px;
                display: block;
                position: relative;
                outline: 0;
                padding: 8px 28px 40px;
                min-height: 150px;
            }
            @media (max-width: 1025px) {
                .ContentEditable__root {
                padding-left: 8px;
                padding-right: 8px;
                }
            }
        `}</style>
        <ContentEditable className={className || 'ContentEditable__root'} />
    </>)
}