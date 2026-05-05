import React from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../next-i18next.config";

import { AppBar, Box, Container, Typography } from "@mui/material";

import MainToolbar from "../src/components/MainToolbar";
import MyAuth from "../src/components/AmplifyAuthenticator";
import AppSkeleton from "../src/components/AppSkeleton";
import { SkillTree } from "../src/components/Gamification/SkillTree";
import { SkillDetailPanel } from "../src/components/Gamification/SkillDetailPanel";
import { useSkillTree } from "../src/context/gamificationContext";
import { GamificationProviderWrapper } from "../src/context/gamificationProviderWrapper";
import { advanceSkillProgress } from "../src/utils/gamificationActions";
import UnitContext from "../src/context/unitContext";

function SkillsPage() {
  const { t } = useTranslation("pages");
  const { skillNodes, isLoading, selectedSkillId, setSelectedSkillId } =
    useSkillTree();
  const { session } = React.useContext(UnitContext);
  const studentId = session?.username || "";

  const selectedSkill = selectedSkillId
    ? skillNodes.find((s) => s.skillId === selectedSkillId) || null
    : null;

  const handleAdvance = async (skillId, newStatus) => {
    if (!studentId) return;
    return advanceSkillProgress(studentId, skillId, newStatus);
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          backgroundColor: "custom.glassNavbar",
          backdropFilter: "blur(8px)",
        }}
      >
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: "1rem" }}>
            <Typography variant="h6" component="div">
              {t("skills.title", "Learning Pathway")}
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>

      <Container
        maxWidth={false}
        disableGutters
        sx={{ mt: "64px", height: "calc(100vh - 64px)" }}
      >
        {isLoading ? (
          <AppSkeleton variant="page" />
        ) : skillNodes.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {t(
                "skills.empty",
                "No skills available yet. Your instructor will set up the learning pathway.",
              )}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", height: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <SkillTree
                skills={skillNodes}
                onSkillClick={(skillId) => setSelectedSkillId(skillId)}
                height="100%"
              />
            </Box>
            {selectedSkill && (
              <Box
                sx={{
                  width: 340,
                  p: 2,
                  borderLeft: "1px solid",
                  borderColor: "divider",
                  overflow: "auto",
                }}
              >
                <SkillDetailPanel
                  skill={selectedSkill}
                  onAdvance={handleAdvance}
                  onClose={() => setSelectedSkillId(null)}
                />
              </Box>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}

function WrappedPage() {
  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <SkillsPage />
      </GamificationProviderWrapper>
    </MyAuth>
  );
}

export default WrappedPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "pages"],
        nextI18nextConfig,
      )),
    },
  };
}
