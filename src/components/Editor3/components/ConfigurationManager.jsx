import React from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Skeleton,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import { getAmplifyClient } from "../../../utils/amplifyClient";
import { uploadData } from "aws-amplify/storage";
import UnitContext from "../../../context/unitContext";
import SettingsContext from "../../../context/settingsContext";
import { usePlatformSettings } from "../../../context/gamificationContext";
import CameraIcon from "@mui/icons-material/Camera";
import VideocamIcon from "@mui/icons-material/Videocam";
import DeleteIcon from "@mui/icons-material/Delete";
import getCachedUrl from "../../../utils/getCachedUrl";
import { getResponsiveImageUrls } from "../../../utils/getResponsiveImageUrls";
import FilesContext from "../../../context/fileContext";
import { useTranslations } from "next-intl";

function FeaturedImage({ style, s3Key, identityId }) {
  const [url, setUrl] = React.useState(null);
  const [srcSet, setSrcSet] = React.useState(null);
  const [sizes, setSizes] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const containerRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible || !s3Key) return;
    setLoaded(false);
    let cancelled = false;

    const fetchUrl = async () => {
      const _url = await getCachedUrl(s3Key);
      if (!cancelled) setUrl(_url);
    };
    fetchUrl();

    if (identityId) {
      const parts = s3Key.split("/");
      const filesIdx = parts.indexOf("files");
      const fileId = filesIdx >= 0 ? parts[filesIdx + 1] : null;
      if (fileId) {
        getResponsiveImageUrls(fileId, identityId)
          .then((result) => {
            if (!cancelled && result) {
              setSrcSet(result.srcSet);
              setSizes(result.sizes);
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      cancelled = true;
    };
  }, [isVisible, s3Key, identityId]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", overflow: "hidden" }}
    >
      {isVisible && url ? (
        <img
          src={url}
          srcSet={srcSet || undefined}
          sizes={sizes || undefined}
          loading="lazy"
          decoding="async"
          style={{ ...style, visibility: loaded ? "visible" : "hidden" }}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}

export default function ConfigurationManager() {
  const t = useTranslations("editor.authoring");
  const [isDragging, setIsDragging] = React.useState(false);
  const [filesToUpload, setFilesToUpload] = React.useState([]);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [inProgress, setInProgress] = React.useState(false);

  // Cover video state
  const [isVideoDragging, setIsVideoDragging] = React.useState(false);
  const [videoFilesToUpload, setVideoFilesToUpload] = React.useState([]);
  const [videoInProgress, setVideoInProgress] = React.useState(false);
  const [videoUrlInput, setVideoUrlInput] = React.useState("");
  // Resolved playback URL for the cover video preview
  const [coverVideoSrc, setCoverVideoSrc] = React.useState(null);
  const [coverVideoTranscodeStatus, setCoverVideoTranscodeStatus] =
    React.useState(null);

  // UUID v4 pattern — used to distinguish stored File IDs from raw URLs
  const isFileId = (val) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      val,
    );

  const { unit, files } = React.useContext(UnitContext);

  const {
    session: { identityId },
  } = React.useContext(FilesContext);

  // Note: Settings are now provided by SettingsContext
  // Get settings from context instead of local subscription
  const settingsContext = React.useContext(SettingsContext);
  const settings = settingsContext?.settings || null;
  const loadingSettings = settingsContext?.isLoading || false;
  const updateSettings = settingsContext?.updateSettings;
  // Global platform override for auto-analyze
  const { autoAnalyzeDocuments: globalAutoAnalyze } = usePlatformSettings();

  const handleSettingChange = async (field, value) => {
    if (!updateSettings) return;
    try {
      await updateSettings({ [field]: value });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  React.useEffect(() => {
    const asyncFunc = async () => {
      if (filesToUpload.length === 0) {
        return;
      }
      let newFilename;
      setInProgress(true);

      await Promise.allSettled(
        filesToUpload.map(async (fileInput) => {
          const { file } = fileInput;

          if (file?.type?.includes("image")) {
            newFilename = `featured-images/${file.name}`;
          }

          if (!newFilename) {
            throw new Error(
              "Please upload an image file with a valid extension.",
            );
          }

          const s3Path = `protected/${identityId}/${newFilename}`;

          const uploadOperation = uploadData({
            path: s3Path,
            data: file,
            options: {
              contentType: file.type,
              onProgress(progress) {
                setFileOperations((prev) => {
                  const newFileOperations = [...prev];
                  newFileOperations[fileInput.index].progress =
                    Math.round(
                      (progress.transferredBytes / progress.totalBytes) * 100,
                    ) + "%";
                  return newFileOperations;
                });
              },
            },
          });

          await uploadOperation.result;
        }),
      );

      setTimeout(async () => {
        setFilesToUpload([]);
        setFileOperations([]);

        try {
          const client = getAmplifyClient();
          await client.models.Unit.update({
            id: unit.id,
            featuredImage: newFilename,
          });
        } catch (error) {
          console.error(error);
        }

        setInProgress(false);
      }, 3000);
    };

    asyncFunc();
  }, [filesToUpload]);

  // Resolve cover video URL: File ID → signed URL, raw URL → as-is
  React.useEffect(() => {
    const val = unit?.featuredVideo;
    if (!val) {
      setCoverVideoSrc(null);
      setCoverVideoTranscodeStatus(null);
      return;
    }

    if (isFileId(val)) {
      const file = files?.[val];
      if (!file) return;
      setCoverVideoTranscodeStatus(file.transcodeStatus ?? null);
      // Prefer raw path for preview (HLS requires proxy + HLS.js)
      const pathToResolve = file.path;
      if (!pathToResolve) return;
      let cancelled = false;
      getCachedUrl(pathToResolve).then((url) => {
        if (!cancelled && url) setCoverVideoSrc(url);
      });
      return () => {
        cancelled = true;
      };
    } else {
      // Raw http(s) URL
      setCoverVideoSrc(val);
      setCoverVideoTranscodeStatus(null);
    }
  }, [unit?.featuredVideo, files]);

  // Video upload effect — creates File record (pipeline trigger) then uploads to S3
  React.useEffect(() => {
    const asyncFunc = async () => {
      if (videoFilesToUpload.length === 0) return;
      setVideoInProgress(true);

      try {
        const file = videoFilesToUpload[0]?.file;
        if (!file || !file.type.startsWith("video/")) {
          throw new Error("Please upload a video file.");
        }

        const client = getAmplifyClient();
        const s3Path = `protected/${identityId}/files/${file.name}`;

        // 1. Create File record FIRST so the pipeline Lambda can find it
        const { data: fileRecord, errors: fileErrors } =
          await client.models.File.create({
            name: file.name,
            mimeType: file.type,
            path: s3Path,
            identityId,
            size: file.size,
            level: "PROTECTED",
          });

        if (fileErrors?.length || !fileRecord) {
          throw new Error(
            fileErrors?.[0]?.message ?? "Failed to create File record",
          );
        }

        // 2. Link file to this unit (so it appears in the file manager)
        if (unit?.id) {
          await client.models.UnitFile.create({
            unitID: unit.id,
            fileID: fileRecord.id,
          }).catch((err) =>
            console.warn("[CoverVideo] UnitFile create error:", err),
          );
        }

        // 3. Upload to S3 — EventBridge triggers MediaConvert pipeline automatically
        await uploadData({
          path: s3Path,
          data: file,
          options: {
            contentType: file.type,
            onProgress(progress) {
              console.log(
                `[CoverVideo] Upload: ${progress.transferredBytes}/${progress.totalBytes}`,
              );
            },
          },
        }).result;

        // 4. Store File ID in unit.featuredVideo
        await client.models.Unit.update({
          id: unit.id,
          featuredVideo: fileRecord.id,
        });
      } catch (error) {
        console.error("[CoverVideo] Upload failed:", error);
      } finally {
        setVideoFilesToUpload([]);
        setVideoInProgress(false);
      }
    };

    asyncFunc();
  }, [videoFilesToUpload]);

  const handleDragOver = (e) => {
    console.log("handleDragOver");
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (event) => {
    console.log("dropped");
    event.preventDefault();
    event.stopPropagation();

    console.log(event.dataTransfer.files);

    const files = Array.from(event.dataTransfer.files);

    console.log("files>>>>", files);

    const _toupload = files.map((f, index) => {
      return {
        file: f,
        index,
      };
    });

    const _fileOperations = files.map((f) => ({
      name: f.name,
      progress: "0%",
    }));

    console.log("_toupload", _toupload);
    console.log("_fileOperations", _fileOperations);

    setFilesToUpload(_toupload);
    setFileOperations(_fileOperations);

    setIsDragging(false);
  };

  const handleVideoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(true);
  };

  const handleVideoDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files).filter((f) =>
      f.type.startsWith("video/"),
    );

    if (files.length === 0) {
      setIsVideoDragging(false);
      return;
    }

    setVideoFilesToUpload(files.map((f, index) => ({ file: f, index })));
    setIsVideoDragging(false);
  };

  const handleVideoUrlSave = async () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    try {
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: unit.id,
        featuredVideo: url,
      });
      setVideoUrlInput("");
    } catch (error) {
      console.error("Error saving cover video URL:", error);
    }
  };

  const handleRemoveCoverVideo = async () => {
    try {
      const client = getAmplifyClient();
      await client.models.Unit.update({
        id: unit.id,
        featuredVideo: null,
      });
    } catch (error) {
      console.error("Error removing cover video:", error);
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* PDF Analysis Settings */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          wordWrap: "break-word",
          overflowWrap: "break-word",
          maxWidth: "100%",
        }}
      >
        {t("configurationManager.pdfAnalysisSettings")}
      </Typography>
      <Box
        sx={{
          mb: 3,
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FormControlLabel
          sx={{
            maxWidth: "100%",
            wordWrap: "break-word",
            "& .MuiFormControlLabel-label": {
              whiteSpace: "normal",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            },
          }}
          control={
            <Switch
              checked={settings?.autoAnalyzeDocuments ?? true}
              onChange={(e) =>
                handleSettingChange("autoAnalyzeDocuments", e.target.checked)
              }
              disabled={loadingSettings || !globalAutoAnalyze}
            />
          }
          label={t("configurationManager.autoAnalyzeLabel")}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{
            ml: 4,
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "100%",
            whiteSpace: "normal",
          }}
        >
          {t("configurationManager.autoAnalyzeDescription")}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Featured Image Section */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          // border: '1px solid black',
          // backgroundColor: 'rgb(255, 255, 255, 0.1)',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={(e) => {
          console.log("onDragLeaveListItem");
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
      >
        {(isDragging || inProgress) && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={(e) => {
              console.log("onDragLeave");
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            style={{
              color: "#000",
              fontSize: "2rem",
              fontWeight: "bold",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 100,
              backgroundColor: "rgb(255, 255, 255, 0.5)",
              backdropFilter: "blur(3px)",
              textAlign: "center",
              verticalAlign: "middle",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              wrap: "wrap",
            }}
          >
            {inProgress && t("configurationManager.uploadingImage")}
            {isDragging && t("configurationManager.uploadImagePrompt")}
          </div>
        )}

        <Typography
          variant="h6"
          // component="h3"
          sx={{
            flexGrow: 1,
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "100%",
            whiteSpace: "normal",
          }}
        >
          {t("configurationManager.setFeaturedImage")}
        </Typography>

        {/**
         * drag, dro0p and resize image for featured image. If there is no featured image, pull the first image from the content and use that.
         */}

        {unit?.featuredImage && (
          <Box
            style={{
              width: "100%",
              height: "0",
              paddingTop: "calc(9 / 16 * 100%)",
              position: "relative",
              backgroundColor: "#ddd",
            }}
          >
            <FeaturedImage
              s3Key={unit.featuredImage}
              identityId={unit.identityId}
              style={{
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#333",
                backgroundColor: "rgba(255, 255, 255, 0)",
              }}
            />
          </Box>
        )}
        {!unit?.featuredImage && (
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              // height: '100%',
              // width: '100%',
              border: "1px dashed #666",
            }}
          >
            <Typography
              variant="body1"
              // component="h3"
              sx={{
                flexGrow: 1,
                wordWrap: "break-word",
                overflowWrap: "break-word",
                maxWidth: "100%",
                whiteSpace: "normal",
              }}
            >
              <CameraIcon
                sx={{
                  fontSize: "2rem",
                  margin: "1rem auto",
                  display: "block",
                }}
              />
              <br />
              {t("configurationManager.noFeaturedImage")}{" "}
              {t("configurationManager.dragDropPrompt")}
            </Typography>
          </Box>
        )}
      </div>

      <Divider sx={{ my: 2 }} />

      {/* Cover Video Section */}
      <div
        style={{ position: "relative", width: "100%" }}
        onDragOver={handleVideoDragOver}
        onDrop={handleVideoDrop}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVideoDragging(false);
        }}
      >
        {(isVideoDragging || videoInProgress) && (
          <div
            style={{
              color: "#000",
              fontSize: "1.5rem",
              fontWeight: "bold",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 100,
              backgroundColor: "rgb(255, 255, 255, 0.5)",
              backdropFilter: "blur(3px)",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {videoInProgress && t("configurationManager.uploadingVideo")}
            {isVideoDragging && t("configurationManager.dragDropVideoPrompt")}
          </div>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
              whiteSpace: "normal",
            }}
          >
            {t("configurationManager.setCoverVideo")}
          </Typography>
          {unit?.featuredVideo && (
            <IconButton
              size="small"
              title={t("configurationManager.removeCoverVideo")}
              onClick={handleRemoveCoverVideo}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {unit?.featuredVideo ? (
          <Box sx={{ width: "100%", borderRadius: 1, overflow: "hidden" }}>
            {coverVideoTranscodeStatus === "PROCESSING" ||
            coverVideoTranscodeStatus === "PENDING" ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  opacity: 0.7,
                }}
              >
                <VideocamIcon fontSize="small" />
                <Typography variant="caption">
                  {t("configurationManager.uploadingVideo")}…
                </Typography>
              </Box>
            ) : null}
            {coverVideoSrc && (
              <video
                src={coverVideoSrc}
                controls
                style={{ width: "100%", maxHeight: 200, display: "block" }}
              />
            )}
          </Box>
        ) : (
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              border: "1px dashed #666",
            }}
          >
            <VideocamIcon
              sx={{ fontSize: "2rem", margin: "0.5rem auto", display: "block" }}
            />
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                maxWidth: "100%",
              }}
            >
              {t("configurationManager.noCoverVideo")}{" "}
              {t("configurationManager.dragDropVideoPrompt")}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "flex-start" }}>
          <TextField
            size="small"
            fullWidth
            label={t("configurationManager.coverVideoUrlLabel")}
            placeholder={t("configurationManager.coverVideoUrlPlaceholder")}
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVideoUrlSave();
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleVideoUrlSave}
            disabled={!videoUrlInput.trim()}
            sx={{ whiteSpace: "nowrap", minWidth: "auto", flexShrink: 0 }}
          >
            Set
          </Button>
        </Box>
      </div>
    </Box>
  );
}
