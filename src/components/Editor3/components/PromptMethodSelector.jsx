import * as React from "react";
import {
  ButtonGroup,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Button from "@mui/material/Button";
import { Check } from "@mui/icons-material";
import VideoSettingsIcon from "@mui/icons-material/VideoSettings";
import InputIcon from "@mui/icons-material/Input";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslations } from "next-intl";

const METHOD_OPTIONS = [
  ["text", "text"],
  ["audio", "audio"],
  ["image", "image"],
  ["writing", "drawing"],
  ["video", "video"],
];

const METHOD_DESCRIPTIONS = {
  text: "Display the prompt or response as text.",
  audio: "Use recorded or generated audio.",
  image: "Display an image as the prompt or response.",
  writing: "Allow a handwritten response on a drawing surface.",
  video: "Use video as the prompt or response.",
};

const MEANING_MODE_OPTIONS = [
  ["learn", "Learn", "Study with guided matching and feedback."],
  ["easy", "Easy", "Match words with their meanings."],
  ["hard", "Hard", "Match without the guided meaning cues."],
];

function SelectorMenuItem({ value, selected, label, onSelect }) {
  return (
    <MenuItem selected={selected} onClick={() => onSelect(value)}>
      <ListItemIcon sx={{ minWidth: 32 }}>
        <Check sx={{ visibility: selected ? "visible" : "hidden" }} />
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
    </MenuItem>
  );
}

const selectorButtonSx = {
  minWidth: "7rem",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

const configureSectionSx = {
  px: 2,
  pt: 1,
  pb: 0.75,
  minWidth: 300,
};

const configureSectionTitleProps = { fontWeight: 700 };
const configureSectionDescriptionProps = { fontSize: "0.75rem" };

export const MeaningAssociationModeSelector = React.memo(
  ({
    enabledModes = ["learn", "easy", "hard"],
    setEnabledModes,
    showAudio = true,
    setShowAudio,
    showPronunciation = true,
    setShowPronunciation,
  }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleSelect = (value) => {
      const selected = enabledModes.includes(value);
      if (selected && enabledModes.length === 1) return;

      const nextModes = selected
        ? enabledModes.filter((mode) => mode !== value)
        : [...enabledModes, value];
      setEnabledModes(nextModes);
    };

    return (
      <>
        <Button
          id="open-meaning-modes-button"
          color="primary"
          variant="contained"
          size="small"
          startIcon={<ViewModuleIcon />}
          endIcon={<ArrowDropDownIcon />}
          aria-controls={open ? "meaning-modes-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(event) => setAnchorEl(open ? null : event.currentTarget)}
          sx={selectorButtonSx}
        >
          Configure
        </Button>
        <Menu
          id="meaning-modes-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          MenuListProps={{
            "aria-labelledby": "open-meaning-modes-button",
            dense: true,
          }}
          slotProps={{ paper: { sx: { mt: 0.5 } } }}
        >
          <ListItemText
            sx={{ px: 2, pt: 1, pb: 0.75, minWidth: 300 }}
            primary="Practice Modes"
            secondary="Choose which matching activities learners complete."
            primaryTypographyProps={{ fontWeight: 700 }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
          {MEANING_MODE_OPTIONS.map(([value, label, description]) => {
            const selected = enabledModes.includes(value);
            return (
              <MenuItem
                key={value}
                dense
                selected={selected}
                disabled={selected && enabledModes.length === 1}
                onClick={() => handleSelect(value)}
                sx={{ alignItems: "flex-start", minWidth: 300 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Check
                    sx={{
                      fontSize: 18,
                      visibility: selected ? "visible" : "hidden",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  secondary={description}
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
              </MenuItem>
            );
          })}
          <Divider />
          <ListItemText
            sx={{ px: 2, pt: 1, pb: 0.75, minWidth: 300 }}
            primary="Display Settings"
            secondary="Control supporting vocabulary text and audio."
            primaryTypographyProps={{ fontWeight: 700 }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
          <MenuItem
            dense
            onClick={() => setShowPronunciation?.(!showPronunciation)}
            sx={{ minWidth: 300 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Check
                sx={{
                  fontSize: 18,
                  visibility: showPronunciation ? "visible" : "hidden",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Show Pronunciations"
              secondary="Display pronunciation text alongside vocabulary."
              secondaryTypographyProps={{ fontSize: "0.75rem" }}
            />
          </MenuItem>
          <MenuItem
            dense
            onClick={() => setShowAudio?.(!showAudio)}
            sx={{ minWidth: 300 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Check
                sx={{
                  fontSize: 18,
                  visibility: showAudio ? "visible" : "hidden",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Enable Audio Playback"
              secondary="Allow audio controls for words and definitions."
              secondaryTypographyProps={{ fontSize: "0.75rem" }}
            />
          </MenuItem>
        </Menu>
      </>
    );
  },
);

export const MeaningAssociationPromptSelector = React.memo(
  ({ promptFor = "definition", setPromptFor }) => (
    <ButtonGroup
      size="small"
      variant="outlined"
      color="secondary"
      aria-label="Prompt for word or definition"
    >
      <Button
        variant={promptFor === "word" ? "contained" : "outlined"}
        onClick={() => setPromptFor("word")}
      >
        Prompt for word
      </Button>
      <Button
        variant={promptFor === "definition" ? "contained" : "outlined"}
        onClick={() => setPromptFor("definition")}
      >
        Prompt for definition
      </Button>
    </ButtonGroup>
  ),
);

export const AnswerConfigurationSelector = React.memo(
  ({
    promptMethod = [],
    setPromptMethod,
    allowedInput = [],
    setAllowedInput,
    promptFor,
    setPromptFor,
  }) => {
    const t = useTranslations("editor.ai");
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const inputValue = allowedInput[0] || "text";

    const togglePromptMethod = (value) => {
      const nextMethods = promptMethod.includes(value)
        ? promptMethod.filter((method) => method !== value)
        : [...promptMethod, value];
      setPromptMethod(nextMethods);
    };

    return (
      <>
        <Button
          color="primary"
          variant="contained"
          size="small"
          startIcon={<ViewModuleIcon />}
          endIcon={<ArrowDropDownIcon />}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          Configure
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { mt: 0.5 } } }}
        >
          <ListItemText
            sx={configureSectionSx}
            primary="Output"
            secondary="How the question is presented to the learner."
            primaryTypographyProps={configureSectionTitleProps}
            secondaryTypographyProps={configureSectionDescriptionProps}
          />
          {promptFor && setPromptFor && (
            <>
              <ListItemText
                sx={configureSectionSx}
                primary="Prompt"
                secondary="Choose whether learners see words or definitions."
                primaryTypographyProps={configureSectionTitleProps}
                secondaryTypographyProps={configureSectionDescriptionProps}
              />
              {["word", "definition"].map((value) => (
                <MenuItem
                  key={`prompt-${value}`}
                  dense
                  onClick={() => setPromptFor(value)}
                  sx={{ minWidth: 300 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Check
                      sx={{
                        visibility: promptFor === value ? "visible" : "hidden",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      value === "word"
                        ? "Prompt for word"
                        : "Prompt for definition"
                    }
                    secondary={
                      value === "word"
                        ? "Show the vocabulary word as the target."
                        : "Show the definition as the target."
                    }
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </MenuItem>
              ))}
              <Divider />
            </>
          )}
          {METHOD_OPTIONS.map(([value, labelKey]) => {
            const selected = promptMethod.includes(value);
            return (
              <MenuItem
                key={`output-${value}`}
                dense
                onClick={() => togglePromptMethod(value)}
                sx={{ minWidth: 300 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Check sx={{ visibility: selected ? "visible" : "hidden" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(`promptMethodSelector.menuItems.${labelKey}`)}
                  secondary={METHOD_DESCRIPTIONS[value]}
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
              </MenuItem>
            );
          })}
          <Divider />
          <ListItemText
            sx={configureSectionSx}
            primary="Input"
            secondary="How the learner submits an answer."
            primaryTypographyProps={configureSectionTitleProps}
            secondaryTypographyProps={configureSectionDescriptionProps}
          />
          {METHOD_OPTIONS.map(([value, labelKey]) => {
            const selected = inputValue === value;
            return (
              <MenuItem
                key={`input-${value}`}
                dense
                onClick={() => setAllowedInput([value])}
                sx={{ minWidth: 300 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Check sx={{ visibility: selected ? "visible" : "hidden" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(`promptMethodSelector.menuItems.${labelKey}`)}
                  secondary={METHOD_DESCRIPTIONS[value]}
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
              </MenuItem>
            );
          })}
        </Menu>
      </>
    );
  },
);

export const AllowedInputSelector = React.memo(
  ({
    ids,
    defaultAllowedInputs = ["text"],
    allowedInput = [],
    setAllowedInput,
    // wordIDs,
  }) => {
    const t = useTranslations("editor.ai");
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [_allowedInput, setAllowedInputLocal] = React.useState(
      allowedInput.length > 0 ? [allowedInput[0]] : defaultAllowedInputs,
    );
    const open = Boolean(anchorEl);

    // Sync external allowedInput prop with internal state
    React.useEffect(() => {
      if (allowedInput && allowedInput.length > 0) {
        const selected = [allowedInput[0]];
        if (JSON.stringify(selected) !== JSON.stringify(_allowedInput)) {
          setAllowedInputLocal(selected);
        }
      }
    }, [allowedInput]);

    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
      setAllowedInput(_allowedInput);
    };

    const handleSelect = (value) => {
      const selected = [value];
      setAllowedInputLocal(selected);
      setAllowedInput(selected);
      setAnchorEl(null);
    };

    return (
      <>
        <Button
          id="open-allowed-inputs-button"
          color="inherit"
          variant="outlined"
          size="small"
          startIcon={<InputIcon />}
          endIcon={<ArrowDropDownIcon />}
          aria-controls={open ? "allowed-inputs-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={open ? handleClose : handleClick}
          sx={selectorButtonSx}
        >
          {t("promptMethodSelector.inputButton")}
        </Button>
        <Menu
          id="allowed-inputs-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "open-allowed-inputs-button",
          }}
        >
          {METHOD_OPTIONS.map(([value, labelKey]) => (
            <SelectorMenuItem
              key={value}
              value={value}
              selected={_allowedInput.includes(value)}
              label={t(`promptMethodSelector.menuItems.${labelKey}`)}
              onSelect={handleSelect}
            />
          ))}
        </Menu>
      </>

      //     <MenuList dense open={open}>
      //         <MenuItem>
      //         {useVideos &&
      //         <ListItemIcon>
      //         <Check />
      //         </ListItemIcon>
      //         }
      //         <ListItemText primary="Videos" />
      //         </MenuItem>
      //     </MenuList>
      // </>
    );
  },
);
export const PromptMethodSelector = React.memo(
  ({
    ids,
    defaultPromptMethods = ["text", "audio", "writing"],
    promptMethod = [],
    setPromptMethod,
    primary = false,
    // wordIDs,
  }) => {
    const t = useTranslations("editor.ai");
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [_promptMethods, setPromptMethods] = React.useState(
      promptMethod.length > 0 ? promptMethod : [],
    );
    const open = Boolean(anchorEl);

    // Sync external promptMethod prop with internal state
    React.useEffect(() => {
      if (promptMethod && promptMethod.length > 0) {
        const newMethodsStr = JSON.stringify(promptMethod);
        const currentMethodsStr = JSON.stringify(_promptMethods);
        if (newMethodsStr !== currentMethodsStr) {
          setPromptMethods(promptMethod);
        }
      }
    }, [promptMethod]);

    // if the working methods change, update the promptMethod
    // React.useEffect(() => {
    //     console.log('useEffect._promptMethods', _promptMethods);
    //     setPromptMethod(_promptMethods);
    // }, [JSON.stringify(_promptMethods)]);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
      setPromptMethod(_promptMethods);
    };

    const handleSelect = (value) => {
      const mergeMethods = _promptMethods.includes(value)
        ? _promptMethods.filter((x) => x !== value)
        : [..._promptMethods, value];
      setPromptMethods(mergeMethods);
      setPromptMethod(mergeMethods);
    };

    return (
      <>
        <Button
          id="open-prompt-methods-button"
          color={primary ? "primary" : "inherit"}
          variant={primary ? "contained" : "outlined"}
          size="small"
          startIcon={<VideoSettingsIcon />}
          endIcon={<ArrowDropDownIcon />}
          aria-controls={open ? "prompt-methods-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={open ? handleClose : handleClick}
          sx={selectorButtonSx}
        >
          {t("promptMethodSelector.outputButton")}
        </Button>
        <Menu
          id="prompt-methods-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "open-prompt-methods-button",
          }}
        >
          {METHOD_OPTIONS.map(([value, labelKey]) => (
            <SelectorMenuItem
              key={value}
              value={value}
              selected={_promptMethods.includes(value)}
              label={t(`promptMethodSelector.menuItems.${labelKey}`)}
              onSelect={handleSelect}
            />
          ))}
        </Menu>
      </>

      //     <MenuList dense open={open}>
      //         <MenuItem>
      //         {useVideos &&
      //         <ListItemIcon>
      //         <Check />
      //         </ListItemIcon>
      //         }
      //         <ListItemText primary="Videos" />
      //         </MenuItem>
      //     </MenuList>
      // </>
    );
  },
);
