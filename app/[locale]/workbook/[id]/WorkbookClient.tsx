"use client";

/**
 * WorkbookClient — Full interactive workbook with SSR HTML skeleton.
 *
 * Receives pre-rendered HTML from the server component and displays it
 * immediately while the full interactive Lexical editor loads.
 * Once Lexical is ready, it replaces the static HTML seamlessly.
 *
 * Pattern from: https://github.com/2wheeh/lexical-nextjs-ssr
 */

import React, { useState, useContext, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { Workbook } from "@/components/Editor3";
import { WorkbookSSRSkeleton } from "@/components/Editor3/WorkbookSSRSkeleton";
import { SecretLinkIcon } from "@/components/Gamification/SecretLinkIcon";
import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";
import { UnitProvider } from "@/context/unitContext";
import UnitContext from "@/context/unitContext";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import { SectionProvider } from "@/context/sectionContext";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";

interface WorkbookClientProps {
  ssrHtml?: string;
}

/**
 * TimerWrappedEditor — Inner content that handles the timer gate and renders workbook.
 */
function TimerWrappedEditor({ ssrHtml }: { ssrHtml?: string }) {
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
          {unit ? (
            <>
              <Workbook />
              <SecretLinkIcon unitId={unit?.id || ""} />
            </>
          ) : (
            // Show SSR HTML while the interactive editor loads
            <WorkbookSSRSkeleton html={ssrHtml || ""} />
          )}
        </Box>
      )}
    </>
  );
}

/**
 * WorkbookClient — Exported default for dynamic import.
 * Wraps the full workbook with auth + providers.
 */
export default function WorkbookClient({ ssrHtml }: WorkbookClientProps) {
  const { id } = useParams() as { id: string };

  return (
      <SectionProvider unitId={id}>
        <FilesProvider>
          <DictionaryProvider>
            <UnitProvider id={id}>
              <TimerWrappedEditor ssrHtml={ssrHtml} />
            </UnitProvider>
          </DictionaryProvider>
        </FilesProvider>
        <CollaborativeChatWrapper />
      </SectionProvider>
  );
}
