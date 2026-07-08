"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import SortIcon from "@mui/icons-material/Sort";
import MainToolbar from "@/components/MainToolbar";
import { SquadLeaderboard } from "@/components/Gamification/SquadLeaderboard";
import { useSquad } from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import AuthContext from "@/context/authContext";
import SectionContext from "@/context/sectionContext";
import { SectionProvider } from "@/context/sectionContext";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { getCurrentUser } from "aws-amplify/auth";
import { useScrolledAppBar } from "@/hooks/useScrolledAppBar";
import { useRouter } from "next/navigation";

function SquadsPage() {
  const t = useTranslations("pages");
  const router = useRouter();
  const { mySquad, squadLeaderboard, isLoading } = useSquad();
  const { session } = React.useContext(AuthContext);
  const { sections } = React.useContext(SectionContext);

  // Create squad dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState(null);

  // Table filter/sort state
  const [nameFilter, setNameFilter] = React.useState([]);
  const [sortBy, setSortBy] = React.useState("xp");
  const [groupBy, setGroupBy] = React.useState("none");

  const isScrolled = useScrolledAppBar();

  // Only show sections the user belongs to (via Cognito group membership)
  const mySections = React.useMemo(() => {
    const groups = session?.groups || [];
    const mySectionIds = new Set();
    for (const group of groups) {
      const match = group.match(/^section-(.+?)-(learners|instructors)$/);
      if (match) mySectionIds.add(match[1]);
    }
    if (mySectionIds.size === 0) return sections;
    return sections.filter((s) => mySectionIds.has(s.id));
  }, [sections, session?.groups]);

  // Build a section name lookup map
  const sectionNameMap = React.useMemo(() => {
    const map = new Map();
    for (const s of sections) {
      map.set(s.id, s.name || s.id);
    }
    return map;
  }, [sections]);

  // Enrich squad leaderboard entries with sectionName
  const enrichedSquads = React.useMemo(() => {
    return squadLeaderboard.map((squad) => ({
      ...squad,
      sectionName: sectionNameMap.get(squad.cohortId) || squad.cohortId || "",
    }));
  }, [squadLeaderboard, sectionNameMap]);

  // Get unique squad names for the filter dropdown
  const allSquadNames = React.useMemo(() => {
    return [...new Set(enrichedSquads.map((s) => s.name))].sort();
  }, [enrichedSquads]);

  // Default section for create dialog when user has only one
  React.useEffect(() => {
    if (mySections.length === 1 && !selectedSection) {
      setSelectedSection(mySections[0]);
    }
  }, [mySections, selectedSection]);

  const handleCreateSquad = React.useCallback(async () => {
    if (!selectedSection?.id) return;
    setCreating(true);
    try {
      const client = getAmplifyClient();
      const user = await getCurrentUser();
      const studentId = user?.username || user?.userId || "";

      const { data: squad } = await client.models.Squad.create({
        name: "New Squad",
        cohortId: selectedSection.id,
        totalXP: 0,
        members: [
          { studentId, role: "LEADER", joinedAt: new Date().toISOString() },
        ],
      });

      if (squad?.id) {
        router.push(`/squad/${squad.id}`);
      }
    } catch (err) {
      console.error("[SquadsPage] Failed to create squad:", err);
      setCreating(false);
    } finally {
      setCreateDialogOpen(false);
      setCreating(false);
    }
  }, [router, selectedSection]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          padding: "1rem",
          maxWidth: "48rem",
          margin: "0 auto 3rem",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h4">
            {t("squads.heading", "All Squads")}
          </Typography>
          {!mySquad && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ whiteSpace: "nowrap" }}
            >
              {t("squads.createSquad", "Start a New Squad")}
            </Button>
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            "squads.description",
            "Join a squad to compete with your team and climb the leaderboard together.",
          )}
        </Typography>

        {/* Table filters toolbar */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          {/* Multi-select name filter */}
          <Autocomplete
            multiple
            options={allSquadNames}
            value={nameFilter}
            onChange={(_, value) => setNameFilter(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("squads.filterByName", "Filter by name")}
                size="small"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                />
              ))
            }
            sx={{ minWidth: 240, flex: 1 }}
            size="small"
          />

          {/* Sort control */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t("squads.sortBy", "Sort by")}</InputLabel>
            <Select
              value={sortBy}
              label={t("squads.sortBy", "Sort by")}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="xp">XP</MenuItem>
              <MenuItem value="name">
                {t("squads.squadName", "Squad Name")}
              </MenuItem>
              <MenuItem value="section">
                {t("squads.sectionName", "Section")}
              </MenuItem>
            </Select>
          </FormControl>

          {/* Group by toggle */}
          <ToggleButtonGroup
            value={groupBy}
            exclusive
            onChange={(_, val) => val && setGroupBy(val)}
            size="small"
          >
            <ToggleButton value="none">
              {t("squads.flat", "Flat")}
            </ToggleButton>
            <ToggleButton value="section">
              {t("squads.groupBySection", "By Section")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <SquadLeaderboard
          squads={enrichedSquads}
          mySquadId={mySquad?.id}
          nameFilter={nameFilter}
          sortBy={sortBy}
          groupBy={groupBy}
        />
      </Box>

      {/* Create Squad Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("squads.createSquad", "Start a New Squad")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              "squads.createDescription",
              "Select which section this squad belongs to.",
            )}
          </Typography>
          <Autocomplete
            options={mySections}
            value={selectedSection}
            onChange={(_, value) => setSelectedSection(value)}
            getOptionLabel={(option) => option.name || ""}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  {option.description && (
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("squads.selectSection", "Select a Section")}
                size="small"
                autoFocus
              />
            )}
            noOptionsText={t("squads.noSections", "No sections found")}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSquad}
            disabled={creating || !selectedSection}
          >
            {creating ? "Creating…" : t("squads.create", "Create")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function WrappedPage() {
  return (
    <SectionProvider>
      <GamificationProviderWrapper>
        <SquadsPage />
      </GamificationProviderWrapper>
      <CollaborativeChatWrapper roomType="squad" />
    </SectionProvider>
  );
}
