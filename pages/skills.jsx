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
import { useSkillTree, useXP } from "../src/context/gamificationContext";
import { GamificationProviderWrapper } from "../src/context/gamificationProviderWrapper";
import { advanceSkillProgress } from "../src/utils/gamificationActions";
import { getAmplifyClient } from "../src/utils/amplifyClient";
import UnitContext from "../src/context/unitContext";

function SkillsPage() {
  const { t } = useTranslation("pages");
  const { skillNodes, isLoading, selectedSkillId, setSelectedSkillId } =
    useSkillTree();
  const { session } = React.useContext(UnitContext);
  const { totalXP } = useXP();
  const studentId = session?.username || "";

  // Fetch units and grades for the detail panel
  const [unitsMap, setUnitsMap] = React.useState({});
  const [gradesByUnit, setGradesByUnit] = React.useState({});

  React.useEffect(() => {
    if (!studentId) return;
    const client = getAmplifyClient();

    const unitSub = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        const map = {};
        (items || [])
          .filter((i) => i != null && i.id != null)
          .forEach((u) => {
            map[u.id] = u;
          });
        setUnitsMap(map);
      },
      error: (err) =>
        console.warn("[SkillsPage] Unit subscription error:", err),
    });

    const gradeSub = client.models.Grade.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = (items || []).filter(
          (g) =>
            g != null && g.id != null && g.complete && g.owner === studentId,
        );
        const byUnit = {};
        valid.forEach((g) => {
          if (!byUnit[g.unitID]) {
            byUnit[g.unitID] = { highest: 0, count: 0, totalAccuracy: 0 };
          }
          const entry = byUnit[g.unitID];
          entry.count++;
          entry.totalAccuracy += g.accuracy || 0;
          if ((g.accuracy || 0) > entry.highest) entry.highest = g.accuracy;
        });
        setGradesByUnit(byUnit);
      },
      error: (err) =>
        console.warn("[SkillsPage] Grade subscription error:", err),
    });

    return () => {
      unitSub.unsubscribe();
      gradeSub.unsubscribe();
    };
  }, [studentId]);

  const selectedSkill = selectedSkillId
    ? skillNodes.find((s) => s.skillId === selectedSkillId) || null
    : null;

  // Build unit progress for the selected skill's cohort
  const unitProgress = React.useMemo(() => {
    if (!selectedSkill?.cohortId) return [];
    // cohortId is typically `unit-{unitID}`
    const unitId = selectedSkill.cohortId.startsWith("unit-")
      ? selectedSkill.cohortId.slice(5)
      : selectedSkill.cohortId;
    const unit = unitsMap[unitId];
    if (!unit) return [];
    const grades = gradesByUnit[unitId] || {
      highest: 0,
      count: 0,
      totalAccuracy: 0,
    };
    const completionPercent =
      grades.count > 0
        ? Math.min(Math.round(grades.totalAccuracy / grades.count), 100)
        : 0;
    return [
      {
        unitId,
        unitName: unit.name || "Untitled Unit",
        completionPercent,
        highestGrade: grades.highest || 0,
        xpEarned:
          selectedSkill.status === "MASTERED" ? selectedSkill.xpReward || 0 : 0,
        href: `/workbook/${unitId}`,
      },
    ];
  }, [selectedSkill, unitsMap, gradesByUnit]);

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
                selectedSkillId={selectedSkillId}
                height="100%"
              />
            </Box>
            <Box
              sx={{
                width: selectedSkill ? 360 : 0,
                minWidth: selectedSkill ? 360 : 0,
                p: selectedSkill ? 2 : 0,
                borderLeft: selectedSkill ? "1px solid" : "none",
                borderColor: "divider",
                overflow: "auto",
                transition: "width 0.3s, min-width 0.3s, padding 0.3s",
              }}
            >
              {selectedSkill && (
                <SkillDetailPanel
                  skill={selectedSkill}
                  onAdvance={handleAdvance}
                  onClose={() => setSelectedSkillId(null)}
                  unitProgress={unitProgress}
                  allSkills={skillNodes}
                  totalXP={totalXP}
                />
              )}
            </Box>
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
