# Missing Translations Tracker

Source of truth: `public/locales/en/*`. Targets: German (de), Spanish (es), French (fr), Japanese (ja), Chinese Simplified (zh).

- Generated: 2026-09-16
- Method: multi-model-ai-translation skill (provable mode: Claude + GPT-4o + Gemma consensus)
- Original missing: **3249** → after brace-normalization + duplicate-reuse copy: **2026** remaining

## Status legend

- ⏳ Pending — not yet translated
- ✅ Done — translated/copied, flattened, and verified
- ♻️ Copied — filled from an identical already-translated English string (placeholder-validated)
- ⚠️ Review — no-consensus or placeholder/semantic-drift exception, needs manual check

## Preprocessing (completed)

1. **Brace normalization** — `scripts/i18n-normalize-braces.js --write`: converted 489 i18next-style `{{placeholder}}` to next-intl ICU `{placeholder}` across 43 files (incl. 3 English bugs: `collaboratorManager.removeCollaborator`, `communityUnitCard.byAuthor`, `sharedUnitCard.sharedBy`). All 33 distinct tokens were plain identifiers; ICU plural messages untouched.
2. **Duplicate-reuse copy** — `scripts/i18n-copy-duplicates.js --write`: filled keys whose English string is identical to an already-translated key in the same locale, with single-brace placeholder-name validation. Verified: 0 parse errors, 0 real double-braces, 0 real placeholder mismatches.

| Locale | Original missing | ♻️ Copied | ⏳ Remaining to translate |
|---|---:|---:|---:|
| de (German) | 718 | 288 | 430 |
| es (Spanish) | 490 | 112 | 378 |
| fr (French) | 513 | 87 | 426 |
| ja (Japanese) | 577 | 119 | 458 |
| zh (Chinese (Simplified)) | 951 | 617 | 334 |
| **All** | **3249** | **1223** | **2026** |

## Remaining coverage by namespace

Counts are keys still missing per locale. `NF` = locale namespace file does not exist yet.

| Namespace | en keys | de | es | fr | ja | zh | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| `agentTools` | 26 | NF:26 | NF:26 | NF:26 | NF:26 | NF:26 | ⏳ Pending |
| `auth` | 9 | 0 | 0 | 0 | 0 | 0 | ✅ Done |
| `common` | 86 | 16 | 16 | 16 | 16 | 16 | ⏳ Pending |
| `components` | 704 | 253 | 157 | 253 | 253 | 157 | ⏳ Pending |
| `editor` | 557 | 2 | 12 | 0 | 4 | 4 | ⏳ Pending |
| `editor.ai` | 34 | 0 | 0 | 0 | 0 | 0 | ✅ Done |
| `editor.authoring` | 158 | 23 | 23 | 23 | 23 | 23 | ⏳ Pending |
| `editor.blocks` | 56 | 0 | 0 | 0 | 0 | 0 | ✅ Done |
| `editor.files` | 112 | 1 | 1 | 1 | 1 | 1 | ⏳ Pending |
| `editor.shared` | 193 | 7 | 5 | 5 | 5 | 5 | ⏳ Pending |
| `pages` | 239 | 100 | 103 | 100 | 103 | 100 | ⏳ Pending |
| `stories` | 5 | 0 | 0 | 0 | 0 | 0 | ✅ Done |
| `workbook` | 68 | 2 | 35 | 2 | 27 | 2 | ⏳ Pending |

## Remaining missing keys (to translate)

### `agentTools`

<details><summary><strong>de</strong> (German) — 26 missing (file not created) — ⏳ Pending</summary>

- [ ] `semanticSearch.noIdentity`
- [ ] `semanticSearch.noIndex`
- [ ] `semanticSearch.error`
- [ ] `readFileContent.noContent`
- [ ] `readFileContent.error`
- [ ] `studentProgress.noUnit`
- [ ] `studentProgress.noGrades`
- [ ] `studentProgress.error`
- [ ] `courseOutline.noSection`
- [ ] `courseOutline.noOutline`
- [ ] `courseOutline.error`
- [ ] `recallMemory.noHistory`
- [ ] `recallMemory.noMemory`
- [ ] `recallMemory.error`
- [ ] `updateMemory.error`
- [ ] `recallConversations.noHistory`
- [ ] `recallConversations.noSummaries`
- [ ] `recallConversations.error`
- [ ] `sectionAnalytics.instructorOnly`
- [ ] `sectionAnalytics.noSection`
- [ ] `sectionAnalytics.noAssignments`
- [ ] `sectionAnalytics.noGrades`
- [ ] `sectionAnalytics.error`
- [ ] `studentList.instructorOnly`
- [ ] `studentList.noSection`
- [ ] `studentList.error`

</details>

<details><summary><strong>es</strong> (Spanish) — 26 missing (file not created) — ⏳ Pending</summary>

- [ ] `semanticSearch.noIdentity`
- [ ] `semanticSearch.noIndex`
- [ ] `semanticSearch.error`
- [ ] `readFileContent.noContent`
- [ ] `readFileContent.error`
- [ ] `studentProgress.noUnit`
- [ ] `studentProgress.noGrades`
- [ ] `studentProgress.error`
- [ ] `courseOutline.noSection`
- [ ] `courseOutline.noOutline`
- [ ] `courseOutline.error`
- [ ] `recallMemory.noHistory`
- [ ] `recallMemory.noMemory`
- [ ] `recallMemory.error`
- [ ] `updateMemory.error`
- [ ] `recallConversations.noHistory`
- [ ] `recallConversations.noSummaries`
- [ ] `recallConversations.error`
- [ ] `sectionAnalytics.instructorOnly`
- [ ] `sectionAnalytics.noSection`
- [ ] `sectionAnalytics.noAssignments`
- [ ] `sectionAnalytics.noGrades`
- [ ] `sectionAnalytics.error`
- [ ] `studentList.instructorOnly`
- [ ] `studentList.noSection`
- [ ] `studentList.error`

</details>

<details><summary><strong>fr</strong> (French) — 26 missing (file not created) — ⏳ Pending</summary>

- [ ] `semanticSearch.noIdentity`
- [ ] `semanticSearch.noIndex`
- [ ] `semanticSearch.error`
- [ ] `readFileContent.noContent`
- [ ] `readFileContent.error`
- [ ] `studentProgress.noUnit`
- [ ] `studentProgress.noGrades`
- [ ] `studentProgress.error`
- [ ] `courseOutline.noSection`
- [ ] `courseOutline.noOutline`
- [ ] `courseOutline.error`
- [ ] `recallMemory.noHistory`
- [ ] `recallMemory.noMemory`
- [ ] `recallMemory.error`
- [ ] `updateMemory.error`
- [ ] `recallConversations.noHistory`
- [ ] `recallConversations.noSummaries`
- [ ] `recallConversations.error`
- [ ] `sectionAnalytics.instructorOnly`
- [ ] `sectionAnalytics.noSection`
- [ ] `sectionAnalytics.noAssignments`
- [ ] `sectionAnalytics.noGrades`
- [ ] `sectionAnalytics.error`
- [ ] `studentList.instructorOnly`
- [ ] `studentList.noSection`
- [ ] `studentList.error`

</details>

<details><summary><strong>ja</strong> (Japanese) — 26 missing (file not created) — ⏳ Pending</summary>

- [ ] `semanticSearch.noIdentity`
- [ ] `semanticSearch.noIndex`
- [ ] `semanticSearch.error`
- [ ] `readFileContent.noContent`
- [ ] `readFileContent.error`
- [ ] `studentProgress.noUnit`
- [ ] `studentProgress.noGrades`
- [ ] `studentProgress.error`
- [ ] `courseOutline.noSection`
- [ ] `courseOutline.noOutline`
- [ ] `courseOutline.error`
- [ ] `recallMemory.noHistory`
- [ ] `recallMemory.noMemory`
- [ ] `recallMemory.error`
- [ ] `updateMemory.error`
- [ ] `recallConversations.noHistory`
- [ ] `recallConversations.noSummaries`
- [ ] `recallConversations.error`
- [ ] `sectionAnalytics.instructorOnly`
- [ ] `sectionAnalytics.noSection`
- [ ] `sectionAnalytics.noAssignments`
- [ ] `sectionAnalytics.noGrades`
- [ ] `sectionAnalytics.error`
- [ ] `studentList.instructorOnly`
- [ ] `studentList.noSection`
- [ ] `studentList.error`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 26 missing (file not created) — ⏳ Pending</summary>

- [ ] `semanticSearch.noIdentity`
- [ ] `semanticSearch.noIndex`
- [ ] `semanticSearch.error`
- [ ] `readFileContent.noContent`
- [ ] `readFileContent.error`
- [ ] `studentProgress.noUnit`
- [ ] `studentProgress.noGrades`
- [ ] `studentProgress.error`
- [ ] `courseOutline.noSection`
- [ ] `courseOutline.noOutline`
- [ ] `courseOutline.error`
- [ ] `recallMemory.noHistory`
- [ ] `recallMemory.noMemory`
- [ ] `recallMemory.error`
- [ ] `updateMemory.error`
- [ ] `recallConversations.noHistory`
- [ ] `recallConversations.noSummaries`
- [ ] `recallConversations.error`
- [ ] `sectionAnalytics.instructorOnly`
- [ ] `sectionAnalytics.noSection`
- [ ] `sectionAnalytics.noAssignments`
- [ ] `sectionAnalytics.noGrades`
- [ ] `sectionAnalytics.error`
- [ ] `studentList.instructorOnly`
- [ ] `studentList.noSection`
- [ ] `studentList.error`

</details>

### `common`

<details><summary><strong>de</strong> (German) — 16 missing — ⏳ Pending</summary>

- [ ] `chat.openAssistant`
- [ ] `mainToolbar.collaboration`
- [ ] `mainToolbar.settings.colorMode`
- [ ] `navigation.drafts`
- [ ] `navigation.gamification`
- [ ] `navigation.collaboration`
- [ ] `navigation.collaborationDesc`
- [ ] `navigation.notifications`
- [ ] `navigation.skills`
- [ ] `timer.hours`
- [ ] `timer.minutes`
- [ ] `timer.seconds`
- [ ] `timer.increase`
- [ ] `timer.decrease`
- [ ] `peerReview.helpful`
- [ ] `peerReview.notHelpful`

</details>

<details><summary><strong>es</strong> (Spanish) — 16 missing — ⏳ Pending</summary>

- [ ] `chat.openAssistant`
- [ ] `mainToolbar.collaboration`
- [ ] `mainToolbar.settings.colorMode`
- [ ] `navigation.drafts`
- [ ] `navigation.gamification`
- [ ] `navigation.collaboration`
- [ ] `navigation.collaborationDesc`
- [ ] `navigation.notifications`
- [ ] `navigation.skills`
- [ ] `timer.hours`
- [ ] `timer.minutes`
- [ ] `timer.seconds`
- [ ] `timer.increase`
- [ ] `timer.decrease`
- [ ] `peerReview.helpful`
- [ ] `peerReview.notHelpful`

</details>

<details><summary><strong>fr</strong> (French) — 16 missing — ⏳ Pending</summary>

- [ ] `chat.openAssistant`
- [ ] `mainToolbar.collaboration`
- [ ] `mainToolbar.settings.colorMode`
- [ ] `navigation.drafts`
- [ ] `navigation.gamification`
- [ ] `navigation.collaboration`
- [ ] `navigation.collaborationDesc`
- [ ] `navigation.notifications`
- [ ] `navigation.skills`
- [ ] `timer.hours`
- [ ] `timer.minutes`
- [ ] `timer.seconds`
- [ ] `timer.increase`
- [ ] `timer.decrease`
- [ ] `peerReview.helpful`
- [ ] `peerReview.notHelpful`

</details>

<details><summary><strong>ja</strong> (Japanese) — 16 missing — ⏳ Pending</summary>

- [ ] `chat.openAssistant`
- [ ] `mainToolbar.collaboration`
- [ ] `mainToolbar.settings.colorMode`
- [ ] `navigation.drafts`
- [ ] `navigation.gamification`
- [ ] `navigation.collaboration`
- [ ] `navigation.collaborationDesc`
- [ ] `navigation.notifications`
- [ ] `navigation.skills`
- [ ] `timer.hours`
- [ ] `timer.minutes`
- [ ] `timer.seconds`
- [ ] `timer.increase`
- [ ] `timer.decrease`
- [ ] `peerReview.helpful`
- [ ] `peerReview.notHelpful`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 16 missing — ⏳ Pending</summary>

- [ ] `chat.openAssistant`
- [ ] `mainToolbar.collaboration`
- [ ] `mainToolbar.settings.colorMode`
- [ ] `navigation.drafts`
- [ ] `navigation.gamification`
- [ ] `navigation.collaboration`
- [ ] `navigation.collaborationDesc`
- [ ] `navigation.notifications`
- [ ] `navigation.skills`
- [ ] `timer.hours`
- [ ] `timer.minutes`
- [ ] `timer.seconds`
- [ ] `timer.increase`
- [ ] `timer.decrease`
- [ ] `peerReview.helpful`
- [ ] `peerReview.notHelpful`

</details>

### `components`

<details><summary><strong>de</strong> (German) — 253 missing — ⏳ Pending</summary>

- [ ] `authenticator.preferredNameLabel`
- [ ] `authenticator.preferredNamePlaceholder`
- [ ] `authenticator.firstNameLabel`
- [ ] `authenticator.firstNamePlaceholder`
- [ ] `authenticator.lastNameLabel`
- [ ] `authenticator.lastNamePlaceholder`
- [ ] `chat.openAssistant`
- [ ] `dictionaryEditor.noRubyTags`
- [ ] `dictionaryEditor.saveRubyTags`
- [ ] `documentSourceBadge.pagePrefix`
- [ ] `documentSourceBadge.sourcePrefix`
- [ ] `moderationBadge.approved`
- [ ] `moderationBadge.categories`
- [ ] `moderationBadge.flagged`
- [ ] `moderationBadge.flaggedForReview`
- [ ] `moderationBadge.flaggedWithCategories`
- [ ] `moderationBadge.savedMessage`
- [ ] `moderationPanel.alertMessage`
- [ ] `moderationPanel.categories.fallback`
- [ ] `moderationPanel.categories.harassment`
- [ ] `moderationPanel.categories.harassment threatening`
- [ ] `moderationPanel.categories.hate`
- [ ] `moderationPanel.categories.hate threatening`
- [ ] `moderationPanel.categories.self-harm`
- [ ] `moderationPanel.categories.self-harm instructions`
- [ ] `moderationPanel.categories.self-harm intent`
- [ ] `moderationPanel.categories.sexual`
- [ ] `moderationPanel.categories.sexual minors`
- [ ] `moderationPanel.categories.violence`
- [ ] `moderationPanel.categories.violence graphic`
- [ ] `moderationPanel.checked`
- [ ] `moderationPanel.confidence`
- [ ] `moderationPanel.disclaimerLabel`
- [ ] `moderationPanel.disclaimerNote`
- [ ] `moderationPanel.flaggedCategories`
- [ ] `moderationPanel.model`
- [ ] `moderationPanel.title`
- [ ] `pdfThumbnail.failedToLoad`
- [ ] `pdfThumbnail.pageNumber`
- [ ] `questionBlock.answerLabel`
- [ ] `questionBlock.correct`
- [ ] `questionBlock.incorrect`
- [ ] `questionEditor.dialogTitle`
- [ ] `recordingStudio2.existingRecordings`
- [ ] `recordingStudio2.recordedAudioWaveform`
- [ ] `recordingStudio2.recordingNumber`
- [ ] `recordingStudio2.staticWaveformPreview`
- [ ] `recordingStudioEnhanced.addTrack`
- [ ] `recordingStudioEnhanced.audioFilters`
- [ ] `recordingStudioEnhanced.broadcast`
- [ ] `recordingStudioEnhanced.clarity`
- [ ] `recordingStudioEnhanced.clickToRecord`
- [ ] `recordingStudioEnhanced.cutTooltip`
- [ ] `recordingStudioEnhanced.deleteLastTrackAlert`
- [ ] `recordingStudioEnhanced.enterPrompt`
- [ ] `recordingStudioEnhanced.heavy`
- [ ] `recordingStudioEnhanced.light`
- [ ] `recordingStudioEnhanced.medium`
- [ ] `recordingStudioEnhanced.micAccessError`
- [ ] `recordingStudioEnhanced.noClips`
- [ ] `recordingStudioEnhanced.noiseReduction`
- [ ] `recordingStudioEnhanced.none`
- [ ] `recordingStudioEnhanced.presence`
- [ ] `recordingStudioEnhanced.promptPlaceholder`
- [ ] `recordingStudioEnhanced.recording`
- [ ] `recordingStudioEnhanced.selectToCut`
- [ ] `recordingStudioEnhanced.speechEnhancement`
- [ ] `recordingStudioEnhanced.trackName`
- [ ] `recordingStudioEnhanced.ttsGenerationFailed`
- [ ] `recordingStudioEnhanced.ttsNotImplemented`
- [ ] `savedPdfThumbnail.errorMessage`
- [ ] `savedPdfThumbnail.pageOverlay`
- [ ] `screenplayEditor.placeholder`
- [ ] `sectionAssigner.assign`
- [ ] `sectionAssigner.dialogTitle`
- [ ] `sectionAssigner.selectSection`
- [ ] `sortableAnswers.answerLabel`
- [ ] `sortableAnswers.correct`
- [ ] `sortableAnswers.incorrect`
- [ ] `svgPreview.caption`
- [ ] `svgPreview.emptyState`
- [ ] `vocabularyReview.filteringBySearch`
- [ ] `vocabularyReview.importToDictionary`
- [ ] `vocabularyReview.importedOn`
- [ ] `vocabularyReview.noVocabulary`
- [ ] `vocabularyReview.pages`
- [ ] `vocabularyReview.sectionHeading`
- [ ] `vocabularyReview.selectedCount`
- [ ] `vocabularyReview.summariesAndObjectives`
- [ ] `wordEmbedding.embeddingFailed`
- [ ] `wordEmbedding.questionSaveFailed`
- [ ] `wordEmbeddingIntegration.embeddingFailed`
- [ ] `wordEmbeddingIntegration.embeddingGenerated`
- [ ] `instructorDashboard.overallPerformance`
- [ ] `instructorDashboard.totalStudents`
- [ ] `instructorDashboard.totalAssignments`
- [ ] `instructorDashboard.averageGrade`
- [ ] `instructorDashboard.averageCompletion`
- [ ] `instructorDashboard.sectionLeaderboards`
- [ ] `instructorDashboard.students`
- [ ] `instructorDashboard.avg`
- [ ] `instructorDashboard.noDataYet`
- [ ] `instructorDashboard.rank`
- [ ] `instructorDashboard.average`
- [ ] `permissionError.title`
- [ ] `permissionError.defaultMessage`
- [ ] `permissionError.explanation`
- [ ] `permissionError.contactInfo`
- [ ] `permissionError.goBack`
- [ ] `permissionError.goHome`
- [ ] `permissionError.resourceTypes.unit`
- [ ] `permissionError.resourceTypes.section`
- [ ] `permissionError.resourceTypes.assignment`
- [ ] `permissionError.resourceTypes.grade`
- [ ] `collaboration.title`
- [ ] `collaboration.tabInvitations`
- [ ] `collaboration.tabJoin`
- [ ] `collaboration.typePeerReview`
- [ ] `collaboration.joinButton`
- [ ] `collaboration.joining`
- [ ] `collaboration.noInvitations`
- [ ] `collaboration.emptyInput`
- [ ] `collaboration.error`
- [ ] `practiceDrill.config.title`
- [ ] `practiceDrill.config.subtitle`
- [ ] `practiceDrill.config.vocabularyDesc`
- [ ] `practiceDrill.config.questionsDesc`
- [ ] `practiceDrill.config.text`
- [ ] `practiceDrill.config.textDesc`
- [ ] `practiceDrill.config.documents`
- [ ] `practiceDrill.config.documentsDesc`
- [ ] `practiceDrill.config.coverage`
- [ ] `practiceDrill.config.questionCount`
- [ ] `practiceDrill.config.drillType`
- [ ] `practiceDrill.config.mixed`
- [ ] `practiceDrill.config.comprehension`
- [ ] `practiceDrill.config.review`
- [ ] `practiceDrill.config.studyTogether`
- [ ] `practiceDrill.config.studyTogetherDesc`
- [ ] `practiceDrill.config.maxParticipants`
- [ ] `practiceDrill.config.noSourcesWarning`
- [ ] `practiceDrill.config.start`
- [ ] `practiceDrill.library.title`
- [ ] `practiceDrill.library.resumeTitle`
- [ ] `practiceDrill.library.resumeLabel`
- [ ] `practiceDrill.library.templatesTitle`
- [ ] `practiceDrill.library.generateNew`
- [ ] `practiceDrill.progress.xpTooltip`
- [ ] `practiceDrill.progress.xpDiminishedTooltip`
- [ ] `practiceDrill.progress.streakTooltip`
- [ ] `practiceDrill.collab.connected`
- [ ] `practiceDrill.collab.disconnected`
- [ ] `practiceDrill.collab.participants`
- [ ] `practiceDrill.collab.groupAccuracyTip`
- [ ] `practiceDrill.collab.groupAccuracy`
- [ ] `practiceDrill.collab.copyCode`
- [ ] `practiceDrill.collab.groupProgress`
- [ ] `practiceDrill.workbook.noBlocks`
- [ ] `practiceDrill.workbook.label`
- [ ] `practiceDrill.dialog.titleWithUnit`
- [ ] `practiceDrill.dialog.generating`
- [ ] `practiceDrill.dialog.complete`
- [ ] `practiceDrill.dialog.completeSummary`
- [ ] `practiceDrill.dialog.finish`
- [ ] `practiceDrill.join.title`
- [ ] `practiceDrill.join.tabCode`
- [ ] `practiceDrill.join.tabInvitations`
- [ ] `practiceDrill.join.description`
- [ ] `practiceDrill.join.codeLabel`
- [ ] `practiceDrill.join.codeTooShort`
- [ ] `practiceDrill.join.notFound`
- [ ] `practiceDrill.join.full`
- [ ] `practiceDrill.join.error`
- [ ] `practiceDrill.join.joinButton`
- [ ] `practiceDrill.join.joining`
- [ ] `practiceDrill.join.noInvitations`
- [ ] `workbook.joinDialog.title`
- [ ] `workbook.joinDialog.tabLink`
- [ ] `workbook.joinDialog.tabInvitations`
- [ ] `workbook.joinDialog.description`
- [ ] `workbook.joinDialog.inputLabel`
- [ ] `workbook.joinDialog.joinButton`
- [ ] `workbook.joinDialog.joining`
- [ ] `workbook.joinDialog.noInvitations`
- [ ] `workbook.invite.shareTooltip`
- [ ] `workbook.invite.title`
- [ ] `workbook.invite.description`
- [ ] `workbook.invite.copy`
- [ ] `workbook.invite.copyLink`
- [ ] `workbook.invite.currentlyOnline`
- [ ] `workbook.invite.noOthers`
- [ ] `workbook.invite.idle`
- [ ] `peerReview.joinDialog.title`
- [ ] `peerReview.joinDialog.tabCode`
- [ ] `peerReview.joinDialog.tabInvitations`
- [ ] `peerReview.joinDialog.description`
- [ ] `peerReview.joinDialog.codeLabel`
- [ ] `peerReview.joinDialog.joining`
- [ ] `peerReview.joinDialog.noInvitations`
- [ ] `notification.title`
- [ ] `notification.markAllRead`
- [ ] `notification.empty`
- [ ] `notification.emptyDescription`
- [ ] `notification.category.all`
- [ ] `notification.category.collaboration`
- [ ] `notification.category.gamification`
- [ ] `notification.category.system`
- [ ] `recordingStudio3Modal.backToStudio`
- [ ] `recordingStudio3Modal.confirmTitle`
- [ ] `recordingStudio3Modal.conversationSaveInfo`
- [ ] `recordingStudio3Modal.generateMissingTts`
- [ ] `recordingStudio3Modal.generatingTtsProgress`
- [ ] `recordingStudio3Modal.missingTakesWarning`
- [ ] `recordingStudio3Modal.noActiveTake`
- [ ] `recordingStudio3Modal.recording`
- [ ] `recordingStudio3Modal.unsavedChanges`
- [ ] `recordingStudio3Modal.unsavedChangesTitle`
- [ ] `recordingStudio3Modal.wordSaveInfo`
- [ ] `sectionDetail.completionGrid`
- [ ] `armorEditor.shieldPreview`
- [ ] `armorEditor.addCharge`
- [ ] `armorEditor.chargeSize`
- [ ] `armorEditor.chargeRotation`
- [ ] `armorEditor.xOffset`
- [ ] `armorEditor.yOffset`
- [ ] `skillTree.title`
- [ ] `skillTree.empty`
- [ ] `collaboratorManager.title`
- [ ] `collaboratorManager.addCollaborator`
- [ ] `collaboratorManager.noCollaborators`
- [ ] `collaboratorManager.searchInstructors`
- [ ] `collaboratorManager.searchPlaceholder`
- [ ] `collaboratorManager.typeAtLeast`
- [ ] `collaboratorManager.noInstructorsFound`
- [ ] `collaboratorManager.permissionLevel`
- [ ] `collaboratorManager.permissionRead`
- [ ] `collaboratorManager.permissionEdit`
- [ ] `collaboratorManager.removeCollaborator`
- [ ] `collaboratorManager.failedToLoad`
- [ ] `collaboratorManager.failedToAdd`
- [ ] `collaboratorManager.failedToRemove`
- [ ] `collaboratorManager.readPermission`
- [ ] `communityUnitCard.byAuthor`
- [ ] `communityUnitCard.fork`
- [ ] `communityUnitCard.forking`
- [ ] `sharedUnitCard.editAccess`
- [ ] `sharedUnitCard.readOnly`
- [ ] `sharedUnitCard.sharedBy`
- [ ] `sharedUnitCard.showDeletedItems`
- [ ] `showDeletedItems`
- [ ] `recordingStudioEnhancedModal.saveConversation`
- [ ] `recordingStudioEnhancedModal.defaultTitle`
- [ ] `amblifyAuthenticator.emailPhoneOptions`

</details>

<details><summary><strong>es</strong> (Spanish) — 157 missing — ⏳ Pending</summary>

- [ ] `authenticator.preferredNameLabel`
- [ ] `authenticator.preferredNamePlaceholder`
- [ ] `authenticator.firstNameLabel`
- [ ] `authenticator.firstNamePlaceholder`
- [ ] `authenticator.lastNameLabel`
- [ ] `authenticator.lastNamePlaceholder`
- [ ] `chat.openAssistant`
- [ ] `dictionaryEditor.noRubyTags`
- [ ] `dictionaryEditor.saveRubyTags`
- [ ] `permissionError.title`
- [ ] `permissionError.defaultMessage`
- [ ] `permissionError.explanation`
- [ ] `permissionError.contactInfo`
- [ ] `permissionError.goBack`
- [ ] `permissionError.goHome`
- [ ] `permissionError.resourceTypes.unit`
- [ ] `permissionError.resourceTypes.section`
- [ ] `permissionError.resourceTypes.assignment`
- [ ] `permissionError.resourceTypes.grade`
- [ ] `collaboration.title`
- [ ] `collaboration.tabInvitations`
- [ ] `collaboration.tabJoin`
- [ ] `collaboration.typePeerReview`
- [ ] `collaboration.joinButton`
- [ ] `collaboration.joining`
- [ ] `collaboration.noInvitations`
- [ ] `collaboration.emptyInput`
- [ ] `collaboration.error`
- [ ] `practiceDrill.config.title`
- [ ] `practiceDrill.config.subtitle`
- [ ] `practiceDrill.config.vocabularyDesc`
- [ ] `practiceDrill.config.questionsDesc`
- [ ] `practiceDrill.config.text`
- [ ] `practiceDrill.config.textDesc`
- [ ] `practiceDrill.config.documents`
- [ ] `practiceDrill.config.documentsDesc`
- [ ] `practiceDrill.config.coverage`
- [ ] `practiceDrill.config.questionCount`
- [ ] `practiceDrill.config.drillType`
- [ ] `practiceDrill.config.mixed`
- [ ] `practiceDrill.config.comprehension`
- [ ] `practiceDrill.config.review`
- [ ] `practiceDrill.config.studyTogether`
- [ ] `practiceDrill.config.studyTogetherDesc`
- [ ] `practiceDrill.config.maxParticipants`
- [ ] `practiceDrill.config.noSourcesWarning`
- [ ] `practiceDrill.config.start`
- [ ] `practiceDrill.library.title`
- [ ] `practiceDrill.library.resumeTitle`
- [ ] `practiceDrill.library.resumeLabel`
- [ ] `practiceDrill.library.templatesTitle`
- [ ] `practiceDrill.library.generateNew`
- [ ] `practiceDrill.progress.xpTooltip`
- [ ] `practiceDrill.progress.xpDiminishedTooltip`
- [ ] `practiceDrill.progress.streakTooltip`
- [ ] `practiceDrill.collab.connected`
- [ ] `practiceDrill.collab.disconnected`
- [ ] `practiceDrill.collab.participants`
- [ ] `practiceDrill.collab.groupAccuracyTip`
- [ ] `practiceDrill.collab.groupAccuracy`
- [ ] `practiceDrill.collab.copyCode`
- [ ] `practiceDrill.collab.groupProgress`
- [ ] `practiceDrill.workbook.noBlocks`
- [ ] `practiceDrill.workbook.label`
- [ ] `practiceDrill.dialog.titleWithUnit`
- [ ] `practiceDrill.dialog.generating`
- [ ] `practiceDrill.dialog.complete`
- [ ] `practiceDrill.dialog.completeSummary`
- [ ] `practiceDrill.dialog.finish`
- [ ] `practiceDrill.join.title`
- [ ] `practiceDrill.join.tabCode`
- [ ] `practiceDrill.join.tabInvitations`
- [ ] `practiceDrill.join.description`
- [ ] `practiceDrill.join.codeLabel`
- [ ] `practiceDrill.join.codeTooShort`
- [ ] `practiceDrill.join.notFound`
- [ ] `practiceDrill.join.full`
- [ ] `practiceDrill.join.error`
- [ ] `practiceDrill.join.joinButton`
- [ ] `practiceDrill.join.joining`
- [ ] `practiceDrill.join.noInvitations`
- [ ] `workbook.joinDialog.title`
- [ ] `workbook.joinDialog.tabLink`
- [ ] `workbook.joinDialog.tabInvitations`
- [ ] `workbook.joinDialog.description`
- [ ] `workbook.joinDialog.inputLabel`
- [ ] `workbook.joinDialog.joinButton`
- [ ] `workbook.joinDialog.joining`
- [ ] `workbook.joinDialog.noInvitations`
- [ ] `workbook.invite.shareTooltip`
- [ ] `workbook.invite.title`
- [ ] `workbook.invite.description`
- [ ] `workbook.invite.copy`
- [ ] `workbook.invite.copyLink`
- [ ] `workbook.invite.currentlyOnline`
- [ ] `workbook.invite.noOthers`
- [ ] `workbook.invite.idle`
- [ ] `peerReview.joinDialog.title`
- [ ] `peerReview.joinDialog.tabCode`
- [ ] `peerReview.joinDialog.tabInvitations`
- [ ] `peerReview.joinDialog.description`
- [ ] `peerReview.joinDialog.codeLabel`
- [ ] `peerReview.joinDialog.joining`
- [ ] `peerReview.joinDialog.noInvitations`
- [ ] `notification.title`
- [ ] `notification.markAllRead`
- [ ] `notification.empty`
- [ ] `notification.emptyDescription`
- [ ] `notification.category.all`
- [ ] `notification.category.collaboration`
- [ ] `notification.category.gamification`
- [ ] `notification.category.system`
- [ ] `recordingStudio3Modal.backToStudio`
- [ ] `recordingStudio3Modal.confirmTitle`
- [ ] `recordingStudio3Modal.conversationSaveInfo`
- [ ] `recordingStudio3Modal.generateMissingTts`
- [ ] `recordingStudio3Modal.generatingTtsProgress`
- [ ] `recordingStudio3Modal.missingTakesWarning`
- [ ] `recordingStudio3Modal.noActiveTake`
- [ ] `recordingStudio3Modal.unsavedChanges`
- [ ] `recordingStudio3Modal.unsavedChangesTitle`
- [ ] `recordingStudio3Modal.wordSaveInfo`
- [ ] `sectionDetail.completionGrid`
- [ ] `armorEditor.shieldPreview`
- [ ] `armorEditor.addCharge`
- [ ] `armorEditor.chargeSize`
- [ ] `armorEditor.chargeRotation`
- [ ] `armorEditor.xOffset`
- [ ] `armorEditor.yOffset`
- [ ] `skillTree.title`
- [ ] `skillTree.empty`
- [ ] `collaboratorManager.title`
- [ ] `collaboratorManager.addCollaborator`
- [ ] `collaboratorManager.noCollaborators`
- [ ] `collaboratorManager.searchInstructors`
- [ ] `collaboratorManager.searchPlaceholder`
- [ ] `collaboratorManager.typeAtLeast`
- [ ] `collaboratorManager.noInstructorsFound`
- [ ] `collaboratorManager.permissionLevel`
- [ ] `collaboratorManager.permissionRead`
- [ ] `collaboratorManager.permissionEdit`
- [ ] `collaboratorManager.removeCollaborator`
- [ ] `collaboratorManager.failedToLoad`
- [ ] `collaboratorManager.failedToAdd`
- [ ] `collaboratorManager.failedToRemove`
- [ ] `collaboratorManager.readPermission`
- [ ] `communityUnitCard.byAuthor`
- [ ] `communityUnitCard.fork`
- [ ] `communityUnitCard.forking`
- [ ] `sharedUnitCard.editAccess`
- [ ] `sharedUnitCard.readOnly`
- [ ] `sharedUnitCard.sharedBy`
- [ ] `sharedUnitCard.showDeletedItems`
- [ ] `showDeletedItems`
- [ ] `recordingStudioEnhancedModal.saveConversation`
- [ ] `recordingStudioEnhancedModal.defaultTitle`
- [ ] `amblifyAuthenticator.emailPhoneOptions`

</details>

<details><summary><strong>fr</strong> (French) — 253 missing — ⏳ Pending</summary>

- [ ] `authenticator.preferredNameLabel`
- [ ] `authenticator.preferredNamePlaceholder`
- [ ] `authenticator.firstNameLabel`
- [ ] `authenticator.firstNamePlaceholder`
- [ ] `authenticator.lastNameLabel`
- [ ] `authenticator.lastNamePlaceholder`
- [ ] `chat.openAssistant`
- [ ] `dictionaryEditor.noRubyTags`
- [ ] `dictionaryEditor.saveRubyTags`
- [ ] `documentSourceBadge.pagePrefix`
- [ ] `documentSourceBadge.sourcePrefix`
- [ ] `moderationBadge.approved`
- [ ] `moderationBadge.categories`
- [ ] `moderationBadge.flagged`
- [ ] `moderationBadge.flaggedForReview`
- [ ] `moderationBadge.flaggedWithCategories`
- [ ] `moderationBadge.savedMessage`
- [ ] `moderationPanel.alertMessage`
- [ ] `moderationPanel.categories.fallback`
- [ ] `moderationPanel.categories.harassment`
- [ ] `moderationPanel.categories.harassment threatening`
- [ ] `moderationPanel.categories.hate`
- [ ] `moderationPanel.categories.hate threatening`
- [ ] `moderationPanel.categories.self-harm`
- [ ] `moderationPanel.categories.self-harm instructions`
- [ ] `moderationPanel.categories.self-harm intent`
- [ ] `moderationPanel.categories.sexual`
- [ ] `moderationPanel.categories.sexual minors`
- [ ] `moderationPanel.categories.violence`
- [ ] `moderationPanel.categories.violence graphic`
- [ ] `moderationPanel.checked`
- [ ] `moderationPanel.confidence`
- [ ] `moderationPanel.disclaimerLabel`
- [ ] `moderationPanel.disclaimerNote`
- [ ] `moderationPanel.flaggedCategories`
- [ ] `moderationPanel.model`
- [ ] `moderationPanel.title`
- [ ] `pdfThumbnail.failedToLoad`
- [ ] `pdfThumbnail.pageNumber`
- [ ] `questionBlock.answerLabel`
- [ ] `questionBlock.correct`
- [ ] `questionBlock.incorrect`
- [ ] `questionEditor.dialogTitle`
- [ ] `recordingStudio2.existingRecordings`
- [ ] `recordingStudio2.recordedAudioWaveform`
- [ ] `recordingStudio2.recordingNumber`
- [ ] `recordingStudio2.staticWaveformPreview`
- [ ] `recordingStudioEnhanced.addTrack`
- [ ] `recordingStudioEnhanced.audioFilters`
- [ ] `recordingStudioEnhanced.broadcast`
- [ ] `recordingStudioEnhanced.clarity`
- [ ] `recordingStudioEnhanced.clickToRecord`
- [ ] `recordingStudioEnhanced.cutTooltip`
- [ ] `recordingStudioEnhanced.deleteLastTrackAlert`
- [ ] `recordingStudioEnhanced.enterPrompt`
- [ ] `recordingStudioEnhanced.heavy`
- [ ] `recordingStudioEnhanced.light`
- [ ] `recordingStudioEnhanced.medium`
- [ ] `recordingStudioEnhanced.micAccessError`
- [ ] `recordingStudioEnhanced.noClips`
- [ ] `recordingStudioEnhanced.noiseReduction`
- [ ] `recordingStudioEnhanced.none`
- [ ] `recordingStudioEnhanced.presence`
- [ ] `recordingStudioEnhanced.promptPlaceholder`
- [ ] `recordingStudioEnhanced.recording`
- [ ] `recordingStudioEnhanced.selectToCut`
- [ ] `recordingStudioEnhanced.speechEnhancement`
- [ ] `recordingStudioEnhanced.trackName`
- [ ] `recordingStudioEnhanced.ttsGenerationFailed`
- [ ] `recordingStudioEnhanced.ttsNotImplemented`
- [ ] `savedPdfThumbnail.errorMessage`
- [ ] `savedPdfThumbnail.pageOverlay`
- [ ] `screenplayEditor.placeholder`
- [ ] `sectionAssigner.assign`
- [ ] `sectionAssigner.dialogTitle`
- [ ] `sectionAssigner.selectSection`
- [ ] `sortableAnswers.answerLabel`
- [ ] `sortableAnswers.correct`
- [ ] `sortableAnswers.incorrect`
- [ ] `svgPreview.caption`
- [ ] `svgPreview.emptyState`
- [ ] `vocabularyReview.filteringBySearch`
- [ ] `vocabularyReview.importToDictionary`
- [ ] `vocabularyReview.importedOn`
- [ ] `vocabularyReview.noVocabulary`
- [ ] `vocabularyReview.pages`
- [ ] `vocabularyReview.sectionHeading`
- [ ] `vocabularyReview.selectedCount`
- [ ] `vocabularyReview.summariesAndObjectives`
- [ ] `wordEmbedding.embeddingFailed`
- [ ] `wordEmbedding.questionSaveFailed`
- [ ] `wordEmbeddingIntegration.embeddingFailed`
- [ ] `wordEmbeddingIntegration.embeddingGenerated`
- [ ] `instructorDashboard.overallPerformance`
- [ ] `instructorDashboard.totalStudents`
- [ ] `instructorDashboard.totalAssignments`
- [ ] `instructorDashboard.averageGrade`
- [ ] `instructorDashboard.averageCompletion`
- [ ] `instructorDashboard.sectionLeaderboards`
- [ ] `instructorDashboard.students`
- [ ] `instructorDashboard.avg`
- [ ] `instructorDashboard.noDataYet`
- [ ] `instructorDashboard.rank`
- [ ] `instructorDashboard.average`
- [ ] `permissionError.title`
- [ ] `permissionError.defaultMessage`
- [ ] `permissionError.explanation`
- [ ] `permissionError.contactInfo`
- [ ] `permissionError.goBack`
- [ ] `permissionError.goHome`
- [ ] `permissionError.resourceTypes.unit`
- [ ] `permissionError.resourceTypes.section`
- [ ] `permissionError.resourceTypes.assignment`
- [ ] `permissionError.resourceTypes.grade`
- [ ] `collaboration.title`
- [ ] `collaboration.tabInvitations`
- [ ] `collaboration.tabJoin`
- [ ] `collaboration.typePeerReview`
- [ ] `collaboration.joinButton`
- [ ] `collaboration.joining`
- [ ] `collaboration.noInvitations`
- [ ] `collaboration.emptyInput`
- [ ] `collaboration.error`
- [ ] `practiceDrill.config.title`
- [ ] `practiceDrill.config.subtitle`
- [ ] `practiceDrill.config.vocabularyDesc`
- [ ] `practiceDrill.config.questionsDesc`
- [ ] `practiceDrill.config.text`
- [ ] `practiceDrill.config.textDesc`
- [ ] `practiceDrill.config.documents`
- [ ] `practiceDrill.config.documentsDesc`
- [ ] `practiceDrill.config.coverage`
- [ ] `practiceDrill.config.questionCount`
- [ ] `practiceDrill.config.drillType`
- [ ] `practiceDrill.config.mixed`
- [ ] `practiceDrill.config.comprehension`
- [ ] `practiceDrill.config.review`
- [ ] `practiceDrill.config.studyTogether`
- [ ] `practiceDrill.config.studyTogetherDesc`
- [ ] `practiceDrill.config.maxParticipants`
- [ ] `practiceDrill.config.noSourcesWarning`
- [ ] `practiceDrill.config.start`
- [ ] `practiceDrill.library.title`
- [ ] `practiceDrill.library.resumeTitle`
- [ ] `practiceDrill.library.resumeLabel`
- [ ] `practiceDrill.library.templatesTitle`
- [ ] `practiceDrill.library.generateNew`
- [ ] `practiceDrill.progress.xpTooltip`
- [ ] `practiceDrill.progress.xpDiminishedTooltip`
- [ ] `practiceDrill.progress.streakTooltip`
- [ ] `practiceDrill.collab.connected`
- [ ] `practiceDrill.collab.disconnected`
- [ ] `practiceDrill.collab.participants`
- [ ] `practiceDrill.collab.groupAccuracyTip`
- [ ] `practiceDrill.collab.groupAccuracy`
- [ ] `practiceDrill.collab.copyCode`
- [ ] `practiceDrill.collab.groupProgress`
- [ ] `practiceDrill.workbook.noBlocks`
- [ ] `practiceDrill.workbook.label`
- [ ] `practiceDrill.dialog.titleWithUnit`
- [ ] `practiceDrill.dialog.generating`
- [ ] `practiceDrill.dialog.complete`
- [ ] `practiceDrill.dialog.completeSummary`
- [ ] `practiceDrill.dialog.finish`
- [ ] `practiceDrill.join.title`
- [ ] `practiceDrill.join.tabCode`
- [ ] `practiceDrill.join.tabInvitations`
- [ ] `practiceDrill.join.description`
- [ ] `practiceDrill.join.codeLabel`
- [ ] `practiceDrill.join.codeTooShort`
- [ ] `practiceDrill.join.notFound`
- [ ] `practiceDrill.join.full`
- [ ] `practiceDrill.join.error`
- [ ] `practiceDrill.join.joinButton`
- [ ] `practiceDrill.join.joining`
- [ ] `practiceDrill.join.noInvitations`
- [ ] `workbook.joinDialog.title`
- [ ] `workbook.joinDialog.tabLink`
- [ ] `workbook.joinDialog.tabInvitations`
- [ ] `workbook.joinDialog.description`
- [ ] `workbook.joinDialog.inputLabel`
- [ ] `workbook.joinDialog.joinButton`
- [ ] `workbook.joinDialog.joining`
- [ ] `workbook.joinDialog.noInvitations`
- [ ] `workbook.invite.shareTooltip`
- [ ] `workbook.invite.title`
- [ ] `workbook.invite.description`
- [ ] `workbook.invite.copy`
- [ ] `workbook.invite.copyLink`
- [ ] `workbook.invite.currentlyOnline`
- [ ] `workbook.invite.noOthers`
- [ ] `workbook.invite.idle`
- [ ] `peerReview.joinDialog.title`
- [ ] `peerReview.joinDialog.tabCode`
- [ ] `peerReview.joinDialog.tabInvitations`
- [ ] `peerReview.joinDialog.description`
- [ ] `peerReview.joinDialog.codeLabel`
- [ ] `peerReview.joinDialog.joining`
- [ ] `peerReview.joinDialog.noInvitations`
- [ ] `notification.title`
- [ ] `notification.markAllRead`
- [ ] `notification.empty`
- [ ] `notification.emptyDescription`
- [ ] `notification.category.all`
- [ ] `notification.category.collaboration`
- [ ] `notification.category.gamification`
- [ ] `notification.category.system`
- [ ] `recordingStudio3Modal.backToStudio`
- [ ] `recordingStudio3Modal.confirmTitle`
- [ ] `recordingStudio3Modal.conversationSaveInfo`
- [ ] `recordingStudio3Modal.generateMissingTts`
- [ ] `recordingStudio3Modal.generatingTtsProgress`
- [ ] `recordingStudio3Modal.missingTakesWarning`
- [ ] `recordingStudio3Modal.noActiveTake`
- [ ] `recordingStudio3Modal.recording`
- [ ] `recordingStudio3Modal.unsavedChanges`
- [ ] `recordingStudio3Modal.unsavedChangesTitle`
- [ ] `recordingStudio3Modal.wordSaveInfo`
- [ ] `sectionDetail.completionGrid`
- [ ] `armorEditor.shieldPreview`
- [ ] `armorEditor.addCharge`
- [ ] `armorEditor.chargeSize`
- [ ] `armorEditor.chargeRotation`
- [ ] `armorEditor.xOffset`
- [ ] `armorEditor.yOffset`
- [ ] `skillTree.title`
- [ ] `skillTree.empty`
- [ ] `collaboratorManager.title`
- [ ] `collaboratorManager.addCollaborator`
- [ ] `collaboratorManager.noCollaborators`
- [ ] `collaboratorManager.searchInstructors`
- [ ] `collaboratorManager.searchPlaceholder`
- [ ] `collaboratorManager.typeAtLeast`
- [ ] `collaboratorManager.noInstructorsFound`
- [ ] `collaboratorManager.permissionLevel`
- [ ] `collaboratorManager.permissionRead`
- [ ] `collaboratorManager.permissionEdit`
- [ ] `collaboratorManager.removeCollaborator`
- [ ] `collaboratorManager.failedToLoad`
- [ ] `collaboratorManager.failedToAdd`
- [ ] `collaboratorManager.failedToRemove`
- [ ] `collaboratorManager.readPermission`
- [ ] `communityUnitCard.byAuthor`
- [ ] `communityUnitCard.fork`
- [ ] `communityUnitCard.forking`
- [ ] `sharedUnitCard.editAccess`
- [ ] `sharedUnitCard.readOnly`
- [ ] `sharedUnitCard.sharedBy`
- [ ] `sharedUnitCard.showDeletedItems`
- [ ] `showDeletedItems`
- [ ] `recordingStudioEnhancedModal.saveConversation`
- [ ] `recordingStudioEnhancedModal.defaultTitle`
- [ ] `amblifyAuthenticator.emailPhoneOptions`

</details>

<details><summary><strong>ja</strong> (Japanese) — 253 missing — ⏳ Pending</summary>

- [ ] `authenticator.preferredNameLabel`
- [ ] `authenticator.preferredNamePlaceholder`
- [ ] `authenticator.firstNameLabel`
- [ ] `authenticator.firstNamePlaceholder`
- [ ] `authenticator.lastNameLabel`
- [ ] `authenticator.lastNamePlaceholder`
- [ ] `chat.openAssistant`
- [ ] `dictionaryEditor.noRubyTags`
- [ ] `dictionaryEditor.saveRubyTags`
- [ ] `documentSourceBadge.pagePrefix`
- [ ] `documentSourceBadge.sourcePrefix`
- [ ] `moderationBadge.approved`
- [ ] `moderationBadge.categories`
- [ ] `moderationBadge.flagged`
- [ ] `moderationBadge.flaggedForReview`
- [ ] `moderationBadge.flaggedWithCategories`
- [ ] `moderationBadge.savedMessage`
- [ ] `moderationPanel.alertMessage`
- [ ] `moderationPanel.categories.fallback`
- [ ] `moderationPanel.categories.harassment`
- [ ] `moderationPanel.categories.harassment threatening`
- [ ] `moderationPanel.categories.hate`
- [ ] `moderationPanel.categories.hate threatening`
- [ ] `moderationPanel.categories.self-harm`
- [ ] `moderationPanel.categories.self-harm instructions`
- [ ] `moderationPanel.categories.self-harm intent`
- [ ] `moderationPanel.categories.sexual`
- [ ] `moderationPanel.categories.sexual minors`
- [ ] `moderationPanel.categories.violence`
- [ ] `moderationPanel.categories.violence graphic`
- [ ] `moderationPanel.checked`
- [ ] `moderationPanel.confidence`
- [ ] `moderationPanel.disclaimerLabel`
- [ ] `moderationPanel.disclaimerNote`
- [ ] `moderationPanel.flaggedCategories`
- [ ] `moderationPanel.model`
- [ ] `moderationPanel.title`
- [ ] `pdfThumbnail.failedToLoad`
- [ ] `pdfThumbnail.pageNumber`
- [ ] `questionBlock.answerLabel`
- [ ] `questionBlock.correct`
- [ ] `questionBlock.incorrect`
- [ ] `questionEditor.dialogTitle`
- [ ] `recordingStudio2.existingRecordings`
- [ ] `recordingStudio2.recordedAudioWaveform`
- [ ] `recordingStudio2.recordingNumber`
- [ ] `recordingStudio2.staticWaveformPreview`
- [ ] `recordingStudioEnhanced.addTrack`
- [ ] `recordingStudioEnhanced.audioFilters`
- [ ] `recordingStudioEnhanced.broadcast`
- [ ] `recordingStudioEnhanced.clarity`
- [ ] `recordingStudioEnhanced.clickToRecord`
- [ ] `recordingStudioEnhanced.cutTooltip`
- [ ] `recordingStudioEnhanced.deleteLastTrackAlert`
- [ ] `recordingStudioEnhanced.enterPrompt`
- [ ] `recordingStudioEnhanced.heavy`
- [ ] `recordingStudioEnhanced.light`
- [ ] `recordingStudioEnhanced.medium`
- [ ] `recordingStudioEnhanced.micAccessError`
- [ ] `recordingStudioEnhanced.noClips`
- [ ] `recordingStudioEnhanced.noiseReduction`
- [ ] `recordingStudioEnhanced.none`
- [ ] `recordingStudioEnhanced.presence`
- [ ] `recordingStudioEnhanced.promptPlaceholder`
- [ ] `recordingStudioEnhanced.recording`
- [ ] `recordingStudioEnhanced.selectToCut`
- [ ] `recordingStudioEnhanced.speechEnhancement`
- [ ] `recordingStudioEnhanced.trackName`
- [ ] `recordingStudioEnhanced.ttsGenerationFailed`
- [ ] `recordingStudioEnhanced.ttsNotImplemented`
- [ ] `savedPdfThumbnail.errorMessage`
- [ ] `savedPdfThumbnail.pageOverlay`
- [ ] `screenplayEditor.placeholder`
- [ ] `sectionAssigner.assign`
- [ ] `sectionAssigner.dialogTitle`
- [ ] `sectionAssigner.selectSection`
- [ ] `sortableAnswers.answerLabel`
- [ ] `sortableAnswers.correct`
- [ ] `sortableAnswers.incorrect`
- [ ] `svgPreview.caption`
- [ ] `svgPreview.emptyState`
- [ ] `vocabularyReview.filteringBySearch`
- [ ] `vocabularyReview.importToDictionary`
- [ ] `vocabularyReview.importedOn`
- [ ] `vocabularyReview.noVocabulary`
- [ ] `vocabularyReview.pages`
- [ ] `vocabularyReview.sectionHeading`
- [ ] `vocabularyReview.selectedCount`
- [ ] `vocabularyReview.summariesAndObjectives`
- [ ] `wordEmbedding.embeddingFailed`
- [ ] `wordEmbedding.questionSaveFailed`
- [ ] `wordEmbeddingIntegration.embeddingFailed`
- [ ] `wordEmbeddingIntegration.embeddingGenerated`
- [ ] `instructorDashboard.overallPerformance`
- [ ] `instructorDashboard.totalStudents`
- [ ] `instructorDashboard.totalAssignments`
- [ ] `instructorDashboard.averageGrade`
- [ ] `instructorDashboard.averageCompletion`
- [ ] `instructorDashboard.sectionLeaderboards`
- [ ] `instructorDashboard.students`
- [ ] `instructorDashboard.avg`
- [ ] `instructorDashboard.noDataYet`
- [ ] `instructorDashboard.rank`
- [ ] `instructorDashboard.average`
- [ ] `permissionError.title`
- [ ] `permissionError.defaultMessage`
- [ ] `permissionError.explanation`
- [ ] `permissionError.contactInfo`
- [ ] `permissionError.goBack`
- [ ] `permissionError.goHome`
- [ ] `permissionError.resourceTypes.unit`
- [ ] `permissionError.resourceTypes.section`
- [ ] `permissionError.resourceTypes.assignment`
- [ ] `permissionError.resourceTypes.grade`
- [ ] `collaboration.title`
- [ ] `collaboration.tabInvitations`
- [ ] `collaboration.tabJoin`
- [ ] `collaboration.typePeerReview`
- [ ] `collaboration.joinButton`
- [ ] `collaboration.joining`
- [ ] `collaboration.noInvitations`
- [ ] `collaboration.emptyInput`
- [ ] `collaboration.error`
- [ ] `practiceDrill.config.title`
- [ ] `practiceDrill.config.subtitle`
- [ ] `practiceDrill.config.vocabularyDesc`
- [ ] `practiceDrill.config.questionsDesc`
- [ ] `practiceDrill.config.text`
- [ ] `practiceDrill.config.textDesc`
- [ ] `practiceDrill.config.documents`
- [ ] `practiceDrill.config.documentsDesc`
- [ ] `practiceDrill.config.coverage`
- [ ] `practiceDrill.config.questionCount`
- [ ] `practiceDrill.config.drillType`
- [ ] `practiceDrill.config.mixed`
- [ ] `practiceDrill.config.comprehension`
- [ ] `practiceDrill.config.review`
- [ ] `practiceDrill.config.studyTogether`
- [ ] `practiceDrill.config.studyTogetherDesc`
- [ ] `practiceDrill.config.maxParticipants`
- [ ] `practiceDrill.config.noSourcesWarning`
- [ ] `practiceDrill.config.start`
- [ ] `practiceDrill.library.title`
- [ ] `practiceDrill.library.resumeTitle`
- [ ] `practiceDrill.library.resumeLabel`
- [ ] `practiceDrill.library.templatesTitle`
- [ ] `practiceDrill.library.generateNew`
- [ ] `practiceDrill.progress.xpTooltip`
- [ ] `practiceDrill.progress.xpDiminishedTooltip`
- [ ] `practiceDrill.progress.streakTooltip`
- [ ] `practiceDrill.collab.connected`
- [ ] `practiceDrill.collab.disconnected`
- [ ] `practiceDrill.collab.participants`
- [ ] `practiceDrill.collab.groupAccuracyTip`
- [ ] `practiceDrill.collab.groupAccuracy`
- [ ] `practiceDrill.collab.copyCode`
- [ ] `practiceDrill.collab.groupProgress`
- [ ] `practiceDrill.workbook.noBlocks`
- [ ] `practiceDrill.workbook.label`
- [ ] `practiceDrill.dialog.titleWithUnit`
- [ ] `practiceDrill.dialog.generating`
- [ ] `practiceDrill.dialog.complete`
- [ ] `practiceDrill.dialog.completeSummary`
- [ ] `practiceDrill.dialog.finish`
- [ ] `practiceDrill.join.title`
- [ ] `practiceDrill.join.tabCode`
- [ ] `practiceDrill.join.tabInvitations`
- [ ] `practiceDrill.join.description`
- [ ] `practiceDrill.join.codeLabel`
- [ ] `practiceDrill.join.codeTooShort`
- [ ] `practiceDrill.join.notFound`
- [ ] `practiceDrill.join.full`
- [ ] `practiceDrill.join.error`
- [ ] `practiceDrill.join.joinButton`
- [ ] `practiceDrill.join.joining`
- [ ] `practiceDrill.join.noInvitations`
- [ ] `workbook.joinDialog.title`
- [ ] `workbook.joinDialog.tabLink`
- [ ] `workbook.joinDialog.tabInvitations`
- [ ] `workbook.joinDialog.description`
- [ ] `workbook.joinDialog.inputLabel`
- [ ] `workbook.joinDialog.joinButton`
- [ ] `workbook.joinDialog.joining`
- [ ] `workbook.joinDialog.noInvitations`
- [ ] `workbook.invite.shareTooltip`
- [ ] `workbook.invite.title`
- [ ] `workbook.invite.description`
- [ ] `workbook.invite.copy`
- [ ] `workbook.invite.copyLink`
- [ ] `workbook.invite.currentlyOnline`
- [ ] `workbook.invite.noOthers`
- [ ] `workbook.invite.idle`
- [ ] `peerReview.joinDialog.title`
- [ ] `peerReview.joinDialog.tabCode`
- [ ] `peerReview.joinDialog.tabInvitations`
- [ ] `peerReview.joinDialog.description`
- [ ] `peerReview.joinDialog.codeLabel`
- [ ] `peerReview.joinDialog.joining`
- [ ] `peerReview.joinDialog.noInvitations`
- [ ] `notification.title`
- [ ] `notification.markAllRead`
- [ ] `notification.empty`
- [ ] `notification.emptyDescription`
- [ ] `notification.category.all`
- [ ] `notification.category.collaboration`
- [ ] `notification.category.gamification`
- [ ] `notification.category.system`
- [ ] `recordingStudio3Modal.backToStudio`
- [ ] `recordingStudio3Modal.confirmTitle`
- [ ] `recordingStudio3Modal.conversationSaveInfo`
- [ ] `recordingStudio3Modal.generateMissingTts`
- [ ] `recordingStudio3Modal.generatingTtsProgress`
- [ ] `recordingStudio3Modal.missingTakesWarning`
- [ ] `recordingStudio3Modal.noActiveTake`
- [ ] `recordingStudio3Modal.recording`
- [ ] `recordingStudio3Modal.unsavedChanges`
- [ ] `recordingStudio3Modal.unsavedChangesTitle`
- [ ] `recordingStudio3Modal.wordSaveInfo`
- [ ] `sectionDetail.completionGrid`
- [ ] `armorEditor.shieldPreview`
- [ ] `armorEditor.addCharge`
- [ ] `armorEditor.chargeSize`
- [ ] `armorEditor.chargeRotation`
- [ ] `armorEditor.xOffset`
- [ ] `armorEditor.yOffset`
- [ ] `skillTree.title`
- [ ] `skillTree.empty`
- [ ] `collaboratorManager.title`
- [ ] `collaboratorManager.addCollaborator`
- [ ] `collaboratorManager.noCollaborators`
- [ ] `collaboratorManager.searchInstructors`
- [ ] `collaboratorManager.searchPlaceholder`
- [ ] `collaboratorManager.typeAtLeast`
- [ ] `collaboratorManager.noInstructorsFound`
- [ ] `collaboratorManager.permissionLevel`
- [ ] `collaboratorManager.permissionRead`
- [ ] `collaboratorManager.permissionEdit`
- [ ] `collaboratorManager.removeCollaborator`
- [ ] `collaboratorManager.failedToLoad`
- [ ] `collaboratorManager.failedToAdd`
- [ ] `collaboratorManager.failedToRemove`
- [ ] `collaboratorManager.readPermission`
- [ ] `communityUnitCard.byAuthor`
- [ ] `communityUnitCard.fork`
- [ ] `communityUnitCard.forking`
- [ ] `sharedUnitCard.editAccess`
- [ ] `sharedUnitCard.readOnly`
- [ ] `sharedUnitCard.sharedBy`
- [ ] `sharedUnitCard.showDeletedItems`
- [ ] `showDeletedItems`
- [ ] `recordingStudioEnhancedModal.saveConversation`
- [ ] `recordingStudioEnhancedModal.defaultTitle`
- [ ] `amblifyAuthenticator.emailPhoneOptions`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 157 missing — ⏳ Pending</summary>

- [ ] `authenticator.preferredNameLabel`
- [ ] `authenticator.preferredNamePlaceholder`
- [ ] `authenticator.firstNameLabel`
- [ ] `authenticator.firstNamePlaceholder`
- [ ] `authenticator.lastNameLabel`
- [ ] `authenticator.lastNamePlaceholder`
- [ ] `chat.openAssistant`
- [ ] `dictionaryEditor.noRubyTags`
- [ ] `dictionaryEditor.saveRubyTags`
- [ ] `permissionError.title`
- [ ] `permissionError.defaultMessage`
- [ ] `permissionError.explanation`
- [ ] `permissionError.contactInfo`
- [ ] `permissionError.goBack`
- [ ] `permissionError.goHome`
- [ ] `permissionError.resourceTypes.unit`
- [ ] `permissionError.resourceTypes.section`
- [ ] `permissionError.resourceTypes.assignment`
- [ ] `permissionError.resourceTypes.grade`
- [ ] `collaboration.title`
- [ ] `collaboration.tabInvitations`
- [ ] `collaboration.tabJoin`
- [ ] `collaboration.typePeerReview`
- [ ] `collaboration.joinButton`
- [ ] `collaboration.joining`
- [ ] `collaboration.noInvitations`
- [ ] `collaboration.emptyInput`
- [ ] `collaboration.error`
- [ ] `practiceDrill.config.title`
- [ ] `practiceDrill.config.subtitle`
- [ ] `practiceDrill.config.vocabularyDesc`
- [ ] `practiceDrill.config.questionsDesc`
- [ ] `practiceDrill.config.text`
- [ ] `practiceDrill.config.textDesc`
- [ ] `practiceDrill.config.documents`
- [ ] `practiceDrill.config.documentsDesc`
- [ ] `practiceDrill.config.coverage`
- [ ] `practiceDrill.config.questionCount`
- [ ] `practiceDrill.config.drillType`
- [ ] `practiceDrill.config.mixed`
- [ ] `practiceDrill.config.comprehension`
- [ ] `practiceDrill.config.review`
- [ ] `practiceDrill.config.studyTogether`
- [ ] `practiceDrill.config.studyTogetherDesc`
- [ ] `practiceDrill.config.maxParticipants`
- [ ] `practiceDrill.config.noSourcesWarning`
- [ ] `practiceDrill.config.start`
- [ ] `practiceDrill.library.title`
- [ ] `practiceDrill.library.resumeTitle`
- [ ] `practiceDrill.library.resumeLabel`
- [ ] `practiceDrill.library.templatesTitle`
- [ ] `practiceDrill.library.generateNew`
- [ ] `practiceDrill.progress.xpTooltip`
- [ ] `practiceDrill.progress.xpDiminishedTooltip`
- [ ] `practiceDrill.progress.streakTooltip`
- [ ] `practiceDrill.collab.connected`
- [ ] `practiceDrill.collab.disconnected`
- [ ] `practiceDrill.collab.participants`
- [ ] `practiceDrill.collab.groupAccuracyTip`
- [ ] `practiceDrill.collab.groupAccuracy`
- [ ] `practiceDrill.collab.copyCode`
- [ ] `practiceDrill.collab.groupProgress`
- [ ] `practiceDrill.workbook.noBlocks`
- [ ] `practiceDrill.workbook.label`
- [ ] `practiceDrill.dialog.titleWithUnit`
- [ ] `practiceDrill.dialog.generating`
- [ ] `practiceDrill.dialog.complete`
- [ ] `practiceDrill.dialog.completeSummary`
- [ ] `practiceDrill.dialog.finish`
- [ ] `practiceDrill.join.title`
- [ ] `practiceDrill.join.tabCode`
- [ ] `practiceDrill.join.tabInvitations`
- [ ] `practiceDrill.join.description`
- [ ] `practiceDrill.join.codeLabel`
- [ ] `practiceDrill.join.codeTooShort`
- [ ] `practiceDrill.join.notFound`
- [ ] `practiceDrill.join.full`
- [ ] `practiceDrill.join.error`
- [ ] `practiceDrill.join.joinButton`
- [ ] `practiceDrill.join.joining`
- [ ] `practiceDrill.join.noInvitations`
- [ ] `workbook.joinDialog.title`
- [ ] `workbook.joinDialog.tabLink`
- [ ] `workbook.joinDialog.tabInvitations`
- [ ] `workbook.joinDialog.description`
- [ ] `workbook.joinDialog.inputLabel`
- [ ] `workbook.joinDialog.joinButton`
- [ ] `workbook.joinDialog.joining`
- [ ] `workbook.joinDialog.noInvitations`
- [ ] `workbook.invite.shareTooltip`
- [ ] `workbook.invite.title`
- [ ] `workbook.invite.description`
- [ ] `workbook.invite.copy`
- [ ] `workbook.invite.copyLink`
- [ ] `workbook.invite.currentlyOnline`
- [ ] `workbook.invite.noOthers`
- [ ] `workbook.invite.idle`
- [ ] `peerReview.joinDialog.title`
- [ ] `peerReview.joinDialog.tabCode`
- [ ] `peerReview.joinDialog.tabInvitations`
- [ ] `peerReview.joinDialog.description`
- [ ] `peerReview.joinDialog.codeLabel`
- [ ] `peerReview.joinDialog.joining`
- [ ] `peerReview.joinDialog.noInvitations`
- [ ] `notification.title`
- [ ] `notification.markAllRead`
- [ ] `notification.empty`
- [ ] `notification.emptyDescription`
- [ ] `notification.category.all`
- [ ] `notification.category.collaboration`
- [ ] `notification.category.gamification`
- [ ] `notification.category.system`
- [ ] `recordingStudio3Modal.backToStudio`
- [ ] `recordingStudio3Modal.confirmTitle`
- [ ] `recordingStudio3Modal.conversationSaveInfo`
- [ ] `recordingStudio3Modal.generateMissingTts`
- [ ] `recordingStudio3Modal.generatingTtsProgress`
- [ ] `recordingStudio3Modal.missingTakesWarning`
- [ ] `recordingStudio3Modal.noActiveTake`
- [ ] `recordingStudio3Modal.unsavedChanges`
- [ ] `recordingStudio3Modal.unsavedChangesTitle`
- [ ] `recordingStudio3Modal.wordSaveInfo`
- [ ] `sectionDetail.completionGrid`
- [ ] `armorEditor.shieldPreview`
- [ ] `armorEditor.addCharge`
- [ ] `armorEditor.chargeSize`
- [ ] `armorEditor.chargeRotation`
- [ ] `armorEditor.xOffset`
- [ ] `armorEditor.yOffset`
- [ ] `skillTree.title`
- [ ] `skillTree.empty`
- [ ] `collaboratorManager.title`
- [ ] `collaboratorManager.addCollaborator`
- [ ] `collaboratorManager.noCollaborators`
- [ ] `collaboratorManager.searchInstructors`
- [ ] `collaboratorManager.searchPlaceholder`
- [ ] `collaboratorManager.typeAtLeast`
- [ ] `collaboratorManager.noInstructorsFound`
- [ ] `collaboratorManager.permissionLevel`
- [ ] `collaboratorManager.permissionRead`
- [ ] `collaboratorManager.permissionEdit`
- [ ] `collaboratorManager.removeCollaborator`
- [ ] `collaboratorManager.failedToLoad`
- [ ] `collaboratorManager.failedToAdd`
- [ ] `collaboratorManager.failedToRemove`
- [ ] `collaboratorManager.readPermission`
- [ ] `communityUnitCard.byAuthor`
- [ ] `communityUnitCard.fork`
- [ ] `communityUnitCard.forking`
- [ ] `sharedUnitCard.editAccess`
- [ ] `sharedUnitCard.readOnly`
- [ ] `sharedUnitCard.sharedBy`
- [ ] `sharedUnitCard.showDeletedItems`
- [ ] `showDeletedItems`
- [ ] `recordingStudioEnhancedModal.saveConversation`
- [ ] `recordingStudioEnhancedModal.defaultTitle`
- [ ] `amblifyAuthenticator.emailPhoneOptions`

</details>

### `editor`

<details><summary><strong>de</strong> (German) — 2 missing — ⏳ Pending</summary>

- [ ] `answerEditor.addWordLabel`
- [ ] `sketchPad.activatingDrawingPad`

</details>

<details><summary><strong>es</strong> (Spanish) — 12 missing — ⏳ Pending</summary>

- [ ] `answerComponent.noDictionaryAvailable`
- [ ] `answerEditor.addWordLabel`
- [ ] `customAnswerComponent.answerPlaceholder`
- [ ] `customAnswerComponent.answerQuestions`
- [ ] `customAnswerComponent.audioQuestion`
- [ ] `customAnswerComponent.completedQuestion`
- [ ] `customAnswerComponent.errorOccurred`
- [ ] `customAnswerComponent.promptNotAvailable`
- [ ] `customAnswerComponent.yourAnswer`
- [ ] `sketchPad.activatingDrawingPad`
- [ ] `tableComponent.cellActionsLabel`
- [ ] `tableComponent.cellActionsTitle`

</details>

<details><summary><strong>ja</strong> (Japanese) — 4 missing — ⏳ Pending</summary>

- [ ] `answerEditor.addWordLabel`
- [ ] `sketchPad.activatingDrawingPad`
- [ ] `tableComponent.cellActionsLabel`
- [ ] `tableComponent.cellActionsTitle`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 4 missing — ⏳ Pending</summary>

- [ ] `answerEditor.addWordLabel`
- [ ] `sketchPad.activatingDrawingPad`
- [ ] `tableComponent.cellActionsLabel`
- [ ] `tableComponent.cellActionsTitle`

</details>

### `editor.authoring`

<details><summary><strong>de</strong> (German) — 23 missing — ⏳ Pending</summary>

- [ ] `toolBarPlugin.blockFormat`
- [ ] `toolBarPlugin.normal`
- [ ] `toolBarPlugin.heading1`
- [ ] `toolBarPlugin.heading2`
- [ ] `toolBarPlugin.heading3`
- [ ] `toolBarPlugin.bulletedList`
- [ ] `toolBarPlugin.quoteBlock`
- [ ] `toolBarPlugin.codeBlock`
- [ ] `toolBarPlugin.textColor`
- [ ] `toolBarPlugin.backgroundColor`
- [ ] `toolBarPlugin.increaseFontSize`
- [ ] `toolBarPlugin.decreaseFontSize`
- [ ] `toolBarPlugin.generateConversation`
- [ ] `assignmentConfiguration.retryEnabled`
- [ ] `assignmentConfiguration.retryEnabledDescription`
- [ ] `configurationManager.setCoverVideo`
- [ ] `configurationManager.noCoverVideo`
- [ ] `configurationManager.coverVideoUrlPlaceholder`
- [ ] `configurationManager.coverVideoUrlLabel`
- [ ] `configurationManager.dragDropVideoPrompt`
- [ ] `configurationManager.uploadingVideo`
- [ ] `configurationManager.removeCoverVideo`
- [ ] `tabsVerticalLeft.tabs.campaign`

</details>

<details><summary><strong>es</strong> (Spanish) — 23 missing — ⏳ Pending</summary>

- [ ] `toolBarPlugin.blockFormat`
- [ ] `toolBarPlugin.normal`
- [ ] `toolBarPlugin.heading1`
- [ ] `toolBarPlugin.heading2`
- [ ] `toolBarPlugin.heading3`
- [ ] `toolBarPlugin.bulletedList`
- [ ] `toolBarPlugin.quoteBlock`
- [ ] `toolBarPlugin.codeBlock`
- [ ] `toolBarPlugin.textColor`
- [ ] `toolBarPlugin.backgroundColor`
- [ ] `toolBarPlugin.increaseFontSize`
- [ ] `toolBarPlugin.decreaseFontSize`
- [ ] `toolBarPlugin.generateConversation`
- [ ] `assignmentConfiguration.retryEnabled`
- [ ] `assignmentConfiguration.retryEnabledDescription`
- [ ] `configurationManager.setCoverVideo`
- [ ] `configurationManager.noCoverVideo`
- [ ] `configurationManager.coverVideoUrlPlaceholder`
- [ ] `configurationManager.coverVideoUrlLabel`
- [ ] `configurationManager.dragDropVideoPrompt`
- [ ] `configurationManager.uploadingVideo`
- [ ] `configurationManager.removeCoverVideo`
- [ ] `tabsVerticalLeft.tabs.campaign`

</details>

<details><summary><strong>fr</strong> (French) — 23 missing — ⏳ Pending</summary>

- [ ] `toolBarPlugin.blockFormat`
- [ ] `toolBarPlugin.normal`
- [ ] `toolBarPlugin.heading1`
- [ ] `toolBarPlugin.heading2`
- [ ] `toolBarPlugin.heading3`
- [ ] `toolBarPlugin.bulletedList`
- [ ] `toolBarPlugin.quoteBlock`
- [ ] `toolBarPlugin.codeBlock`
- [ ] `toolBarPlugin.textColor`
- [ ] `toolBarPlugin.backgroundColor`
- [ ] `toolBarPlugin.increaseFontSize`
- [ ] `toolBarPlugin.decreaseFontSize`
- [ ] `toolBarPlugin.generateConversation`
- [ ] `assignmentConfiguration.retryEnabled`
- [ ] `assignmentConfiguration.retryEnabledDescription`
- [ ] `configurationManager.setCoverVideo`
- [ ] `configurationManager.noCoverVideo`
- [ ] `configurationManager.coverVideoUrlPlaceholder`
- [ ] `configurationManager.coverVideoUrlLabel`
- [ ] `configurationManager.dragDropVideoPrompt`
- [ ] `configurationManager.uploadingVideo`
- [ ] `configurationManager.removeCoverVideo`
- [ ] `tabsVerticalLeft.tabs.campaign`

</details>

<details><summary><strong>ja</strong> (Japanese) — 23 missing — ⏳ Pending</summary>

- [ ] `toolBarPlugin.blockFormat`
- [ ] `toolBarPlugin.normal`
- [ ] `toolBarPlugin.heading1`
- [ ] `toolBarPlugin.heading2`
- [ ] `toolBarPlugin.heading3`
- [ ] `toolBarPlugin.bulletedList`
- [ ] `toolBarPlugin.quoteBlock`
- [ ] `toolBarPlugin.codeBlock`
- [ ] `toolBarPlugin.textColor`
- [ ] `toolBarPlugin.backgroundColor`
- [ ] `toolBarPlugin.increaseFontSize`
- [ ] `toolBarPlugin.decreaseFontSize`
- [ ] `toolBarPlugin.generateConversation`
- [ ] `assignmentConfiguration.retryEnabled`
- [ ] `assignmentConfiguration.retryEnabledDescription`
- [ ] `configurationManager.setCoverVideo`
- [ ] `configurationManager.noCoverVideo`
- [ ] `configurationManager.coverVideoUrlPlaceholder`
- [ ] `configurationManager.coverVideoUrlLabel`
- [ ] `configurationManager.dragDropVideoPrompt`
- [ ] `configurationManager.uploadingVideo`
- [ ] `configurationManager.removeCoverVideo`
- [ ] `tabsVerticalLeft.tabs.campaign`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 23 missing — ⏳ Pending</summary>

- [ ] `toolBarPlugin.blockFormat`
- [ ] `toolBarPlugin.normal`
- [ ] `toolBarPlugin.heading1`
- [ ] `toolBarPlugin.heading2`
- [ ] `toolBarPlugin.heading3`
- [ ] `toolBarPlugin.bulletedList`
- [ ] `toolBarPlugin.quoteBlock`
- [ ] `toolBarPlugin.codeBlock`
- [ ] `toolBarPlugin.textColor`
- [ ] `toolBarPlugin.backgroundColor`
- [ ] `toolBarPlugin.increaseFontSize`
- [ ] `toolBarPlugin.decreaseFontSize`
- [ ] `toolBarPlugin.generateConversation`
- [ ] `assignmentConfiguration.retryEnabled`
- [ ] `assignmentConfiguration.retryEnabledDescription`
- [ ] `configurationManager.setCoverVideo`
- [ ] `configurationManager.noCoverVideo`
- [ ] `configurationManager.coverVideoUrlPlaceholder`
- [ ] `configurationManager.coverVideoUrlLabel`
- [ ] `configurationManager.dragDropVideoPrompt`
- [ ] `configurationManager.uploadingVideo`
- [ ] `configurationManager.removeCoverVideo`
- [ ] `tabsVerticalLeft.tabs.campaign`

</details>

### `editor.files`

<details><summary><strong>de</strong> (German) — 1 missing — ⏳ Pending</summary>

- [ ] `fileManager2.toolbar.recordConversation`

</details>

<details><summary><strong>es</strong> (Spanish) — 1 missing — ⏳ Pending</summary>

- [ ] `fileManager2.toolbar.recordConversation`

</details>

<details><summary><strong>fr</strong> (French) — 1 missing — ⏳ Pending</summary>

- [ ] `fileManager2.toolbar.recordConversation`

</details>

<details><summary><strong>ja</strong> (Japanese) — 1 missing — ⏳ Pending</summary>

- [ ] `fileManager2.toolbar.recordConversation`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 1 missing — ⏳ Pending</summary>

- [ ] `fileManager2.toolbar.recordConversation`

</details>

### `editor.shared`

<details><summary><strong>de</strong> (German) — 7 missing — ⏳ Pending</summary>

- [ ] `micLevelIndicator.noSignal`
- [ ] `micLevelIndicator.noSignalShort`
- [ ] `micLevelIndicator.tooLow`
- [ ] `micLevelIndicator.tooLowShort`
- [ ] `autoSubmit.submittingInSeconds`
- [ ] `tableComponent.cellActionsLabel`
- [ ] `tableComponent.cellActionsTitle`

</details>

<details><summary><strong>es</strong> (Spanish) — 5 missing — ⏳ Pending</summary>

- [ ] `micLevelIndicator.noSignal`
- [ ] `micLevelIndicator.noSignalShort`
- [ ] `micLevelIndicator.tooLow`
- [ ] `micLevelIndicator.tooLowShort`
- [ ] `autoSubmit.submittingInSeconds`

</details>

<details><summary><strong>fr</strong> (French) — 5 missing — ⏳ Pending</summary>

- [ ] `micLevelIndicator.noSignal`
- [ ] `micLevelIndicator.noSignalShort`
- [ ] `micLevelIndicator.tooLow`
- [ ] `micLevelIndicator.tooLowShort`
- [ ] `autoSubmit.submittingInSeconds`

</details>

<details><summary><strong>ja</strong> (Japanese) — 5 missing — ⏳ Pending</summary>

- [ ] `micLevelIndicator.noSignal`
- [ ] `micLevelIndicator.noSignalShort`
- [ ] `micLevelIndicator.tooLow`
- [ ] `micLevelIndicator.tooLowShort`
- [ ] `autoSubmit.submittingInSeconds`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 5 missing — ⏳ Pending</summary>

- [ ] `micLevelIndicator.noSignal`
- [ ] `micLevelIndicator.noSignalShort`
- [ ] `micLevelIndicator.tooLow`
- [ ] `micLevelIndicator.tooLowShort`
- [ ] `autoSubmit.submittingInSeconds`

</details>

### `pages`

<details><summary><strong>de</strong> (German) — 100 missing — ⏳ Pending</summary>

- [ ] `squads.heading`
- [ ] `squads.description`
- [ ] `squads.selectSection`
- [ ] `squads.noSections`
- [ ] `squads.createSquad`
- [ ] `squads.squadPosts`
- [ ] `index.learningPathway`
- [ ] `settings.description`
- [ ] `settings.privacy.heading`
- [ ] `settings.privacy.leaderboardOptIn`
- [ ] `settings.privacy.leaderboardOptInHint`
- [ ] `settings.customization.heading`
- [ ] `settings.customization.description`
- [ ] `settings.botCustomizer.heading`
- [ ] `settings.botCustomizer.description`
- [ ] `settings.profileInfo.heading`
- [ ] `settings.profileInfo.description`
- [ ] `profile.progress`
- [ ] `profile.activity`
- [ ] `profile.badges`
- [ ] `profile.nailedItWall`
- [ ] `sectionDetail.setCoverVideo`
- [ ] `sectionDetail.noCoverVideo`
- [ ] `sectionDetail.coverVideoUrlPlaceholder`
- [ ] `sectionDetail.coverVideoUrlLabel`
- [ ] `sectionDetail.noCurve`
- [ ] `sectionDetail.completionGrid`
- [ ] `sectionDetail.noLeaderboardEntries`
- [ ] `sectionDetail.leaderboardEnabled`
- [ ] `sections.archive`
- [ ] `sections.unarchive`
- [ ] `sections.showArchived`
- [ ] `sections.archivedSuccess`
- [ ] `sections.unarchivedSuccess`
- [ ] `sections.archiveError`
- [ ] `units.tabMyUnits`
- [ ] `units.tabSharedWithMe`
- [ ] `units.tabCommunity`
- [ ] `units.forkUnit`
- [ ] `units.forking`
- [ ] `units.noSharedUnits`
- [ ] `units.noCommunityUnits`
- [ ] `units.forkSuccess`
- [ ] `units.forkError`
- [ ] `workbook.unitUpdated`
- [ ] `workbook.reload`
- [ ] `privacy.title`
- [ ] `privacy.lastUpdated`
- [ ] `privacy.introduction.heading`
- [ ] `privacy.introduction.content`
- [ ] `privacy.informationWeCollect.heading`
- [ ] `privacy.informationWeCollect.intro`
- [ ] `privacy.informationWeCollect.accountInfo`
- [ ] `privacy.informationWeCollect.accountInfoText`
- [ ] `privacy.informationWeCollect.learningData`
- [ ] `privacy.informationWeCollect.learningDataText`
- [ ] `privacy.informationWeCollect.userContent`
- [ ] `privacy.informationWeCollect.userContentText`
- [ ] `privacy.informationWeCollect.usageInfo`
- [ ] `privacy.informationWeCollect.usageInfoText`
- [ ] `privacy.howWeUseInfo.heading`
- [ ] `privacy.howWeUseInfo.intro`
- [ ] `privacy.howWeUseInfo.item1`
- [ ] `privacy.howWeUseInfo.item2`
- [ ] `privacy.howWeUseInfo.item3`
- [ ] `privacy.howWeUseInfo.item4`
- [ ] `privacy.howWeUseInfo.item5`
- [ ] `privacy.dataStorage.heading`
- [ ] `privacy.dataStorage.intro`
- [ ] `privacy.dataStorage.item1`
- [ ] `privacy.dataStorage.item2`
- [ ] `privacy.dataStorage.item3`
- [ ] `privacy.dataStorage.outro`
- [ ] `privacy.dataSharing.heading`
- [ ] `privacy.dataSharing.intro`
- [ ] `privacy.dataSharing.instructors`
- [ ] `privacy.dataSharing.instructorsText`
- [ ] `privacy.dataSharing.classmates`
- [ ] `privacy.dataSharing.classmatesText`
- [ ] `privacy.dataSharing.aiProcessing`
- [ ] `privacy.dataSharing.aiProcessingText`
- [ ] `privacy.dataSharing.legal`
- [ ] `privacy.dataSharing.legalText`
- [ ] `privacy.yourRights.heading`
- [ ] `privacy.yourRights.intro`
- [ ] `privacy.yourRights.item1`
- [ ] `privacy.yourRights.item2`
- [ ] `privacy.yourRights.item3`
- [ ] `privacy.yourRights.item4`
- [ ] `privacy.yourRights.item5`
- [ ] `privacy.yourRights.outro`
- [ ] `privacy.cookies.heading`
- [ ] `privacy.cookies.content`
- [ ] `privacy.childrensPrivacy.heading`
- [ ] `privacy.childrensPrivacy.content`
- [ ] `privacy.policyChanges.heading`
- [ ] `privacy.policyChanges.content`
- [ ] `privacy.contactUs.heading`
- [ ] `privacy.contactUs.content`
- [ ] `Peer Review`

</details>

<details><summary><strong>es</strong> (Spanish) — 103 missing — ⏳ Pending</summary>

- [ ] `squads.heading`
- [ ] `squads.description`
- [ ] `squads.selectSection`
- [ ] `squads.noSections`
- [ ] `squads.createSquad`
- [ ] `squads.squadPosts`
- [ ] `index.greetingMorning`
- [ ] `index.greetingAfternoon`
- [ ] `index.greetingEvening`
- [ ] `index.learningPathway`
- [ ] `settings.description`
- [ ] `settings.privacy.heading`
- [ ] `settings.privacy.leaderboardOptIn`
- [ ] `settings.privacy.leaderboardOptInHint`
- [ ] `settings.customization.heading`
- [ ] `settings.customization.description`
- [ ] `settings.botCustomizer.heading`
- [ ] `settings.botCustomizer.description`
- [ ] `settings.profileInfo.heading`
- [ ] `settings.profileInfo.description`
- [ ] `profile.progress`
- [ ] `profile.activity`
- [ ] `profile.badges`
- [ ] `profile.nailedItWall`
- [ ] `sectionDetail.setCoverVideo`
- [ ] `sectionDetail.noCoverVideo`
- [ ] `sectionDetail.coverVideoUrlPlaceholder`
- [ ] `sectionDetail.coverVideoUrlLabel`
- [ ] `sectionDetail.noCurve`
- [ ] `sectionDetail.completionGrid`
- [ ] `sectionDetail.noLeaderboardEntries`
- [ ] `sectionDetail.leaderboardEnabled`
- [ ] `sections.archive`
- [ ] `sections.unarchive`
- [ ] `sections.showArchived`
- [ ] `sections.archivedSuccess`
- [ ] `sections.unarchivedSuccess`
- [ ] `sections.archiveError`
- [ ] `units.tabMyUnits`
- [ ] `units.tabSharedWithMe`
- [ ] `units.tabCommunity`
- [ ] `units.forkUnit`
- [ ] `units.forking`
- [ ] `units.noSharedUnits`
- [ ] `units.noCommunityUnits`
- [ ] `units.forkSuccess`
- [ ] `units.forkError`
- [ ] `workbook.unitUpdated`
- [ ] `workbook.reload`
- [ ] `privacy.title`
- [ ] `privacy.lastUpdated`
- [ ] `privacy.introduction.heading`
- [ ] `privacy.introduction.content`
- [ ] `privacy.informationWeCollect.heading`
- [ ] `privacy.informationWeCollect.intro`
- [ ] `privacy.informationWeCollect.accountInfo`
- [ ] `privacy.informationWeCollect.accountInfoText`
- [ ] `privacy.informationWeCollect.learningData`
- [ ] `privacy.informationWeCollect.learningDataText`
- [ ] `privacy.informationWeCollect.userContent`
- [ ] `privacy.informationWeCollect.userContentText`
- [ ] `privacy.informationWeCollect.usageInfo`
- [ ] `privacy.informationWeCollect.usageInfoText`
- [ ] `privacy.howWeUseInfo.heading`
- [ ] `privacy.howWeUseInfo.intro`
- [ ] `privacy.howWeUseInfo.item1`
- [ ] `privacy.howWeUseInfo.item2`
- [ ] `privacy.howWeUseInfo.item3`
- [ ] `privacy.howWeUseInfo.item4`
- [ ] `privacy.howWeUseInfo.item5`
- [ ] `privacy.dataStorage.heading`
- [ ] `privacy.dataStorage.intro`
- [ ] `privacy.dataStorage.item1`
- [ ] `privacy.dataStorage.item2`
- [ ] `privacy.dataStorage.item3`
- [ ] `privacy.dataStorage.outro`
- [ ] `privacy.dataSharing.heading`
- [ ] `privacy.dataSharing.intro`
- [ ] `privacy.dataSharing.instructors`
- [ ] `privacy.dataSharing.instructorsText`
- [ ] `privacy.dataSharing.classmates`
- [ ] `privacy.dataSharing.classmatesText`
- [ ] `privacy.dataSharing.aiProcessing`
- [ ] `privacy.dataSharing.aiProcessingText`
- [ ] `privacy.dataSharing.legal`
- [ ] `privacy.dataSharing.legalText`
- [ ] `privacy.yourRights.heading`
- [ ] `privacy.yourRights.intro`
- [ ] `privacy.yourRights.item1`
- [ ] `privacy.yourRights.item2`
- [ ] `privacy.yourRights.item3`
- [ ] `privacy.yourRights.item4`
- [ ] `privacy.yourRights.item5`
- [ ] `privacy.yourRights.outro`
- [ ] `privacy.cookies.heading`
- [ ] `privacy.cookies.content`
- [ ] `privacy.childrensPrivacy.heading`
- [ ] `privacy.childrensPrivacy.content`
- [ ] `privacy.policyChanges.heading`
- [ ] `privacy.policyChanges.content`
- [ ] `privacy.contactUs.heading`
- [ ] `privacy.contactUs.content`
- [ ] `Peer Review`

</details>

<details><summary><strong>fr</strong> (French) — 100 missing — ⏳ Pending</summary>

- [ ] `squads.heading`
- [ ] `squads.description`
- [ ] `squads.selectSection`
- [ ] `squads.noSections`
- [ ] `squads.createSquad`
- [ ] `squads.squadPosts`
- [ ] `index.learningPathway`
- [ ] `settings.description`
- [ ] `settings.privacy.heading`
- [ ] `settings.privacy.leaderboardOptIn`
- [ ] `settings.privacy.leaderboardOptInHint`
- [ ] `settings.customization.heading`
- [ ] `settings.customization.description`
- [ ] `settings.botCustomizer.heading`
- [ ] `settings.botCustomizer.description`
- [ ] `settings.profileInfo.heading`
- [ ] `settings.profileInfo.description`
- [ ] `profile.progress`
- [ ] `profile.activity`
- [ ] `profile.badges`
- [ ] `profile.nailedItWall`
- [ ] `sectionDetail.setCoverVideo`
- [ ] `sectionDetail.noCoverVideo`
- [ ] `sectionDetail.coverVideoUrlPlaceholder`
- [ ] `sectionDetail.coverVideoUrlLabel`
- [ ] `sectionDetail.noCurve`
- [ ] `sectionDetail.completionGrid`
- [ ] `sectionDetail.noLeaderboardEntries`
- [ ] `sectionDetail.leaderboardEnabled`
- [ ] `sections.archive`
- [ ] `sections.unarchive`
- [ ] `sections.showArchived`
- [ ] `sections.archivedSuccess`
- [ ] `sections.unarchivedSuccess`
- [ ] `sections.archiveError`
- [ ] `units.tabMyUnits`
- [ ] `units.tabSharedWithMe`
- [ ] `units.tabCommunity`
- [ ] `units.forkUnit`
- [ ] `units.forking`
- [ ] `units.noSharedUnits`
- [ ] `units.noCommunityUnits`
- [ ] `units.forkSuccess`
- [ ] `units.forkError`
- [ ] `workbook.unitUpdated`
- [ ] `workbook.reload`
- [ ] `privacy.title`
- [ ] `privacy.lastUpdated`
- [ ] `privacy.introduction.heading`
- [ ] `privacy.introduction.content`
- [ ] `privacy.informationWeCollect.heading`
- [ ] `privacy.informationWeCollect.intro`
- [ ] `privacy.informationWeCollect.accountInfo`
- [ ] `privacy.informationWeCollect.accountInfoText`
- [ ] `privacy.informationWeCollect.learningData`
- [ ] `privacy.informationWeCollect.learningDataText`
- [ ] `privacy.informationWeCollect.userContent`
- [ ] `privacy.informationWeCollect.userContentText`
- [ ] `privacy.informationWeCollect.usageInfo`
- [ ] `privacy.informationWeCollect.usageInfoText`
- [ ] `privacy.howWeUseInfo.heading`
- [ ] `privacy.howWeUseInfo.intro`
- [ ] `privacy.howWeUseInfo.item1`
- [ ] `privacy.howWeUseInfo.item2`
- [ ] `privacy.howWeUseInfo.item3`
- [ ] `privacy.howWeUseInfo.item4`
- [ ] `privacy.howWeUseInfo.item5`
- [ ] `privacy.dataStorage.heading`
- [ ] `privacy.dataStorage.intro`
- [ ] `privacy.dataStorage.item1`
- [ ] `privacy.dataStorage.item2`
- [ ] `privacy.dataStorage.item3`
- [ ] `privacy.dataStorage.outro`
- [ ] `privacy.dataSharing.heading`
- [ ] `privacy.dataSharing.intro`
- [ ] `privacy.dataSharing.instructors`
- [ ] `privacy.dataSharing.instructorsText`
- [ ] `privacy.dataSharing.classmates`
- [ ] `privacy.dataSharing.classmatesText`
- [ ] `privacy.dataSharing.aiProcessing`
- [ ] `privacy.dataSharing.aiProcessingText`
- [ ] `privacy.dataSharing.legal`
- [ ] `privacy.dataSharing.legalText`
- [ ] `privacy.yourRights.heading`
- [ ] `privacy.yourRights.intro`
- [ ] `privacy.yourRights.item1`
- [ ] `privacy.yourRights.item2`
- [ ] `privacy.yourRights.item3`
- [ ] `privacy.yourRights.item4`
- [ ] `privacy.yourRights.item5`
- [ ] `privacy.yourRights.outro`
- [ ] `privacy.cookies.heading`
- [ ] `privacy.cookies.content`
- [ ] `privacy.childrensPrivacy.heading`
- [ ] `privacy.childrensPrivacy.content`
- [ ] `privacy.policyChanges.heading`
- [ ] `privacy.policyChanges.content`
- [ ] `privacy.contactUs.heading`
- [ ] `privacy.contactUs.content`
- [ ] `Peer Review`

</details>

<details><summary><strong>ja</strong> (Japanese) — 103 missing — ⏳ Pending</summary>

- [ ] `squads.heading`
- [ ] `squads.description`
- [ ] `squads.selectSection`
- [ ] `squads.noSections`
- [ ] `squads.createSquad`
- [ ] `squads.squadPosts`
- [ ] `index.greetingMorning`
- [ ] `index.greetingAfternoon`
- [ ] `index.greetingEvening`
- [ ] `index.learningPathway`
- [ ] `settings.description`
- [ ] `settings.privacy.heading`
- [ ] `settings.privacy.leaderboardOptIn`
- [ ] `settings.privacy.leaderboardOptInHint`
- [ ] `settings.customization.heading`
- [ ] `settings.customization.description`
- [ ] `settings.botCustomizer.heading`
- [ ] `settings.botCustomizer.description`
- [ ] `settings.profileInfo.heading`
- [ ] `settings.profileInfo.description`
- [ ] `profile.progress`
- [ ] `profile.activity`
- [ ] `profile.badges`
- [ ] `profile.nailedItWall`
- [ ] `sectionDetail.setCoverVideo`
- [ ] `sectionDetail.noCoverVideo`
- [ ] `sectionDetail.coverVideoUrlPlaceholder`
- [ ] `sectionDetail.coverVideoUrlLabel`
- [ ] `sectionDetail.noCurve`
- [ ] `sectionDetail.completionGrid`
- [ ] `sectionDetail.noLeaderboardEntries`
- [ ] `sectionDetail.leaderboardEnabled`
- [ ] `sections.archive`
- [ ] `sections.unarchive`
- [ ] `sections.showArchived`
- [ ] `sections.archivedSuccess`
- [ ] `sections.unarchivedSuccess`
- [ ] `sections.archiveError`
- [ ] `units.tabMyUnits`
- [ ] `units.tabSharedWithMe`
- [ ] `units.tabCommunity`
- [ ] `units.forkUnit`
- [ ] `units.forking`
- [ ] `units.noSharedUnits`
- [ ] `units.noCommunityUnits`
- [ ] `units.forkSuccess`
- [ ] `units.forkError`
- [ ] `workbook.unitUpdated`
- [ ] `workbook.reload`
- [ ] `privacy.title`
- [ ] `privacy.lastUpdated`
- [ ] `privacy.introduction.heading`
- [ ] `privacy.introduction.content`
- [ ] `privacy.informationWeCollect.heading`
- [ ] `privacy.informationWeCollect.intro`
- [ ] `privacy.informationWeCollect.accountInfo`
- [ ] `privacy.informationWeCollect.accountInfoText`
- [ ] `privacy.informationWeCollect.learningData`
- [ ] `privacy.informationWeCollect.learningDataText`
- [ ] `privacy.informationWeCollect.userContent`
- [ ] `privacy.informationWeCollect.userContentText`
- [ ] `privacy.informationWeCollect.usageInfo`
- [ ] `privacy.informationWeCollect.usageInfoText`
- [ ] `privacy.howWeUseInfo.heading`
- [ ] `privacy.howWeUseInfo.intro`
- [ ] `privacy.howWeUseInfo.item1`
- [ ] `privacy.howWeUseInfo.item2`
- [ ] `privacy.howWeUseInfo.item3`
- [ ] `privacy.howWeUseInfo.item4`
- [ ] `privacy.howWeUseInfo.item5`
- [ ] `privacy.dataStorage.heading`
- [ ] `privacy.dataStorage.intro`
- [ ] `privacy.dataStorage.item1`
- [ ] `privacy.dataStorage.item2`
- [ ] `privacy.dataStorage.item3`
- [ ] `privacy.dataStorage.outro`
- [ ] `privacy.dataSharing.heading`
- [ ] `privacy.dataSharing.intro`
- [ ] `privacy.dataSharing.instructors`
- [ ] `privacy.dataSharing.instructorsText`
- [ ] `privacy.dataSharing.classmates`
- [ ] `privacy.dataSharing.classmatesText`
- [ ] `privacy.dataSharing.aiProcessing`
- [ ] `privacy.dataSharing.aiProcessingText`
- [ ] `privacy.dataSharing.legal`
- [ ] `privacy.dataSharing.legalText`
- [ ] `privacy.yourRights.heading`
- [ ] `privacy.yourRights.intro`
- [ ] `privacy.yourRights.item1`
- [ ] `privacy.yourRights.item2`
- [ ] `privacy.yourRights.item3`
- [ ] `privacy.yourRights.item4`
- [ ] `privacy.yourRights.item5`
- [ ] `privacy.yourRights.outro`
- [ ] `privacy.cookies.heading`
- [ ] `privacy.cookies.content`
- [ ] `privacy.childrensPrivacy.heading`
- [ ] `privacy.childrensPrivacy.content`
- [ ] `privacy.policyChanges.heading`
- [ ] `privacy.policyChanges.content`
- [ ] `privacy.contactUs.heading`
- [ ] `privacy.contactUs.content`
- [ ] `Peer Review`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 100 missing — ⏳ Pending</summary>

- [ ] `squads.heading`
- [ ] `squads.description`
- [ ] `squads.selectSection`
- [ ] `squads.noSections`
- [ ] `squads.createSquad`
- [ ] `squads.squadPosts`
- [ ] `index.learningPathway`
- [ ] `settings.description`
- [ ] `settings.privacy.heading`
- [ ] `settings.privacy.leaderboardOptIn`
- [ ] `settings.privacy.leaderboardOptInHint`
- [ ] `settings.customization.heading`
- [ ] `settings.customization.description`
- [ ] `settings.botCustomizer.heading`
- [ ] `settings.botCustomizer.description`
- [ ] `settings.profileInfo.heading`
- [ ] `settings.profileInfo.description`
- [ ] `profile.progress`
- [ ] `profile.activity`
- [ ] `profile.badges`
- [ ] `profile.nailedItWall`
- [ ] `sectionDetail.setCoverVideo`
- [ ] `sectionDetail.noCoverVideo`
- [ ] `sectionDetail.coverVideoUrlPlaceholder`
- [ ] `sectionDetail.coverVideoUrlLabel`
- [ ] `sectionDetail.noCurve`
- [ ] `sectionDetail.completionGrid`
- [ ] `sectionDetail.noLeaderboardEntries`
- [ ] `sectionDetail.leaderboardEnabled`
- [ ] `sections.archive`
- [ ] `sections.unarchive`
- [ ] `sections.showArchived`
- [ ] `sections.archivedSuccess`
- [ ] `sections.unarchivedSuccess`
- [ ] `sections.archiveError`
- [ ] `units.tabMyUnits`
- [ ] `units.tabSharedWithMe`
- [ ] `units.tabCommunity`
- [ ] `units.forkUnit`
- [ ] `units.forking`
- [ ] `units.noSharedUnits`
- [ ] `units.noCommunityUnits`
- [ ] `units.forkSuccess`
- [ ] `units.forkError`
- [ ] `workbook.unitUpdated`
- [ ] `workbook.reload`
- [ ] `privacy.title`
- [ ] `privacy.lastUpdated`
- [ ] `privacy.introduction.heading`
- [ ] `privacy.introduction.content`
- [ ] `privacy.informationWeCollect.heading`
- [ ] `privacy.informationWeCollect.intro`
- [ ] `privacy.informationWeCollect.accountInfo`
- [ ] `privacy.informationWeCollect.accountInfoText`
- [ ] `privacy.informationWeCollect.learningData`
- [ ] `privacy.informationWeCollect.learningDataText`
- [ ] `privacy.informationWeCollect.userContent`
- [ ] `privacy.informationWeCollect.userContentText`
- [ ] `privacy.informationWeCollect.usageInfo`
- [ ] `privacy.informationWeCollect.usageInfoText`
- [ ] `privacy.howWeUseInfo.heading`
- [ ] `privacy.howWeUseInfo.intro`
- [ ] `privacy.howWeUseInfo.item1`
- [ ] `privacy.howWeUseInfo.item2`
- [ ] `privacy.howWeUseInfo.item3`
- [ ] `privacy.howWeUseInfo.item4`
- [ ] `privacy.howWeUseInfo.item5`
- [ ] `privacy.dataStorage.heading`
- [ ] `privacy.dataStorage.intro`
- [ ] `privacy.dataStorage.item1`
- [ ] `privacy.dataStorage.item2`
- [ ] `privacy.dataStorage.item3`
- [ ] `privacy.dataStorage.outro`
- [ ] `privacy.dataSharing.heading`
- [ ] `privacy.dataSharing.intro`
- [ ] `privacy.dataSharing.instructors`
- [ ] `privacy.dataSharing.instructorsText`
- [ ] `privacy.dataSharing.classmates`
- [ ] `privacy.dataSharing.classmatesText`
- [ ] `privacy.dataSharing.aiProcessing`
- [ ] `privacy.dataSharing.aiProcessingText`
- [ ] `privacy.dataSharing.legal`
- [ ] `privacy.dataSharing.legalText`
- [ ] `privacy.yourRights.heading`
- [ ] `privacy.yourRights.intro`
- [ ] `privacy.yourRights.item1`
- [ ] `privacy.yourRights.item2`
- [ ] `privacy.yourRights.item3`
- [ ] `privacy.yourRights.item4`
- [ ] `privacy.yourRights.item5`
- [ ] `privacy.yourRights.outro`
- [ ] `privacy.cookies.heading`
- [ ] `privacy.cookies.content`
- [ ] `privacy.childrensPrivacy.heading`
- [ ] `privacy.childrensPrivacy.content`
- [ ] `privacy.policyChanges.heading`
- [ ] `privacy.policyChanges.content`
- [ ] `privacy.contactUs.heading`
- [ ] `privacy.contactUs.content`
- [ ] `Peer Review`

</details>

### `workbook`

<details><summary><strong>de</strong> (German) — 2 missing — ⏳ Pending</summary>

- [ ] `answerComponent.inputMethodSelector`
- [ ] `answerComponent.placeholder`

</details>

<details><summary><strong>es</strong> (Spanish) — 35 missing — ⏳ Pending</summary>

- [ ] `answerComponent.inputMethodSelector`
- [ ] `answerComponent.noDictionaryAvailable`
- [ ] `answerComponent.placeholder`
- [ ] `customAnswerComponent.answerPlaceholder`
- [ ] `customAnswerComponent.answerQuestions`
- [ ] `customAnswerComponent.audioQuestion`
- [ ] `customAnswerComponent.completedQuestion`
- [ ] `customAnswerComponent.errorOccurred`
- [ ] `customAnswerComponent.promptNotAvailable`
- [ ] `customAnswerComponent.yourAnswer`
- [ ] `gradeHistory.title`
- [ ] `gradeHistory.noAttempts`
- [ ] `gradeHistory.completeFirstAttempt`
- [ ] `gradeHistory.attempts`
- [ ] `gradeHistory.trend.up`
- [ ] `gradeHistory.trend.down`
- [ ] `gradeHistory.trend.flat`
- [ ] `gradeHistory.bestScore`
- [ ] `gradeHistory.averageScore`
- [ ] `gradeHistory.recentAttempts`
- [ ] `gradeHistory.complete`
- [ ] `gradeHistory.best`
- [ ] `workbookSettings.displayPreferences`
- [ ] `workbookSettings.highContrastMode`
- [ ] `workbookSettings.highContrastModeDescription`
- [ ] `workbookSettings.reducedMotion`
- [ ] `workbookSettings.reducedMotionDescription`
- [ ] `workbookSettings.audioPreferences`
- [ ] `workbookSettings.autoPlayAudio`
- [ ] `workbookSettings.autoPlayAudioDescription`
- [ ] `workbookSettings.showWaveforms`
- [ ] `workbookSettings.showWaveformsDescription`
- [ ] `workbookSettings.feedbackPreferences`
- [ ] `workbookSettings.immediateFeedback`
- [ ] `workbookSettings.immediateFeedbackDescription`

</details>

<details><summary><strong>fr</strong> (French) — 2 missing — ⏳ Pending</summary>

- [ ] `answerComponent.inputMethodSelector`
- [ ] `answerComponent.placeholder`

</details>

<details><summary><strong>ja</strong> (Japanese) — 27 missing — ⏳ Pending</summary>

- [ ] `answerComponent.inputMethodSelector`
- [ ] `answerComponent.placeholder`
- [ ] `gradeHistory.title`
- [ ] `gradeHistory.noAttempts`
- [ ] `gradeHistory.completeFirstAttempt`
- [ ] `gradeHistory.attempts`
- [ ] `gradeHistory.trend.up`
- [ ] `gradeHistory.trend.down`
- [ ] `gradeHistory.trend.flat`
- [ ] `gradeHistory.bestScore`
- [ ] `gradeHistory.averageScore`
- [ ] `gradeHistory.recentAttempts`
- [ ] `gradeHistory.complete`
- [ ] `gradeHistory.best`
- [ ] `workbookSettings.displayPreferences`
- [ ] `workbookSettings.highContrastMode`
- [ ] `workbookSettings.highContrastModeDescription`
- [ ] `workbookSettings.reducedMotion`
- [ ] `workbookSettings.reducedMotionDescription`
- [ ] `workbookSettings.audioPreferences`
- [ ] `workbookSettings.autoPlayAudio`
- [ ] `workbookSettings.autoPlayAudioDescription`
- [ ] `workbookSettings.showWaveforms`
- [ ] `workbookSettings.showWaveformsDescription`
- [ ] `workbookSettings.feedbackPreferences`
- [ ] `workbookSettings.immediateFeedback`
- [ ] `workbookSettings.immediateFeedbackDescription`

</details>

<details><summary><strong>zh</strong> (Chinese (Simplified)) — 2 missing — ⏳ Pending</summary>

- [ ] `answerComponent.inputMethodSelector`
- [ ] `answerComponent.placeholder`

</details>

