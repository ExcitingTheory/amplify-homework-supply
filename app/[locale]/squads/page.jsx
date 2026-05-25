"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import AppBar from "@mui/material/AppBar";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AppSkeleton from "@/components/AppSkeleton";
import { createFilterOptions } from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import MainToolbar from "@/components/MainToolbar";
import MyAuth from "@/components/AmplifyAuthenticator";
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

const sectionFilterOptions = createFilterOptions({
  stringify: (option) => `${option.name || ""} ${option.description || ""}`,
});

function SquadsPage() {
  const t = useTranslations("pages");
  const router = useRouter();
  const { mySquad, squadLeaderboard, isLoading } = useSquad();
  const { session } = React.useContext(AuthContext);
  const { sections } = React.useContext(SectionContext);
  const [creating, setCreating] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState(null);
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
    }
  }, [router, selectedSection]);

  if (isLoading) {
    return <AppSkeleton variant="cards" />;
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
        <Typography variant="h4" gutterBottom>
          {t("squads.heading", "All Squads")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t(
            "squads.description",
            "Join a squad to compete with your team and climb the leaderboard together.",
          )}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <Autocomplete
            options={mySections}
            value={selectedSection}
            onChange={(_, value) => setSelectedSection(value)}
            filterOptions={sectionFilterOptions}
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
              />
            )}
            sx={{ minWidth: 280 }}
            noOptionsText={t("squads.noSections", "No sections found")}
          />
          {!mySquad && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateSquad}
              disabled={creating || !selectedSection}
              sx={{ whiteSpace: "nowrap" }}
            >
              {creating
                ? "Creating…"
                : t("squads.createSquad", "Start a New Squad")}
            </Button>
          )}
        </Box>

        <SquadLeaderboard squads={squadLeaderboard} mySquadId={mySquad?.id} />
      </Box>
    </>
  );
}

export default function WrappedPage() {
  return (
    <MyAuth>
      <SectionProvider>
        <GamificationProviderWrapper>
          <SquadsPage />
        </GamificationProviderWrapper>
        <CollaborativeChatWrapper roomType="squad" />
      </SectionProvider>
    </MyAuth>
  );
}
