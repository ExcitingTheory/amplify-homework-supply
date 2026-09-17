import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";

import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function MeterRow({ icon, value, color, neutral, label, description }) {
  const percent = clampPercent(value);
  const valueDescription = `${label}: ${Math.round(percent)}%. ${description}`;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "34px minmax(0, 1fr) 34px",
        alignItems: "center",
        columnGap: 2,
      }}
    >
      <Tooltip title={`${label}. ${description}`} arrow>
        <Box
          component="span"
          sx={{ display: "inline-flex", justifySelf: "center" }}
        >
          {icon}
        </Box>
      </Tooltip>
      <Tooltip title={valueDescription} arrow>
        <LinearProgress
          aria-label={valueDescription}
          variant="determinate"
          value={percent}
          color={neutral ? "inherit" : color}
          sx={{
            height: 6,
            color: neutral ? "text.disabled" : undefined,
            borderRadius: `${SEMANTIC_THEME.radius.progress}px`,
          }}
        />
      </Tooltip>
      <Tooltip title={valueDescription} arrow>
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          sx={{ minWidth: 34, textAlign: "right" }}
        >
          {Math.round(percent)}%
        </Typography>
      </Tooltip>
    </Box>
  );
}

export function ExerciseProgressMeters({
  percentComplete = 0,
  accuracy = 0,
  hasAttempts = false,
  progressDescription = "Percentage of required answers attempted.",
  accuracyDescription = "Percentage of required answers selected correctly.",
}) {
  const accuracyColor =
    accuracy >= 80 ? "success" : accuracy >= 60 ? "warning" : "error";

  return (
    <Box sx={{ mb: 1.5 }}>
      <MeterRow
        icon={<DonutLargeIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
        value={percentComplete}
        color="primary"
        label="Progress"
        description={progressDescription}
      />
      <Box sx={{ height: 4 }} />
      <MeterRow
        icon={<CheckCircleIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
        value={accuracy}
        color={accuracyColor}
        neutral={!hasAttempts}
        label="Correct"
        description={accuracyDescription}
      />
    </Box>
  );
}

export default ExerciseProgressMeters;
