import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Avatar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { SkillTree } from "./Gamification/SkillTree";
import { useSkillTree } from "../context/gamificationContext";
import { listSectionStudents } from "../../app/actions/section";
import { formatLastFirst, getInitials } from "../utils/formatUserName";

/**
 * InstructorDashboard displays aggregate performance metrics across all sections
 * and leaderboards for each section showing top-performing students.
 *
 * Features:
 * - Overall statistics (total students, average completion, average grade)
 * - Per-section leaderboards with student rankings
 * - Visual progress indicators
 * - Expandable section details
 */
export default function InstructorDashboard({ sections = [] }) {
  const t = useTranslations("components");
  const client = getAmplifyClient();

  const [sectionStats, setSectionStats] = useState({});
  const [allGrades, setAllGrades] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [sectionStudents, setSectionStudents] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const { skillNodes } = useSkillTree();

  // Fetch all grades for instructor's sections
  useEffect(() => {
    if (sections.length === 0) {
      setLoading(false);
      return;
    }

    const subscription = client.models.Grade.observeQuery({
      filter: {
        complete: { eq: true },
      },
    }).subscribe({
      next: ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );

        // Filter out grades without accuracy scores (client-side filtering)
        const validGrades = validItems.filter(
          (grade) => grade.accuracy != null,
        );
        setAllGrades(validGrades);
      },
      error: (err) => {
        console.error("Grades subscription error:", err);
        // Stop retrying on auth errors to prevent rate limiting
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("NoSignedUser") ||
          err?.message?.includes("401") ||
          err?.message?.includes("403")
        ) {
          console.warn(
            "[InstructorDashboard] Auth error, stopping Grades subscription retries",
          );
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch all assignments for instructor's sections
  useEffect(() => {
    if (sections.length === 0) return;

    // Filter out null sections before mapping to IDs
    const validSections = sections.filter((s) => s != null && s.id != null);
    if (validSections.length === 0) return;

    const sectionIDs = validSections.map((s) => s.id);

    const subscription = client.models.Assignment.observeQuery({
      filter: {
        or: sectionIDs.map((id) => ({ sectionID: { eq: id } })),
      },
    }).subscribe({
      next: ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );
        setAllAssignments(validItems);
      },
      error: (err) => {
        console.error("Assignments subscription error:", err);
        // Stop retrying on auth errors to prevent rate limiting
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("NoSignedUser") ||
          err?.message?.includes("401") ||
          err?.message?.includes("403")
        ) {
          console.warn(
            "[InstructorDashboard] Auth error, stopping Assignments subscription retries",
          );
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch student name data for each section
  useEffect(() => {
    if (sections.length === 0) return;
    const validSections = sections.filter(
      (s) => s != null && s.id != null && s.code,
    );
    if (validSections.length === 0) return;

    async function fetchStudentNames() {
      const nameMap = {};
      for (const section of validSections) {
        const result = await listSectionStudents(section.code);
        if (result.success && result.students) {
          result.students.forEach((student) => {
            nameMap[student.id] = student;
          });
        }
      }
      setSectionStudents(nameMap);
    }
    fetchStudentNames();
  }, [sections]);

  // Calculate statistics for each section
  useEffect(() => {
    if (sections.length === 0 || allGrades.length === 0) {
      setLoading(false);
      return;
    }

    const calculateSectionStats = async () => {
      const stats = {};

      // Filter out null sections before iterating
      const validSections = sections.filter((s) => s != null && s.id != null);

      for (const section of validSections) {
        const sectionAssignments = allAssignments.filter(
          (a) => a.sectionID === section.id,
        );

        // Get unique students who have submitted work in this section
        const studentGradesMap = {};

        allGrades.forEach((grade) => {
          const assignment = sectionAssignments.find(
            (a) => a.id === grade.assignmentID,
          );
          if (!assignment) return;

          if (!studentGradesMap[grade.owner]) {
            studentGradesMap[grade.owner] = {
              totalGrade: 0,
              count: 0,
              completedAssignments: new Set(),
              allGrades: [],
            };
          }

          studentGradesMap[grade.owner].allGrades.push(grade);
          studentGradesMap[grade.owner].completedAssignments.add(
            assignment.unitID,
          );
        });

        // Calculate student averages and rankings
        const studentRankings = Object.entries(studentGradesMap).map(
          ([studentId, data]) => {
            // Group grades by assignment (unitID) and take highest
            const gradesByAssignment = {};
            data.allGrades.forEach((grade) => {
              const assignment = sectionAssignments.find(
                (a) => a.id === grade.assignmentID,
              );
              if (!assignment) return;

              if (
                !gradesByAssignment[assignment.unitID] ||
                grade.accuracy > gradesByAssignment[assignment.unitID].accuracy
              ) {
                gradesByAssignment[assignment.unitID] = grade;
              }
            });

            const grades = Object.values(gradesByAssignment).map(
              (g) => g.accuracy,
            );
            const average =
              grades.length > 0
                ? grades.reduce((sum, g) => sum + g, 0) / grades.length
                : 0;

            const completion =
              sectionAssignments.length > 0
                ? (data.completedAssignments.size / sectionAssignments.length) *
                  100
                : 0;

            return {
              studentId,
              average,
              completion,
              assignmentsCompleted: data.completedAssignments.size,
              totalAssignments: sectionAssignments.length,
            };
          },
        );

        // Sort by average grade descending
        studentRankings.sort((a, b) => b.average - a.average);

        stats[section.id] = {
          studentCount: studentRankings.length,
          averageGrade:
            studentRankings.length > 0
              ? Math.round(
                  studentRankings.reduce((sum, s) => sum + s.average, 0) /
                    studentRankings.length,
                )
              : 0,
          averageCompletion:
            studentRankings.length > 0
              ? Math.round(
                  studentRankings.reduce((sum, s) => sum + s.completion, 0) /
                    studentRankings.length,
                )
              : 0,
          leaderboard: studentRankings.slice(0, 10), // Top 10
          assignmentCount: sectionAssignments.length,
        };
      }

      setSectionStats(stats);
      setLoading(false);
    };

    calculateSectionStats();
  }, [sections, allGrades, allAssignments]);

  // Calculate aggregate stats
  const aggregateStats = React.useMemo(() => {
    const totalStudents = Object.values(sectionStats).reduce(
      (sum, s) => sum + s.studentCount,
      0,
    );
    const avgGrade =
      Object.values(sectionStats).length > 0
        ? Math.round(
            Object.values(sectionStats).reduce(
              (sum, s) => sum + s.averageGrade,
              0,
            ) / Object.values(sectionStats).length,
          )
        : 0;
    const avgCompletion =
      Object.values(sectionStats).length > 0
        ? Math.round(
            Object.values(sectionStats).reduce(
              (sum, s) => sum + s.averageCompletion,
              0,
            ) / Object.values(sectionStats).length,
          )
        : 0;
    const totalAssignments = Object.values(sectionStats).reduce(
      (sum, s) => sum + s.assignmentCount,
      0,
    );

    return { totalStudents, avgGrade, avgCompletion, totalAssignments };
  }, [sectionStats]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4, margin: "1rem auto", width: "90vw", maxWidth: "80rem" }}>
      {/* Aggregate Statistics */}
      <Card elevation={3} sx={{ mb: 3, borderRadius: 2, width: "100%" }}>
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", mb: 3 }}
          >
            <TrendingUpIcon sx={{ mr: 1 }} />
            {t("instructorDashboard.overallPerformance")}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <PeopleIcon
                  sx={{ fontSize: 40, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {aggregateStats.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("instructorDashboard.totalStudents")}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <AssignmentIcon
                  sx={{ fontSize: 40, color: "secondary.main", mb: 1 }}
                />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {aggregateStats.totalAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("instructorDashboard.totalAssignments")}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: "success.main" }}
                >
                  {aggregateStats.avgGrade}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("instructorDashboard.averageGrade")}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={aggregateStats.avgGrade}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color="success"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: "info.main" }}
                >
                  {aggregateStats.avgCompletion}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("instructorDashboard.averageCompletion")}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={aggregateStats.avgCompletion}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color="info"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Skill Tree Overview */}
      {skillNodes?.length > 0 && (
        <Card elevation={3} sx={{ mb: 3, borderRadius: 2, width: "100%" }}>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              {t("instructorDashboard.skillTree", "Skill Tree")}
            </Typography>
            <SkillTree skills={skillNodes} height={300} compact />
          </CardContent>
        </Card>
      )}

      {/* Section Leaderboards */}
      <Card elevation={3} sx={{ borderRadius: 2, width: "100%" }}>
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", mb: 2 }}
          >
            <EmojiEventsIcon sx={{ mr: 1 }} />
            {t("instructorDashboard.sectionLeaderboards")}
          </Typography>

          {loading ? (
            <LinearProgress />
          ) : (
            <Box>
              {sections
                .filter((s) => s != null && s.id != null)
                .map((section, index) => {
                  const stats = sectionStats[section.id] || {
                    studentCount: 0,
                    averageGrade: 0,
                    averageCompletion: 0,
                    leaderboard: [],
                    assignmentCount: 0,
                  };

                  return (
                    <Accordion key={section.id} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            gap: 2,
                          }}
                        >
                          <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {section.name}
                          </Typography>
                          <Chip
                            label={`${stats.studentCount} ${t("instructorDashboard.students")}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${stats.averageGrade}% ${t("instructorDashboard.avg")}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {stats.leaderboard.length === 0 ? (
                          <Typography
                            color="text.secondary"
                            sx={{ textAlign: "center", py: 3 }}
                          >
                            {t("instructorDashboard.noDataYet")}
                          </Typography>
                        ) : (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>
                                    {t("instructorDashboard.rank")}
                                  </TableCell>
                                  <TableCell>
                                    {t("instructorDashboard.student")}
                                  </TableCell>
                                  <TableCell align="right">
                                    {t("instructorDashboard.average")}
                                  </TableCell>
                                  <TableCell align="right">
                                    {t("instructorDashboard.completed")}
                                  </TableCell>
                                  <TableCell align="right">
                                    {t("instructorDashboard.completion")}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {stats.leaderboard.map((student, idx) => (
                                  <TableRow
                                    key={student.studentId}
                                    sx={{
                                      backgroundColor:
                                        idx < 3
                                          ? `rgba(255, 215, 0, ${0.1 - idx * 0.03})`
                                          : "inherit",
                                      "&:hover": {
                                        backgroundColor: "grey.100",
                                      },
                                    }}
                                  >
                                    <TableCell>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        {idx === 0 && (
                                          <EmojiEventsIcon
                                            sx={{ color: "gold" }}
                                          />
                                        )}
                                        {idx === 1 && (
                                          <EmojiEventsIcon
                                            sx={{ color: "silver" }}
                                          />
                                        )}
                                        {idx === 2 && (
                                          <EmojiEventsIcon
                                            sx={{ color: "#cd7f32" }}
                                          />
                                        )}
                                        <Typography>{idx + 1}</Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <Avatar
                                          sx={{
                                            width: 24,
                                            height: 24,
                                            fontSize: 12,
                                          }}
                                        >
                                          {getInitials(
                                            sectionStudents[
                                              student.studentId
                                            ] || { id: student.studentId },
                                          )}
                                        </Avatar>
                                        <Typography
                                          variant="body2"
                                          noWrap
                                          sx={{ maxWidth: 200 }}
                                        >
                                          {formatLastFirst(
                                            sectionStudents[
                                              student.studentId
                                            ] || { id: student.studentId },
                                          )}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Chip
                                        label={`${Math.round(student.average)}%`}
                                        size="small"
                                        color={
                                          student.average >= 90
                                            ? "success"
                                            : student.average >= 70
                                              ? "info"
                                              : "warning"
                                        }
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      {student.assignmentsCompleted}/
                                      {student.totalAssignments}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                          justifyContent: "flex-end",
                                        }}
                                      >
                                        <LinearProgress
                                          variant="determinate"
                                          value={student.completion}
                                          sx={{
                                            width: 60,
                                            height: 6,
                                            borderRadius: 3,
                                          }}
                                          color={
                                            student.completion >= 90
                                              ? "success"
                                              : student.completion >= 70
                                                ? "info"
                                                : "warning"
                                          }
                                        />
                                        <Typography variant="caption">
                                          {Math.round(student.completion)}%
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
