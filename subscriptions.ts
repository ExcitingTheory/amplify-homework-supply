/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAIFeedback = /* GraphQL */ `subscription OnCreateAIFeedback(
  $filter: ModelSubscriptionAIFeedbackFilterInput
  $owner: String
) {
  onCreateAIFeedback(filter: $filter, owner: $owner) {
    comment
    contentType
    createdAt
    documentID
    feedbackType
    generatedContent
    gradeID
    id
    identityId
    messageId
    metadata
    model
    owner
    prompt
    reasons
    sessionId
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAIFeedbackSubscriptionVariables,
  APITypes.OnCreateAIFeedbackSubscription
>;
export const onCreateAgentJob = /* GraphQL */ `subscription OnCreateAgentJob(
  $filter: ModelSubscriptionAgentJobFilterInput
  $owner: String
) {
  onCreateAgentJob(filter: $filter, owner: $owner) {
    completedAt
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    error
    estimatedCost
    id
    identityId
    metadata
    modelUsed
    owner
    responseId
    retryCount
    startedAt
    status
    tokensUsed
    type
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    webhookData
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAgentJobSubscriptionVariables,
  APITypes.OnCreateAgentJobSubscription
>;
export const onCreateAssignment = /* GraphQL */ `subscription OnCreateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
  $owner: String
) {
  onCreateAssignment(filter: $filter, owner: $owner) {
    createdAt
    dueDate
    id
    learner
    owner
    readableGroups
    section {
      backgroundColor
      code
      createdAt
      curveAssignments
      curveEnabled
      curveMethod
      description
      featuredImage
      id
      identityId
      instructor
      learner
      name
      owner
      readableGroups
      status
      thumbnail
      updatedAt
      writableGroups
      __typename
    }
    sectionID
    status
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    writableGroups
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAssignmentSubscriptionVariables,
  APITypes.OnCreateAssignmentSubscription
>;
export const onCreateAssistantChat = /* GraphQL */ `subscription OnCreateAssistantChat(
  $filter: ModelSubscriptionAssistantChatFilterInput
  $owner: String
) {
  onCreateAssistantChat(filter: $filter, owner: $owner) {
    additionalInstructions
    archived
    chatFiles {
      nextToken
      __typename
    }
    createdAt
    draft
    id
    inputTokens
    messages
    model
    moderationFlag
    outputTokens
    owner
    threadId
    threadInstructions
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAssistantChatSubscriptionVariables,
  APITypes.OnCreateAssistantChatSubscription
>;
export const onCreateAssistantChatFile = /* GraphQL */ `subscription OnCreateAssistantChatFile(
  $filter: ModelSubscriptionAssistantChatFileFilterInput
  $owner: String
) {
  onCreateAssistantChatFile(filter: $filter, owner: $owner) {
    chat {
      additionalInstructions
      archived
      createdAt
      draft
      id
      inputTokens
      messages
      model
      moderationFlag
      outputTokens
      owner
      threadId
      threadInstructions
      updatedAt
      __typename
    }
    chatID
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAssistantChatFileSubscriptionVariables,
  APITypes.OnCreateAssistantChatFileSubscription
>;
export const onCreateDocument = /* GraphQL */ `subscription OnCreateDocument(
  $filter: ModelSubscriptionDocumentFilterInput
  $owner: String
) {
  onCreateDocument(filter: $filter, owner: $owner) {
    agentJobs {
      nextToken
      __typename
    }
    createdAt
    documentQuestions {
      nextToken
      __typename
    }
    documentWords {
      nextToken
      __typename
    }
    extractedText
    fileSize
    filename
    files {
      nextToken
      __typename
    }
    id
    identityId
    learner
    metadata
    mimeType
    owner
    pageCount
    parsedContent {
      nextToken
      __typename
    }
    readableGroups
    resumeState
    s3Key
    sectionID
    status
    unitDocuments {
      nextToken
      __typename
    }
    updatedAt
    uploadedAt
    writableGroups
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDocumentSubscriptionVariables,
  APITypes.OnCreateDocumentSubscription
>;
export const onCreateDocumentQuestion = /* GraphQL */ `subscription OnCreateDocumentQuestion(
  $filter: ModelSubscriptionDocumentQuestionFilterInput
  $owner: String
) {
  onCreateDocumentQuestion(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDocumentQuestionSubscriptionVariables,
  APITypes.OnCreateDocumentQuestionSubscription
>;
export const onCreateDocumentWord = /* GraphQL */ `subscription OnCreateDocumentWord(
  $filter: ModelSubscriptionDocumentWordFilterInput
  $owner: String
) {
  onCreateDocumentWord(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDocumentWordSubscriptionVariables,
  APITypes.OnCreateDocumentWordSubscription
>;
export const onCreateFile = /* GraphQL */ `subscription OnCreateFile(
  $filter: ModelSubscriptionFileFilterInput
  $owner: String
) {
  onCreateFile(filter: $filter, owner: $owner) {
    byHex
    chatFiles {
      nextToken
      __typename
    }
    createdAt
    description
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    duration
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    generated
    hex
    id
    identityId
    level
    mimeType
    model
    name
    owner
    parsedContent {
      nextToken
      __typename
    }
    path
    prompt
    questionFiles {
      nextToken
      __typename
    }
    size
    thumbnail
    unitFiles {
      nextToken
      __typename
    }
    updatedAt
    variant
    waveformData
    wordFiles {
      nextToken
      __typename
    }
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateFileSubscriptionVariables,
  APITypes.OnCreateFileSubscription
>;
export const onCreateGrade = /* GraphQL */ `subscription OnCreateGrade(
  $filter: ModelSubscriptionGradeFilterInput
  $owner: String
) {
  onCreateGrade(filter: $filter, owner: $owner) {
    accuracy
    complete
    createdAt
    data
    feedback
    files
    id
    identityId
    instructor
    instructorGroup
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    percentComplete
    sectionID
    timerStarted
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    unitVersion
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateGradeSubscriptionVariables,
  APITypes.OnCreateGradeSubscription
>;
export const onCreateParsedContent = /* GraphQL */ `subscription OnCreateParsedContent(
  $filter: ModelSubscriptionParsedContentFilterInput
  $owner: String
) {
  onCreateParsedContent(filter: $filter, owner: $owner) {
    conceptsJSON
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    identityId
    importedAt
    metadata
    modelUsed
    objectivesJSON
    owner
    processingTime
    questionsJSON
    responseId
    summariesJSON
    tokensUsed
    updatedAt
    vocabularyJSON
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateParsedContentSubscriptionVariables,
  APITypes.OnCreateParsedContentSubscription
>;
export const onCreateQuestion = /* GraphQL */ `subscription OnCreateQuestion(
  $filter: ModelSubscriptionQuestionFilterInput
  $owner: String
) {
  onCreateQuestion(filter: $filter, owner: $owner) {
    answer
    answerAudio
    answerAudioWaveformData
    audio
    audioWaveformData
    byPromptHex
    choices
    createdAt
    difficulty
    documentQuestions {
      nextToken
      __typename
    }
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    generated
    hint
    id
    identityId
    importedAt
    metadata
    model
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    prompt
    promptHex
    questionFiles {
      nextToken
      __typename
    }
    questionUnits {
      nextToken
      __typename
    }
    questionWords {
      nextToken
      __typename
    }
    thumbnail
    updatedAt
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuestionSubscriptionVariables,
  APITypes.OnCreateQuestionSubscription
>;
export const onCreateQuestionFile = /* GraphQL */ `subscription OnCreateQuestionFile(
  $filter: ModelSubscriptionQuestionFileFilterInput
  $owner: String
) {
  onCreateQuestionFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuestionFileSubscriptionVariables,
  APITypes.OnCreateQuestionFileSubscription
>;
export const onCreateQuestionUnit = /* GraphQL */ `subscription OnCreateQuestionUnit(
  $filter: ModelSubscriptionQuestionUnitFilterInput
  $owner: String
) {
  onCreateQuestionUnit(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuestionUnitSubscriptionVariables,
  APITypes.OnCreateQuestionUnitSubscription
>;
export const onCreateQuestionWord = /* GraphQL */ `subscription OnCreateQuestionWord(
  $filter: ModelSubscriptionQuestionWordFilterInput
  $owner: String
) {
  onCreateQuestionWord(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuestionWordSubscriptionVariables,
  APITypes.OnCreateQuestionWordSubscription
>;
export const onCreateSection = /* GraphQL */ `subscription OnCreateSection(
  $filter: ModelSubscriptionSectionFilterInput
  $owner: String
) {
  onCreateSection(filter: $filter, owner: $owner) {
    assignments {
      nextToken
      __typename
    }
    backgroundColor
    code
    createdAt
    curveAssignments
    curveEnabled
    curveMethod
    description
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    featuredImage
    id
    identityId
    instructor
    learner
    name
    owner
    readableGroups
    status
    thumbnail
    updatedAt
    writableGroups
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateSectionSubscriptionVariables,
  APITypes.OnCreateSectionSubscription
>;
export const onCreateSettings = /* GraphQL */ `subscription OnCreateSettings(
  $filter: ModelSubscriptionSettingsFilterInput
  $owner: String
) {
  onCreateSettings(filter: $filter, owner: $owner) {
    assistantVoice
    autoAnalyzeDocuments
    createdAt
    defaultAIModel
    documentAnalysisModel
    editorFontSize
    editorTheme
    emailNotifications
    id
    identityId
    language
    metadata
    owner
    timezone
    updatedAt
    webhookNotifications
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateSettingsSubscriptionVariables,
  APITypes.OnCreateSettingsSubscription
>;
export const onCreateUnit = /* GraphQL */ `subscription OnCreateUnit(
  $filter: ModelSubscriptionUnitFilterInput
  $owner: String
) {
  onCreateUnit(filter: $filter, owner: $owner) {
    agentJobs {
      nextToken
      __typename
    }
    assignments {
      nextToken
      __typename
    }
    createdAt
    data
    description
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    featuredImage
    grades {
      nextToken
      __typename
    }
    id
    identityId
    isDraft
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    name
    number
    owner
    publishedAt
    questionUnits {
      nextToken
      __typename
    }
    readableGroups
    status
    thumbnail
    timeLimitSeconds
    unitDocuments {
      nextToken
      __typename
    }
    unitFiles {
      nextToken
      __typename
    }
    unitWords {
      nextToken
      __typename
    }
    updatedAt
    writableGroups
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUnitSubscriptionVariables,
  APITypes.OnCreateUnitSubscription
>;
export const onCreateUnitDocument = /* GraphQL */ `subscription OnCreateUnitDocument(
  $filter: ModelSubscriptionUnitDocumentFilterInput
  $owner: String
) {
  onCreateUnitDocument(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUnitDocumentSubscriptionVariables,
  APITypes.OnCreateUnitDocumentSubscription
>;
export const onCreateUnitFile = /* GraphQL */ `subscription OnCreateUnitFile(
  $filter: ModelSubscriptionUnitFileFilterInput
  $owner: String
) {
  onCreateUnitFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUnitFileSubscriptionVariables,
  APITypes.OnCreateUnitFileSubscription
>;
export const onCreateUnitWord = /* GraphQL */ `subscription OnCreateUnitWord(
  $filter: ModelSubscriptionUnitWordFilterInput
  $owner: String
) {
  onCreateUnitWord(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUnitWordSubscriptionVariables,
  APITypes.OnCreateUnitWordSubscription
>;
export const onCreateWord = /* GraphQL */ `subscription OnCreateWord(
  $filter: ModelSubscriptionWordFilterInput
  $owner: String
) {
  onCreateWord(filter: $filter, owner: $owner) {
    audio
    createdAt
    definition
    definitionAudio
    definitionWaveformData
    documentWords {
      nextToken
      __typename
    }
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    id
    identityId
    importedAt
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    phrase
    pronunciation
    questionWords {
      nextToken
      __typename
    }
    rubyTags
    unitWords {
      nextToken
      __typename
    }
    updatedAt
    waveformData
    wordFiles {
      nextToken
      __typename
    }
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateWordSubscriptionVariables,
  APITypes.OnCreateWordSubscription
>;
export const onCreateWordFile = /* GraphQL */ `subscription OnCreateWordFile(
  $filter: ModelSubscriptionWordFileFilterInput
  $owner: String
) {
  onCreateWordFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateWordFileSubscriptionVariables,
  APITypes.OnCreateWordFileSubscription
>;
export const onDeleteAIFeedback = /* GraphQL */ `subscription OnDeleteAIFeedback(
  $filter: ModelSubscriptionAIFeedbackFilterInput
  $owner: String
) {
  onDeleteAIFeedback(filter: $filter, owner: $owner) {
    comment
    contentType
    createdAt
    documentID
    feedbackType
    generatedContent
    gradeID
    id
    identityId
    messageId
    metadata
    model
    owner
    prompt
    reasons
    sessionId
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAIFeedbackSubscriptionVariables,
  APITypes.OnDeleteAIFeedbackSubscription
>;
export const onDeleteAgentJob = /* GraphQL */ `subscription OnDeleteAgentJob(
  $filter: ModelSubscriptionAgentJobFilterInput
  $owner: String
) {
  onDeleteAgentJob(filter: $filter, owner: $owner) {
    completedAt
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    error
    estimatedCost
    id
    identityId
    metadata
    modelUsed
    owner
    responseId
    retryCount
    startedAt
    status
    tokensUsed
    type
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    webhookData
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAgentJobSubscriptionVariables,
  APITypes.OnDeleteAgentJobSubscription
>;
export const onDeleteAssignment = /* GraphQL */ `subscription OnDeleteAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
  $owner: String
) {
  onDeleteAssignment(filter: $filter, owner: $owner) {
    createdAt
    dueDate
    id
    learner
    owner
    readableGroups
    section {
      backgroundColor
      code
      createdAt
      curveAssignments
      curveEnabled
      curveMethod
      description
      featuredImage
      id
      identityId
      instructor
      learner
      name
      owner
      readableGroups
      status
      thumbnail
      updatedAt
      writableGroups
      __typename
    }
    sectionID
    status
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    writableGroups
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAssignmentSubscriptionVariables,
  APITypes.OnDeleteAssignmentSubscription
>;
export const onDeleteAssistantChat = /* GraphQL */ `subscription OnDeleteAssistantChat(
  $filter: ModelSubscriptionAssistantChatFilterInput
  $owner: String
) {
  onDeleteAssistantChat(filter: $filter, owner: $owner) {
    additionalInstructions
    archived
    chatFiles {
      nextToken
      __typename
    }
    createdAt
    draft
    id
    inputTokens
    messages
    model
    moderationFlag
    outputTokens
    owner
    threadId
    threadInstructions
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAssistantChatSubscriptionVariables,
  APITypes.OnDeleteAssistantChatSubscription
>;
export const onDeleteAssistantChatFile = /* GraphQL */ `subscription OnDeleteAssistantChatFile(
  $filter: ModelSubscriptionAssistantChatFileFilterInput
  $owner: String
) {
  onDeleteAssistantChatFile(filter: $filter, owner: $owner) {
    chat {
      additionalInstructions
      archived
      createdAt
      draft
      id
      inputTokens
      messages
      model
      moderationFlag
      outputTokens
      owner
      threadId
      threadInstructions
      updatedAt
      __typename
    }
    chatID
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAssistantChatFileSubscriptionVariables,
  APITypes.OnDeleteAssistantChatFileSubscription
>;
export const onDeleteDocument = /* GraphQL */ `subscription OnDeleteDocument(
  $filter: ModelSubscriptionDocumentFilterInput
  $owner: String
) {
  onDeleteDocument(filter: $filter, owner: $owner) {
    agentJobs {
      nextToken
      __typename
    }
    createdAt
    documentQuestions {
      nextToken
      __typename
    }
    documentWords {
      nextToken
      __typename
    }
    extractedText
    fileSize
    filename
    files {
      nextToken
      __typename
    }
    id
    identityId
    learner
    metadata
    mimeType
    owner
    pageCount
    parsedContent {
      nextToken
      __typename
    }
    readableGroups
    resumeState
    s3Key
    sectionID
    status
    unitDocuments {
      nextToken
      __typename
    }
    updatedAt
    uploadedAt
    writableGroups
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentSubscriptionVariables,
  APITypes.OnDeleteDocumentSubscription
>;
export const onDeleteDocumentQuestion = /* GraphQL */ `subscription OnDeleteDocumentQuestion(
  $filter: ModelSubscriptionDocumentQuestionFilterInput
  $owner: String
) {
  onDeleteDocumentQuestion(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentQuestionSubscriptionVariables,
  APITypes.OnDeleteDocumentQuestionSubscription
>;
export const onDeleteDocumentWord = /* GraphQL */ `subscription OnDeleteDocumentWord(
  $filter: ModelSubscriptionDocumentWordFilterInput
  $owner: String
) {
  onDeleteDocumentWord(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentWordSubscriptionVariables,
  APITypes.OnDeleteDocumentWordSubscription
>;
export const onDeleteFile = /* GraphQL */ `subscription OnDeleteFile(
  $filter: ModelSubscriptionFileFilterInput
  $owner: String
) {
  onDeleteFile(filter: $filter, owner: $owner) {
    byHex
    chatFiles {
      nextToken
      __typename
    }
    createdAt
    description
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    duration
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    generated
    hex
    id
    identityId
    level
    mimeType
    model
    name
    owner
    parsedContent {
      nextToken
      __typename
    }
    path
    prompt
    questionFiles {
      nextToken
      __typename
    }
    size
    thumbnail
    unitFiles {
      nextToken
      __typename
    }
    updatedAt
    variant
    waveformData
    wordFiles {
      nextToken
      __typename
    }
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteFileSubscriptionVariables,
  APITypes.OnDeleteFileSubscription
>;
export const onDeleteGrade = /* GraphQL */ `subscription OnDeleteGrade(
  $filter: ModelSubscriptionGradeFilterInput
  $owner: String
) {
  onDeleteGrade(filter: $filter, owner: $owner) {
    accuracy
    complete
    createdAt
    data
    feedback
    files
    id
    identityId
    instructor
    instructorGroup
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    percentComplete
    sectionID
    timerStarted
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    unitVersion
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteGradeSubscriptionVariables,
  APITypes.OnDeleteGradeSubscription
>;
export const onDeleteParsedContent = /* GraphQL */ `subscription OnDeleteParsedContent(
  $filter: ModelSubscriptionParsedContentFilterInput
  $owner: String
) {
  onDeleteParsedContent(filter: $filter, owner: $owner) {
    conceptsJSON
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    identityId
    importedAt
    metadata
    modelUsed
    objectivesJSON
    owner
    processingTime
    questionsJSON
    responseId
    summariesJSON
    tokensUsed
    updatedAt
    vocabularyJSON
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteParsedContentSubscriptionVariables,
  APITypes.OnDeleteParsedContentSubscription
>;
export const onDeleteQuestion = /* GraphQL */ `subscription OnDeleteQuestion(
  $filter: ModelSubscriptionQuestionFilterInput
  $owner: String
) {
  onDeleteQuestion(filter: $filter, owner: $owner) {
    answer
    answerAudio
    answerAudioWaveformData
    audio
    audioWaveformData
    byPromptHex
    choices
    createdAt
    difficulty
    documentQuestions {
      nextToken
      __typename
    }
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    generated
    hint
    id
    identityId
    importedAt
    metadata
    model
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    prompt
    promptHex
    questionFiles {
      nextToken
      __typename
    }
    questionUnits {
      nextToken
      __typename
    }
    questionWords {
      nextToken
      __typename
    }
    thumbnail
    updatedAt
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionSubscriptionVariables,
  APITypes.OnDeleteQuestionSubscription
>;
export const onDeleteQuestionFile = /* GraphQL */ `subscription OnDeleteQuestionFile(
  $filter: ModelSubscriptionQuestionFileFilterInput
  $owner: String
) {
  onDeleteQuestionFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionFileSubscriptionVariables,
  APITypes.OnDeleteQuestionFileSubscription
>;
export const onDeleteQuestionUnit = /* GraphQL */ `subscription OnDeleteQuestionUnit(
  $filter: ModelSubscriptionQuestionUnitFilterInput
  $owner: String
) {
  onDeleteQuestionUnit(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionUnitSubscriptionVariables,
  APITypes.OnDeleteQuestionUnitSubscription
>;
export const onDeleteQuestionWord = /* GraphQL */ `subscription OnDeleteQuestionWord(
  $filter: ModelSubscriptionQuestionWordFilterInput
  $owner: String
) {
  onDeleteQuestionWord(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionWordSubscriptionVariables,
  APITypes.OnDeleteQuestionWordSubscription
>;
export const onDeleteSection = /* GraphQL */ `subscription OnDeleteSection(
  $filter: ModelSubscriptionSectionFilterInput
  $owner: String
) {
  onDeleteSection(filter: $filter, owner: $owner) {
    assignments {
      nextToken
      __typename
    }
    backgroundColor
    code
    createdAt
    curveAssignments
    curveEnabled
    curveMethod
    description
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    featuredImage
    id
    identityId
    instructor
    learner
    name
    owner
    readableGroups
    status
    thumbnail
    updatedAt
    writableGroups
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteSectionSubscriptionVariables,
  APITypes.OnDeleteSectionSubscription
>;
export const onDeleteSettings = /* GraphQL */ `subscription OnDeleteSettings(
  $filter: ModelSubscriptionSettingsFilterInput
  $owner: String
) {
  onDeleteSettings(filter: $filter, owner: $owner) {
    assistantVoice
    autoAnalyzeDocuments
    createdAt
    defaultAIModel
    documentAnalysisModel
    editorFontSize
    editorTheme
    emailNotifications
    id
    identityId
    language
    metadata
    owner
    timezone
    updatedAt
    webhookNotifications
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteSettingsSubscriptionVariables,
  APITypes.OnDeleteSettingsSubscription
>;
export const onDeleteUnit = /* GraphQL */ `subscription OnDeleteUnit(
  $filter: ModelSubscriptionUnitFilterInput
  $owner: String
) {
  onDeleteUnit(filter: $filter, owner: $owner) {
    agentJobs {
      nextToken
      __typename
    }
    assignments {
      nextToken
      __typename
    }
    createdAt
    data
    description
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    featuredImage
    grades {
      nextToken
      __typename
    }
    id
    identityId
    isDraft
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    name
    number
    owner
    publishedAt
    questionUnits {
      nextToken
      __typename
    }
    readableGroups
    status
    thumbnail
    timeLimitSeconds
    unitDocuments {
      nextToken
      __typename
    }
    unitFiles {
      nextToken
      __typename
    }
    unitWords {
      nextToken
      __typename
    }
    updatedAt
    writableGroups
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUnitSubscriptionVariables,
  APITypes.OnDeleteUnitSubscription
>;
export const onDeleteUnitDocument = /* GraphQL */ `subscription OnDeleteUnitDocument(
  $filter: ModelSubscriptionUnitDocumentFilterInput
  $owner: String
) {
  onDeleteUnitDocument(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUnitDocumentSubscriptionVariables,
  APITypes.OnDeleteUnitDocumentSubscription
>;
export const onDeleteUnitFile = /* GraphQL */ `subscription OnDeleteUnitFile(
  $filter: ModelSubscriptionUnitFileFilterInput
  $owner: String
) {
  onDeleteUnitFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUnitFileSubscriptionVariables,
  APITypes.OnDeleteUnitFileSubscription
>;
export const onDeleteUnitWord = /* GraphQL */ `subscription OnDeleteUnitWord(
  $filter: ModelSubscriptionUnitWordFilterInput
  $owner: String
) {
  onDeleteUnitWord(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUnitWordSubscriptionVariables,
  APITypes.OnDeleteUnitWordSubscription
>;
export const onDeleteWord = /* GraphQL */ `subscription OnDeleteWord(
  $filter: ModelSubscriptionWordFilterInput
  $owner: String
) {
  onDeleteWord(filter: $filter, owner: $owner) {
    audio
    createdAt
    definition
    definitionAudio
    definitionWaveformData
    documentWords {
      nextToken
      __typename
    }
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    id
    identityId
    importedAt
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    phrase
    pronunciation
    questionWords {
      nextToken
      __typename
    }
    rubyTags
    unitWords {
      nextToken
      __typename
    }
    updatedAt
    waveformData
    wordFiles {
      nextToken
      __typename
    }
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteWordSubscriptionVariables,
  APITypes.OnDeleteWordSubscription
>;
export const onDeleteWordFile = /* GraphQL */ `subscription OnDeleteWordFile(
  $filter: ModelSubscriptionWordFileFilterInput
  $owner: String
) {
  onDeleteWordFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteWordFileSubscriptionVariables,
  APITypes.OnDeleteWordFileSubscription
>;
export const onUpdateAIFeedback = /* GraphQL */ `subscription OnUpdateAIFeedback(
  $filter: ModelSubscriptionAIFeedbackFilterInput
  $owner: String
) {
  onUpdateAIFeedback(filter: $filter, owner: $owner) {
    comment
    contentType
    createdAt
    documentID
    feedbackType
    generatedContent
    gradeID
    id
    identityId
    messageId
    metadata
    model
    owner
    prompt
    reasons
    sessionId
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAIFeedbackSubscriptionVariables,
  APITypes.OnUpdateAIFeedbackSubscription
>;
export const onUpdateAgentJob = /* GraphQL */ `subscription OnUpdateAgentJob(
  $filter: ModelSubscriptionAgentJobFilterInput
  $owner: String
) {
  onUpdateAgentJob(filter: $filter, owner: $owner) {
    completedAt
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    error
    estimatedCost
    id
    identityId
    metadata
    modelUsed
    owner
    responseId
    retryCount
    startedAt
    status
    tokensUsed
    type
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    webhookData
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAgentJobSubscriptionVariables,
  APITypes.OnUpdateAgentJobSubscription
>;
export const onUpdateAssignment = /* GraphQL */ `subscription OnUpdateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
  $owner: String
) {
  onUpdateAssignment(filter: $filter, owner: $owner) {
    createdAt
    dueDate
    id
    learner
    owner
    readableGroups
    section {
      backgroundColor
      code
      createdAt
      curveAssignments
      curveEnabled
      curveMethod
      description
      featuredImage
      id
      identityId
      instructor
      learner
      name
      owner
      readableGroups
      status
      thumbnail
      updatedAt
      writableGroups
      __typename
    }
    sectionID
    status
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    writableGroups
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAssignmentSubscriptionVariables,
  APITypes.OnUpdateAssignmentSubscription
>;
export const onUpdateAssistantChat = /* GraphQL */ `subscription OnUpdateAssistantChat(
  $filter: ModelSubscriptionAssistantChatFilterInput
  $owner: String
) {
  onUpdateAssistantChat(filter: $filter, owner: $owner) {
    additionalInstructions
    archived
    chatFiles {
      nextToken
      __typename
    }
    createdAt
    draft
    id
    inputTokens
    messages
    model
    moderationFlag
    outputTokens
    owner
    threadId
    threadInstructions
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAssistantChatSubscriptionVariables,
  APITypes.OnUpdateAssistantChatSubscription
>;
export const onUpdateAssistantChatFile = /* GraphQL */ `subscription OnUpdateAssistantChatFile(
  $filter: ModelSubscriptionAssistantChatFileFilterInput
  $owner: String
) {
  onUpdateAssistantChatFile(filter: $filter, owner: $owner) {
    chat {
      additionalInstructions
      archived
      createdAt
      draft
      id
      inputTokens
      messages
      model
      moderationFlag
      outputTokens
      owner
      threadId
      threadInstructions
      updatedAt
      __typename
    }
    chatID
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAssistantChatFileSubscriptionVariables,
  APITypes.OnUpdateAssistantChatFileSubscription
>;
export const onUpdateDocument = /* GraphQL */ `subscription OnUpdateDocument(
  $filter: ModelSubscriptionDocumentFilterInput
  $owner: String
) {
  onUpdateDocument(filter: $filter, owner: $owner) {
    agentJobs {
      nextToken
      __typename
    }
    createdAt
    documentQuestions {
      nextToken
      __typename
    }
    documentWords {
      nextToken
      __typename
    }
    extractedText
    fileSize
    filename
    files {
      nextToken
      __typename
    }
    id
    identityId
    learner
    metadata
    mimeType
    owner
    pageCount
    parsedContent {
      nextToken
      __typename
    }
    readableGroups
    resumeState
    s3Key
    sectionID
    status
    unitDocuments {
      nextToken
      __typename
    }
    updatedAt
    uploadedAt
    writableGroups
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentSubscriptionVariables,
  APITypes.OnUpdateDocumentSubscription
>;
export const onUpdateDocumentQuestion = /* GraphQL */ `subscription OnUpdateDocumentQuestion(
  $filter: ModelSubscriptionDocumentQuestionFilterInput
  $owner: String
) {
  onUpdateDocumentQuestion(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentQuestionSubscriptionVariables,
  APITypes.OnUpdateDocumentQuestionSubscription
>;
export const onUpdateDocumentWord = /* GraphQL */ `subscription OnUpdateDocumentWord(
  $filter: ModelSubscriptionDocumentWordFilterInput
  $owner: String
) {
  onUpdateDocumentWord(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentWordSubscriptionVariables,
  APITypes.OnUpdateDocumentWordSubscription
>;
export const onUpdateFile = /* GraphQL */ `subscription OnUpdateFile(
  $filter: ModelSubscriptionFileFilterInput
  $owner: String
) {
  onUpdateFile(filter: $filter, owner: $owner) {
    byHex
    chatFiles {
      nextToken
      __typename
    }
    createdAt
    description
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    duration
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    generated
    hex
    id
    identityId
    level
    mimeType
    model
    name
    owner
    parsedContent {
      nextToken
      __typename
    }
    path
    prompt
    questionFiles {
      nextToken
      __typename
    }
    size
    thumbnail
    unitFiles {
      nextToken
      __typename
    }
    updatedAt
    variant
    waveformData
    wordFiles {
      nextToken
      __typename
    }
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateFileSubscriptionVariables,
  APITypes.OnUpdateFileSubscription
>;
export const onUpdateGrade = /* GraphQL */ `subscription OnUpdateGrade(
  $filter: ModelSubscriptionGradeFilterInput
  $owner: String
) {
  onUpdateGrade(filter: $filter, owner: $owner) {
    accuracy
    complete
    createdAt
    data
    feedback
    files
    id
    identityId
    instructor
    instructorGroup
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    percentComplete
    sectionID
    timerStarted
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    unitVersion
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateGradeSubscriptionVariables,
  APITypes.OnUpdateGradeSubscription
>;
export const onUpdateParsedContent = /* GraphQL */ `subscription OnUpdateParsedContent(
  $filter: ModelSubscriptionParsedContentFilterInput
  $owner: String
) {
  onUpdateParsedContent(filter: $filter, owner: $owner) {
    conceptsJSON
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    identityId
    importedAt
    metadata
    modelUsed
    objectivesJSON
    owner
    processingTime
    questionsJSON
    responseId
    summariesJSON
    tokensUsed
    updatedAt
    vocabularyJSON
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateParsedContentSubscriptionVariables,
  APITypes.OnUpdateParsedContentSubscription
>;
export const onUpdateQuestion = /* GraphQL */ `subscription OnUpdateQuestion(
  $filter: ModelSubscriptionQuestionFilterInput
  $owner: String
) {
  onUpdateQuestion(filter: $filter, owner: $owner) {
    answer
    answerAudio
    answerAudioWaveformData
    audio
    audioWaveformData
    byPromptHex
    choices
    createdAt
    difficulty
    documentQuestions {
      nextToken
      __typename
    }
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    generated
    hint
    id
    identityId
    importedAt
    metadata
    model
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    prompt
    promptHex
    questionFiles {
      nextToken
      __typename
    }
    questionUnits {
      nextToken
      __typename
    }
    questionWords {
      nextToken
      __typename
    }
    thumbnail
    updatedAt
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionSubscriptionVariables,
  APITypes.OnUpdateQuestionSubscription
>;
export const onUpdateQuestionFile = /* GraphQL */ `subscription OnUpdateQuestionFile(
  $filter: ModelSubscriptionQuestionFileFilterInput
  $owner: String
) {
  onUpdateQuestionFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionFileSubscriptionVariables,
  APITypes.OnUpdateQuestionFileSubscription
>;
export const onUpdateQuestionUnit = /* GraphQL */ `subscription OnUpdateQuestionUnit(
  $filter: ModelSubscriptionQuestionUnitFilterInput
  $owner: String
) {
  onUpdateQuestionUnit(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionUnitSubscriptionVariables,
  APITypes.OnUpdateQuestionUnitSubscription
>;
export const onUpdateQuestionWord = /* GraphQL */ `subscription OnUpdateQuestionWord(
  $filter: ModelSubscriptionQuestionWordFilterInput
  $owner: String
) {
  onUpdateQuestionWord(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    question {
      answer
      answerAudio
      answerAudioWaveformData
      audio
      audioWaveformData
      byPromptHex
      choices
      createdAt
      difficulty
      generated
      hint
      id
      identityId
      importedAt
      metadata
      model
      owner
      prompt
      promptHex
      thumbnail
      updatedAt
      yjsSnapshot
      __typename
    }
    questionID
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionWordSubscriptionVariables,
  APITypes.OnUpdateQuestionWordSubscription
>;
export const onUpdateSection = /* GraphQL */ `subscription OnUpdateSection(
  $filter: ModelSubscriptionSectionFilterInput
  $owner: String
) {
  onUpdateSection(filter: $filter, owner: $owner) {
    assignments {
      nextToken
      __typename
    }
    backgroundColor
    code
    createdAt
    curveAssignments
    curveEnabled
    curveMethod
    description
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    featuredImage
    id
    identityId
    instructor
    learner
    name
    owner
    readableGroups
    status
    thumbnail
    updatedAt
    writableGroups
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateSectionSubscriptionVariables,
  APITypes.OnUpdateSectionSubscription
>;
export const onUpdateSettings = /* GraphQL */ `subscription OnUpdateSettings(
  $filter: ModelSubscriptionSettingsFilterInput
  $owner: String
) {
  onUpdateSettings(filter: $filter, owner: $owner) {
    assistantVoice
    autoAnalyzeDocuments
    createdAt
    defaultAIModel
    documentAnalysisModel
    editorFontSize
    editorTheme
    emailNotifications
    id
    identityId
    language
    metadata
    owner
    timezone
    updatedAt
    webhookNotifications
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateSettingsSubscriptionVariables,
  APITypes.OnUpdateSettingsSubscription
>;
export const onUpdateUnit = /* GraphQL */ `subscription OnUpdateUnit(
  $filter: ModelSubscriptionUnitFilterInput
  $owner: String
) {
  onUpdateUnit(filter: $filter, owner: $owner) {
    agentJobs {
      nextToken
      __typename
    }
    assignments {
      nextToken
      __typename
    }
    createdAt
    data
    description
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    featuredImage
    grades {
      nextToken
      __typename
    }
    id
    identityId
    isDraft
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    name
    number
    owner
    publishedAt
    questionUnits {
      nextToken
      __typename
    }
    readableGroups
    status
    thumbnail
    timeLimitSeconds
    unitDocuments {
      nextToken
      __typename
    }
    unitFiles {
      nextToken
      __typename
    }
    unitWords {
      nextToken
      __typename
    }
    updatedAt
    writableGroups
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUnitSubscriptionVariables,
  APITypes.OnUpdateUnitSubscription
>;
export const onUpdateUnitDocument = /* GraphQL */ `subscription OnUpdateUnitDocument(
  $filter: ModelSubscriptionUnitDocumentFilterInput
  $owner: String
) {
  onUpdateUnitDocument(filter: $filter, owner: $owner) {
    createdAt
    document {
      createdAt
      extractedText
      fileSize
      filename
      id
      identityId
      learner
      metadata
      mimeType
      owner
      pageCount
      readableGroups
      resumeState
      s3Key
      sectionID
      status
      updatedAt
      uploadedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    documentID
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUnitDocumentSubscriptionVariables,
  APITypes.OnUpdateUnitDocumentSubscription
>;
export const onUpdateUnitFile = /* GraphQL */ `subscription OnUpdateUnitFile(
  $filter: ModelSubscriptionUnitFileFilterInput
  $owner: String
) {
  onUpdateUnitFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUnitFileSubscriptionVariables,
  APITypes.OnUpdateUnitFileSubscription
>;
export const onUpdateUnitWord = /* GraphQL */ `subscription OnUpdateUnitWord(
  $filter: ModelSubscriptionUnitWordFilterInput
  $owner: String
) {
  onUpdateUnitWord(filter: $filter, owner: $owner) {
    createdAt
    id
    owner
    unit {
      createdAt
      data
      description
      featuredImage
      id
      identityId
      isDraft
      name
      number
      owner
      publishedAt
      readableGroups
      status
      thumbnail
      timeLimitSeconds
      updatedAt
      writableGroups
      yjsSnapshot
      __typename
    }
    unitID
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUnitWordSubscriptionVariables,
  APITypes.OnUpdateUnitWordSubscription
>;
export const onUpdateWord = /* GraphQL */ `subscription OnUpdateWord(
  $filter: ModelSubscriptionWordFilterInput
  $owner: String
) {
  onUpdateWord(filter: $filter, owner: $owner) {
    audio
    createdAt
    definition
    definitionAudio
    definitionWaveformData
    documentWords {
      nextToken
      __typename
    }
    embedding {
      dimensions
      embedding
      model
      version
      wordCount
      __typename
    }
    id
    identityId
    importedAt
    moderation {
      checkedAt
      flags
      status
      __typename
    }
    owner
    phrase
    pronunciation
    questionWords {
      nextToken
      __typename
    }
    rubyTags
    unitWords {
      nextToken
      __typename
    }
    updatedAt
    waveformData
    wordFiles {
      nextToken
      __typename
    }
    yjsSnapshot
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateWordSubscriptionVariables,
  APITypes.OnUpdateWordSubscription
>;
export const onUpdateWordFile = /* GraphQL */ `subscription OnUpdateWordFile(
  $filter: ModelSubscriptionWordFileFilterInput
  $owner: String
) {
  onUpdateWordFile(filter: $filter, owner: $owner) {
    createdAt
    file {
      byHex
      createdAt
      description
      documentID
      duration
      generated
      hex
      id
      identityId
      level
      mimeType
      model
      name
      owner
      path
      prompt
      size
      thumbnail
      updatedAt
      variant
      waveformData
      yjsSnapshot
      __typename
    }
    fileID
    id
    owner
    updatedAt
    word {
      audio
      createdAt
      definition
      definitionAudio
      definitionWaveformData
      id
      identityId
      importedAt
      owner
      phrase
      pronunciation
      rubyTags
      updatedAt
      waveformData
      yjsSnapshot
      __typename
    }
    wordID
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateWordFileSubscriptionVariables,
  APITypes.OnUpdateWordFileSubscription
>;
