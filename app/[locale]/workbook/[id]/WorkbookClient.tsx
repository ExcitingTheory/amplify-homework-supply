"use client";

/**
 * WorkbookClient — Full interactive workbook loaded via next/dynamic.
 *
 * This is the existing workbook page logic extracted into a client component
 * that receives the unit ID and renders the full interactive experience
 * (UnitProvider, grading, timer, chat, etc.).
 *
 * The RSC page passes the serialized editor state for the LexicalComposer
 * initialConfig, eliminating the need for the initial fetch waterfall.
 */

import React, { useState, useContext, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";

import { Workbook } from "@/components/Editor3";
import { SecretLinkIcon } from "@/components/Gamification/SecretLinkIcon";
import MyAuth from "@/components/AmplifyAuthenticator";
import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";
import { UnitProvider } from "@/context/unitContext";
import UnitContext from "@/context/unitContext";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import MainToolbar from "@/components/MainToolbar";

/**
 * TimerWrappedEditor — Inner content that handles the timer gate and renders workbook.
 */
function TimerWrappedEditor() {
  const t = useTranslations("pages");
  const {
    unit,
    grade,
    createGrade,
    recentGrades,
    files,
    dictionary,
    questionBank,
  } = useContext(UnitContext);

  const filesArray = useMemo(() => Object.values(files || {}), [files]);

  useChatPageContext({
    unit,
    files: filesArray,
    dictionary,
    questions: questionBank,
  });

  const unitTimeLimitSeconds = unit?.timeLimitSeconds || 0;
  const needsTimer = unitTimeLimitSeconds > 0;
  const timerStarted = grade?.timerStarted;

  return (
    <>
      {needsTimer && !timerStarted && (
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
              <Box sx={{ flexGrow: 1, margin: "1rem" }} />
            </MainToolbar>
          </AppBar>

          {recentGrades.length === 0 && (
            <Card
              elevation={5}
              sx={{
                padding: "1rem",
                width: "97vw",
                margin: "1rem auto",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                component="h4"
                sx={{ flexGrow: 1, textAlign: "center", margin: "2rem 0.5rem 0.5rem" }}
              >
                {unit?.name}
              </Typography>
              <Typography
                variant="h6"
                component="h6"
                sx={{ flexGrow: 1, textAlign: "center" }}
              >
                {unit?.description}
              </Typography>
              <Typography
                variant="h6"
                component="h6"
                sx={{ flexGrow: 1, textAlign: "center", margin: "2rem" }}
              >
                {t("workbook.timerInstructions")}
              </Typography>
              <Button
                variant="contained"
                onClick={async () => {
                  await createGrade();
                }}
              >
                {t("workbook.start")}
              </Button>
            </Card>
          )}

          {recentGrades.length > 0 && (
            <Card
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "70vw",
                bgcolor: "background.paper",
                boxShadow: "0 0 10px 3px rgba(0, 0, 0, .3)",
                backdropFilter: "blur(5px)",
                overflow: "auto",
              }}
            >
              <Typography
                variant="h4"
                component="h4"
                sx={{ flexGrow: 1, textAlign: "center", margin: "2rem 0.5rem 0.5rem" }}
              >
                {unit?.name}
              </Typography>
              <Typography
                variant="h6"
                component="h6"
                sx={{ flexGrow: 1, textAlign: "center" }}
              >
                {unit?.description}
              </Typography>

              {/* eslint-disable-next-line react/no-unknown-property */}
              <style jsx global>{`
                ol.recent-grades {
                  list-style-type: none;
                  counter-reset: my-counter;
                }
                ol.recent-grades li::before {
                  content: counter(my-counter);
                  counter-increment: my-counter;
                  font-weight: bold;
                  font-size: 1.5em;
                  position: relative;
                  left: -1.5rem;
                  top: 2rem;
                  margin-right: -0.5em;
                }
              `}</style>

              <ol
                className="recent-grades"
                style={{ padding: "0 2rem", margin: "1rem 2rem", maxHeight: "50vh", overflow: "auto" }}
              >
                {recentGrades.map((g: any, index: number) => {
                  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  const localTime = new Date(g?.createdAt).toLocaleString(undefined, { timeZone });
                  const roundedAccuracy = Math.round(g?.accuracy * 100) / 100;

                  return (
                    <li key={index}>
                      <Box sx={{ display: "flex", justifyContent: "center", margin: "0" }}>
                        <Typography variant="h6" component="div" sx={{ textAlign: "left", paddingLeft: "2rem" }}>
                          {localTime}
                        </Typography>
                        <div
                          style={{
                            flex: 1,
                            textAlign: "center",
                            flexGrow: 1,
                            borderBottom: "1px dashed currentColor",
                            margin: "0 0.4rem",
                            position: "relative",
                            top: "-0.5rem",
                          }}
                        />
                        <Typography variant="h6" component="div" sx={{ textAlign: "right", margin: "0" }}>
                          {`${roundedAccuracy}%`}
                        </Typography>
                      </Box>
                    </li>
                  );
                })}
              </ol>

              <Typography
                variant="h6"
                component="h6"
                sx={{ flexGrow: 1, textAlign: "center", margin: "2rem" }}
              >
                {t("workbook.timerInstructions")}
                <br />
                <br />
                <Button
                  variant="contained"
                  onClick={async () => {
                    await createGrade();
                  }}
                >
                  {t("workbook.start")}
                </Button>
              </Typography>
            </Card>
          )}
        </>
      )}

      {(!needsTimer || (needsTimer && timerStarted)) && (
        <Box data-tour="workbook-content">
          <Workbook />
          <SecretLinkIcon unitId={unit?.id || ""} />
        </Box>
      )}
    </>
  );
}

/**
 * WorkbookClient — Exported default for dynamic import.
 * Wraps the full workbook with auth + providers.
 */
export default function WorkbookClient() {
  const { id, sectionId } = useParams() as { id: string; sectionId?: string };

  return (
    <MyAuth>
      <FilesProvider>
        <DictionaryProvider>
          <UnitProvider id={id} sectionId={sectionId}>
            <TimerWrappedEditor />
          </UnitProvider>
        </DictionaryProvider>
      </FilesProvider>
    </MyAuth>
  );
}
