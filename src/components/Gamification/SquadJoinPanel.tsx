/**
 * SquadJoinPanel — UI for browsing available squads, joining one,
 * or viewing current squad membership. Shows squad crest, member count,
 * and join/leave actions.
 *
 * @module SquadJoinPanel
 */

import React, { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GroupIcon from "@mui/icons-material/Group";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from "next-intl";
import { SquadCrest } from "./SquadCrest";
import { AvatarDisplay } from "./AvatarDisplay";
import { EmptyState } from "../EmptyState";
import type { AvatarStyleTier, AvatarOverrides } from "./DiceBearAvatar";
import { ArmoriaShield } from "./ArmoriaShield";
import { PixelSpriteMascot } from "./PixelSpriteMascot";
import { NarrativeReader } from "../Editor3/NarrativeReader";

// ============================================================================
// Types
// ============================================================================

export interface SquadListEntry {
  id: string;
  name: string;
  totalXP: number;
  memberCount: number;
  description?: string;
  crestSvg?: string | null;
}

export interface SquadMemberEntry {
  id: string;
  studentId: string;
  role: "LEADER" | "MEMBER";
  joinedAt?: string;
  displayName?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyleTier;
  avatarOverrides?: AvatarOverrides;
}

export interface SquadJoinPanelProps {
  /** Available squads to join */
  availableSquads: SquadListEntry[];
  /** The student's current squad (null if not in one) */
  mySquad?: SquadListEntry | null;
  /** Members of the student's current squad */
  mySquadMembers?: SquadMemberEntry[];
  /** Current student's ID (to identify leader status) */
  studentId: string;
  /** Called when student joins a squad */
  onJoinSquad: (squadId: string) => void;
  /** Called when student leaves their squad */
  onLeaveSquad: () => void;
  /** Whether operations are loading */
  isLoading?: boolean;
  /** Current student level (for PixelSprite stage) */
  level?: number;
}

// ============================================================================
// Component
// ============================================================================

export function SquadJoinPanel({
  availableSquads,
  mySquad = null,
  mySquadMembers = [],
  studentId,
  onJoinSquad,
  onLeaveSquad,
  isLoading = false,
  level = 1,
}: SquadJoinPanelProps) {
  const t = useTranslations("components");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<SquadListEntry | null>(
    null,
  );

  const handleJoin = useCallback((squad: SquadListEntry) => {
    setSelectedSquad(squad);
  }, []);

  const handleConfirmJoin = useCallback(() => {
    if (selectedSquad) {
      onJoinSquad(selectedSquad.id);
      setSelectedSquad(null);
    }
  }, [selectedSquad, onJoinSquad]);

  const handleLeave = useCallback(() => {
    onLeaveSquad();
    setConfirmLeave(false);
  }, [onLeaveSquad]);

  const isLeader =
    mySquadMembers.find((m) => m.studentId === studentId)?.role === "LEADER";

  // ── Current squad view ──────────────────────────────────────────────────
  if (mySquad) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <ArmoriaShield
              squadId={mySquad.id}
              squadName={mySquad.name}
              crestSvg={mySquad.crestSvg}
              size={72}
              showName={false}
            />
            <Box>
              <Typography variant="h6">{mySquad.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<GroupIcon />}
                  label={t("squadJoinPanel.memberCount", {
                    count: mySquad.memberCount,
                  })}
                  size="small"
                />
                <Chip
                  label={t("squadJoinPanel.totalXp", { xp: mySquad.totalXP })}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {isLeader && (
                  <Chip
                    icon={<StarIcon />}
                    label={t("squadJoinPanel.leader")}
                    size="small"
                    color="warning"
                  />
                )}
              </Stack>
              {mySquad.description &&
                (mySquad.description.trim().startsWith("{") ? (
                  <NarrativeReader
                    contentJson={mySquad.description}
                    ariaLabel={t("squadJoinPanel.squadDescriptionLabel")}
                    padding="0.25rem 0"
                  />
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {mySquad.description}
                  </Typography>
                ))}
            </Box>
          </Stack>

          {/* Squad mascot */}
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <PixelSpriteMascot
              seed={mySquad.id}
              stage={Math.min(5, Math.ceil(level / 2))}
              size={48}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Members list */}
          <Typography variant="subtitle2" gutterBottom>
            {t("squadJoinPanel.members")}
          </Typography>
          <List dense>
            {mySquadMembers.map((member) => (
              <ListItem key={member.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <AvatarDisplay
                    profileUsername={member.studentId}
                    label={member.displayName}
                    seed={member.studentId}
                    size={32}
                    style={member.avatarStyle}
                    overrides={member.avatarOverrides}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={member.displayName || member.studentId}
                  secondary={
                    member.role === "LEADER"
                      ? t("squadJoinPanel.leaderRole")
                      : t("squadJoinPanel.memberRole")
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
        <CardActions>
          <Button
            startIcon={<ExitToAppIcon />}
            color="error"
            size="small"
            onClick={() => setConfirmLeave(true)}
            disabled={isLoading}
          >
            {t("squadJoinPanel.leaveSquad")}
          </Button>
        </CardActions>

        {/* Leave confirmation */}
        <Dialog open={confirmLeave} onClose={() => setConfirmLeave(false)}>
          <DialogTitle>
            {t("squadJoinPanel.leaveTitle", { name: mySquad.name })}
          </DialogTitle>
          <DialogContent>
            <Typography>{t("squadJoinPanel.leaveConfirm")}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmLeave(false)}>
              {t("squadJoinPanel.cancel")}
            </Button>
            <Button onClick={handleLeave} color="error" variant="contained">
              {t("squadJoinPanel.leave")}
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    );
  }

  // ── Squad browser (not in a squad) ─────────────────────────────────────
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("squadJoinPanel.joinTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("squadJoinPanel.joinDescription")}
      </Typography>

      {/* Create Squad section */}

      {availableSquads.length === 0 ? (
        <EmptyState
          dense
          title={t("squadJoinPanel.emptyTitle")}
          description={t("squadJoinPanel.emptyDescription")}
          ctaLabel={t("squadJoinPanel.emptyCta")}
          ctaHref="/squads"
        />
      ) : (
        <Stack spacing={1.5}>
          {availableSquads.map((squad) => (
            <Card key={squad.id} variant="outlined">
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 1.5,
                  "&:last-child": { pb: 1.5 },
                }}
              >
                <SquadCrest
                  squadId={squad.id}
                  squadName={squad.name}
                  size="small"
                  showName={false}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{squad.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {t("squadJoinPanel.memberCount", {
                        count: squad.memberCount,
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("squadJoinPanel.totalXp", { xp: squad.totalXP })}
                    </Typography>
                  </Stack>
                  {squad.description &&
                    (squad.description.trim().startsWith("{") ? (
                      <NarrativeReader
                        contentJson={squad.description}
                        ariaLabel={t("squadJoinPanel.namedDescriptionLabel", {
                          name: squad.name,
                        })}
                        padding="0.25rem 0"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {squad.description}
                      </Typography>
                    ))}
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleJoin(squad)}
                  disabled={isLoading}
                >
                  {t("squadJoinPanel.join")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Join confirmation dialog */}
      <Dialog open={!!selectedSquad} onClose={() => setSelectedSquad(null)}>
        <DialogTitle>
          {t("squadJoinPanel.joinDialogTitle", {
            name: selectedSquad?.name ?? "",
          })}
        </DialogTitle>
        <DialogContent>
          <Stack alignItems="center" spacing={2} sx={{ pt: 1 }}>
            {selectedSquad && (
              <SquadCrest
                squadId={selectedSquad.id}
                squadName={selectedSquad.name}
                size="large"
              />
            )}
            <Typography>{t("squadJoinPanel.joinConfirm")}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSquad(null)}>
            {t("squadJoinPanel.cancel")}
          </Button>
          <Button
            onClick={handleConfirmJoin}
            variant="contained"
            disabled={isLoading}
          >
            {t("squadJoinPanel.joinSquad")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SquadJoinPanel;
