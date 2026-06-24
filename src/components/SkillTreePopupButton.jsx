import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { SkillTree } from "@/components/Gamification/SkillTree";
import { useSkillTree } from "@/context/gamificationContext";

export function SkillTreePopupButton({ sectionId, label }) {
  const [open, setOpen] = useState(false);
  const buttonLabel = label ? `${label} Skill Tree` : "View Skill Tree";
  const dialogTitle = label ? `Skill Tree — ${label}` : "Skill Tree";
  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setOpen(true)}
        disabled={!sectionId}
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
            <GamificationProviderWrapper cohortId={sectionId}>
              <SkillTreeModalContent />
            </GamificationProviderWrapper>
          ) : (
            <div>No section selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SkillTreeModalContent() {
  const { skillNodes, isLoading } = useSkillTree();
  if (isLoading) return <div>Loading...</div>;
  if (!skillNodes?.length)
    return <div>No skills available for this section.</div>;
  return <SkillTree skills={skillNodes} height={450} />;
}
