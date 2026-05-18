"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Box, Container, Typography } from "@mui/material";
import AppSkeleton from "@/components/AppSkeleton";
import { SkillTree } from "@/components/Gamification/SkillTree";
import { SkillDetailPanel } from "@/components/Gamification/SkillDetailPanel";
import { useSkillTree, useXP } from "@/context/gamificationContext";
import { advanceSkill } from "../../actions/gamification";
import { getAmplifyClient } from "@/utils/amplifyClient";
import UnitContext from "@/context/unitContext";

interface InitialSkill {
  skillId: string;
  title: string;
  description?: string;
  xpReward?: number;
  prerequisites: string[];
  cohortId?: string;
}

/**
 * Interactive skill tree client component.
 * Accepts server-fetched initial skill definitions and hydrates with live data.
 */
export function SkillTreeClient({
  initialSkills,
}: {
  initialSkills: InitialSkill[];
}) {
  const t = useTranslations("components");
  const { skillNodes, isLoading, selectedSkillId, setSelectedSkillId } =
    useSkillTree();
  const { session } = React.useContext(UnitContext);
  const { totalXP } = useXP();
  const studentId = session?.username || "";

  // Use live data once loaded, initial data as fallback
  const displaySkills = skillNodes.length > 0 ? skillNodes : initialSkills;

  // Fetch units and grades for the detail panel
  const [unitsMap, setUnitsMap] = React.useState<Record<string, any>>({});
  const [gradesByUnit, setGradesByUnit] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    if (!studentId) return;
    const client = getAmplifyClient();

    const unitSub = client.models.Unit.observeQuery().subscribe({
      next: ({ items }: any) => {
        const map: Record<string, any> = {};
        (items || [])
          .filter((i: any) => i != null && i.id != null)
          .forEach((u: any) => {
            map[u.id] = u;
          });
        setUnitsMap(map);
      },
      error: (err: any) =>
        console.warn("[SkillsPage] Unit subscription error:", err),
    });

    const gradeSub = client.models.Grade.observeQuery().subscribe({
      next: ({ items }: any) => {
        const valid = (items || []).filter(
          (g: any) =>
            g != null && g.id != null && g.complete && g.owner === studentId,
        );
        const byUnit: Record<string, any> = {};
        valid.forEach((g: any) => {
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
      error: (err: any) =>
        console.warn("[SkillsPage] Grade subscription error:", err),
    });

    return () => {
      unitSub.unsubscribe();
      gradeSub.unsubscribe();
    };
  }, [studentId]);

  const selectedSkill = selectedSkillId
    ? (displaySkills as any[]).find((s: any) => s.skillId === selectedSkillId) || null
    : null;

  // Build unit progress for the selected skill's cohort
  const unitProgress = React.useMemo(() => {
    if (!selectedSkill?.cohortId) return [];
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

  const handleAdvance = async (skillId: string, newStatus: string) => {
    if (!studentId) return;
    return advanceSkill(studentId, skillId, newStatus);
  };

  return (
    <>
      <Container
        maxWidth={false}
        disableGutters
        sx={{ height: "calc(100vh - 48px)" }}
      >
        {isLoading && displaySkills.length === 0 ? (
          <AppSkeleton variant="page" />
        ) : displaySkills.length === 0 ? (
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
                "skillTree.empty",
                "No skills available yet. Your instructor will set up the learning pathway.",
              )}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", height: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <SkillTree
                skills={displaySkills}
                onSkillClick={(skillId: string) => setSelectedSkillId(skillId)}
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
                  allSkills={displaySkills}
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
