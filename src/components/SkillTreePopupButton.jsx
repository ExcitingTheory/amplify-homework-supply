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

export function SkillTreePopupButton({ sectionId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
        disabled={!sectionId}
      >
        View Skill Tree
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
          Skill Tree
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
