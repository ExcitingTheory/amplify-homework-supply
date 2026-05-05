/**
 * @fileoverview ToolbarScrollButton - Scroll arrow button matching MUI TabScrollButton style.
 * @module ToolbarScrollButton
 *
 * Provides consistent scroll arrow buttons for horizontally scrollable toolbars.
 * Styled to exactly match MUI Tabs scroll buttons for visual consistency.
 */

import * as React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

/**
 * Scroll arrow button that matches MUI TabScrollButton styling.
 *
 * @param {Object} props
 * @param {'left' | 'right'} props.direction
 * @param {() => void} props.onClick
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.ariaLabel]
 * @param {string|number} [props.height='2rem'] - Button height (matches toolbar item size)
 */
export const ToolbarScrollButton = React.memo(function ToolbarScrollButton({
  direction,
  onClick,
  disabled = false,
  ariaLabel,
  height = '2rem',
}) {
  const Icon = direction === 'left' ? KeyboardArrowLeftIcon : KeyboardArrowRightIcon;

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      sx={{
        // Inline with other toolbar icons — same dimensions as toolbar buttons
        width: '2rem',
        minWidth: '2rem',
        height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: '4px',
        // Match MUI TabScrollButton opacity/color behavior
        opacity: disabled ? 0.3 : 1,
        color: 'text.secondary',
        transition: 'opacity 0.2s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        '&.Mui-disabled': {
          opacity: 0.3,
        },
      }}
    >
      <Icon />
    </ButtonBase>
  );
});

export default ToolbarScrollButton;
