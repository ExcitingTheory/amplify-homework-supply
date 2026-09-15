import React, {
  useState,
  Suspense,
  lazy,
  useContext,
  useMemo,
  useEffect,
} from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Skeleton,
  Box,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { useSkillTree } from "@/context/gamificationContext";
import AuthContext from "@/context/authContext";
import SectionContext from "@/context/sectionContext";
import { SkillTreeEditor } from "@/components/SkillTreeEditor";
import { getAmplifyClient } from "@/utils/amplifyClient";

// Lazy-load SkillTree component only when the dialog opens (avoids loading @xyflow/react on every page)
const SkillTree = lazy(() =>
  import("@/components/Gamification/SkillTree").then((m) => ({
    default: m.SkillTree,
  })),
);

export function SkillTreePopupButton({
  sectionId,
  label,
  isInstructor: isInstructorProp = undefined,
  size = "medium",
  sx = undefined,
}) {
  const [open, setOpen] = useState(false);
  const buttonLabel = "Skills";
  const dialogTitle = label ? `Skill Tree — ${label}` : "Skill Tree";
  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        size={size}
        startIcon={<AccountTreeIcon />}
        onClick={() => setOpen(true)}
        disabled={!sectionId}
        sx={sx}
      >
        {buttonLabel}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {dialogTitle}
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {sectionId ? (
            <GamificationProviderWrapper sectionID={sectionId}>
              <SkillTreeModalContent
                sectionId={sectionId}
                isInstructorProp={isInstructorProp}
              />
            </GamificationProviderWrapper>
          ) : (
            <div>No section selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SkillTreeModalContent({ sectionId, isInstructorProp }) {
  const { skillNodes, isLoading } = useSkillTree();
  const { session } = useContext(AuthContext) || {};
  const { assignments = [] } = useContext(SectionContext) || {};
  const [showEditor, setShowEditor] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const isInstructor =
    isInstructorProp ??
    Boolean(
      session?.groups?.includes("Instructors") ||
      session?.groups?.includes("Admins"),
    );

  // Fetch or derive available units for this section
  useEffect(() => {
    if (!isInstructor) return;
    let isMounted = true;
    const client = getAmplifyClient();

    // First attempt to extract from assignments in SectionContext
    const sectionAssignments = assignments.filter(
      (a) => a?.sectionID === sectionId && a?.unit,
    );
    if (sectionAssignments.length > 0) {
      const units = sectionAssignments.map((a) => ({
        id: a.unit.id || a.unitID,
        name: a.unit.name || "Untitled Unit",
      }));
      setAvailableUnits(units);
      return;
    }

    // Fallback: list all units from Data Client
    if (client?.models?.Unit?.list) {
      client.models.Unit.list()
        .then(({ data: units }) => {
          if (!isMounted) return;
          if (units && units.length > 0) {
            setAvailableUnits(
              units
                .filter((u) => u != null && u.id)
                .map((u) => ({
                  id: u.id,
                  name: u.name || "Untitled Unit",
                })),
            );
          }
        })
        .catch((err) => {
          console.warn("[SkillTreePopupButton] Failed to fetch units:", err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [assignments, isInstructor, sectionId]);

  const availableSkills = useMemo(() => {
    return (skillNodes || []).map((node) => ({
      id: node.skillId,
      title: node.title,
    }));
  }, [skillNodes]);

  const handleCreateSkill = async (data) => {
    setSubmitting(true);
    setCreateError(null);
    try {
      const client = getAmplifyClient();
      if (!client?.models?.Skill?.create) {
        throw new Error("Amplify Data Client is not available");
      }
      await client.models.Skill.create({
        title: data.title,
        description: data.description || "",
        xpReward: data.xpReward || 0,
        sectionID: sectionId,
        unitIds: data.unitIds,
        minimumAccuracy: data.minimumAccuracy,
        prerequisites: data.prerequisites?.length
          ? JSON.stringify(data.prerequisites)
          : null,
      });
      setShowEditor(false);
    } catch (err) {
      console.error("[SkillTreePopupButton] Failed to create skill:", err);
      setCreateError(
        err?.message || "Failed to create skill. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={450} />
      </Box>
    );

  // Instructor view: Toggle between editor and tree or embed editor on empty state
  if (!skillNodes?.length) {
    if (isInstructor) {
      return (
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Alert severity="info">
              No skills have been created for this section yet. Create your
              first skill below to build the section's skill tree!
            </Alert>
            {createError && (
              <Alert severity="error" onClose={() => setCreateError(null)}>
                {createError}
              </Alert>
            )}
            <SkillTreeEditor
              availableUnits={availableUnits}
              availableSkills={[]}
              onSubmit={handleCreateSkill}
              submitting={submitting}
            />
          </Stack>
        </Box>
      );
    }
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        No skills available for this section.
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isInstructor && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            variant={showEditor ? "outlined" : "contained"}
            startIcon={showEditor ? <AccountTreeIcon /> : <AddIcon />}
            onClick={() => setShowEditor((prev) => !prev)}
          >
            {showEditor ? "View Skill Tree" : "Add Skill"}
          </Button>
        </Box>
      )}

      {showEditor && isInstructor ? (
        <Box sx={{ p: 1 }}>
          {createError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setCreateError(null)}
            >
              {createError}
            </Alert>
          )}
          <SkillTreeEditor
            availableUnits={availableUnits}
            availableSkills={availableSkills}
            onSubmit={handleCreateSkill}
            submitting={submitting}
          />
        </Box>
      ) : (
        <Suspense
          fallback={
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={450} />
            </Box>
          }
        >
          <SkillTree skills={skillNodes} height={450} />
        </Suspense>
      )}
    </Box>
  );
}
