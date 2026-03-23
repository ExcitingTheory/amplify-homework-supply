/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAIFeedback = /* GraphQL */ `query GetAIFeedback($id: ID!) {
  getAIFeedback(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAIFeedbackQueryVariables,
  APITypes.GetAIFeedbackQuery
>;
export const getAgentJob = /* GraphQL */ `query GetAgentJob($id: ID!) {
  getAgentJob(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAgentJobQueryVariables,
  APITypes.GetAgentJobQuery
>;
export const getAssignment = /* GraphQL */ `query GetAssignment($id: ID!) {
  getAssignment(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAssignmentQueryVariables,
  APITypes.GetAssignmentQuery
>;
export const getAssistantChat = /* GraphQL */ `query GetAssistantChat($id: ID!) {
  getAssistantChat(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAssistantChatQueryVariables,
  APITypes.GetAssistantChatQuery
>;
export const getAssistantChatFile = /* GraphQL */ `query GetAssistantChatFile($id: ID!) {
  getAssistantChatFile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAssistantChatFileQueryVariables,
  APITypes.GetAssistantChatFileQuery
>;
export const getDocument = /* GraphQL */ `query GetDocument($id: ID!) {
  getDocument(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetDocumentQueryVariables,
  APITypes.GetDocumentQuery
>;
export const getDocumentQuestion = /* GraphQL */ `query GetDocumentQuestion($id: ID!) {
  getDocumentQuestion(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetDocumentQuestionQueryVariables,
  APITypes.GetDocumentQuestionQuery
>;
export const getDocumentWord = /* GraphQL */ `query GetDocumentWord($id: ID!) {
  getDocumentWord(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetDocumentWordQueryVariables,
  APITypes.GetDocumentWordQuery
>;
export const getFile = /* GraphQL */ `query GetFile($id: ID!) {
  getFile(id: $id) {
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
` as GeneratedQuery<APITypes.GetFileQueryVariables, APITypes.GetFileQuery>;
export const getGrade = /* GraphQL */ `query GetGrade($id: ID!) {
  getGrade(id: $id) {
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
` as GeneratedQuery<APITypes.GetGradeQueryVariables, APITypes.GetGradeQuery>;
export const getParsedContent = /* GraphQL */ `query GetParsedContent($id: ID!) {
  getParsedContent(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetParsedContentQueryVariables,
  APITypes.GetParsedContentQuery
>;
export const getQuestion = /* GraphQL */ `query GetQuestion($id: ID!) {
  getQuestion(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetQuestionQueryVariables,
  APITypes.GetQuestionQuery
>;
export const getQuestionFile = /* GraphQL */ `query GetQuestionFile($id: ID!) {
  getQuestionFile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetQuestionFileQueryVariables,
  APITypes.GetQuestionFileQuery
>;
export const getQuestionUnit = /* GraphQL */ `query GetQuestionUnit($id: ID!) {
  getQuestionUnit(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetQuestionUnitQueryVariables,
  APITypes.GetQuestionUnitQuery
>;
export const getQuestionWord = /* GraphQL */ `query GetQuestionWord($id: ID!) {
  getQuestionWord(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetQuestionWordQueryVariables,
  APITypes.GetQuestionWordQuery
>;
export const getSection = /* GraphQL */ `query GetSection($id: ID!) {
  getSection(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetSectionQueryVariables,
  APITypes.GetSectionQuery
>;
export const getSettings = /* GraphQL */ `query GetSettings($id: ID!) {
  getSettings(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetSettingsQueryVariables,
  APITypes.GetSettingsQuery
>;
export const getUnit = /* GraphQL */ `query GetUnit($id: ID!) {
  getUnit(id: $id) {
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
` as GeneratedQuery<APITypes.GetUnitQueryVariables, APITypes.GetUnitQuery>;
export const getUnitDocument = /* GraphQL */ `query GetUnitDocument($id: ID!) {
  getUnitDocument(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetUnitDocumentQueryVariables,
  APITypes.GetUnitDocumentQuery
>;
export const getUnitFile = /* GraphQL */ `query GetUnitFile($id: ID!) {
  getUnitFile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetUnitFileQueryVariables,
  APITypes.GetUnitFileQuery
>;
export const getUnitWord = /* GraphQL */ `query GetUnitWord($id: ID!) {
  getUnitWord(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetUnitWordQueryVariables,
  APITypes.GetUnitWordQuery
>;
export const getWord = /* GraphQL */ `query GetWord($id: ID!) {
  getWord(id: $id) {
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
` as GeneratedQuery<APITypes.GetWordQueryVariables, APITypes.GetWordQuery>;
export const getWordFile = /* GraphQL */ `query GetWordFile($id: ID!) {
  getWordFile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetWordFileQueryVariables,
  APITypes.GetWordFileQuery
>;
export const listAIFeedbacks = /* GraphQL */ `query ListAIFeedbacks(
  $filter: ModelAIFeedbackFilterInput
  $limit: Int
  $nextToken: String
) {
  listAIFeedbacks(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAIFeedbacksQueryVariables,
  APITypes.ListAIFeedbacksQuery
>;
export const listAgentJobs = /* GraphQL */ `query ListAgentJobs(
  $filter: ModelAgentJobFilterInput
  $limit: Int
  $nextToken: String
) {
  listAgentJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      completedAt
      createdAt
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
      unitID
      updatedAt
      webhookData
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAgentJobsQueryVariables,
  APITypes.ListAgentJobsQuery
>;
export const listAssignments = /* GraphQL */ `query ListAssignments(
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssignments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      dueDate
      id
      learner
      owner
      readableGroups
      sectionID
      status
      unitID
      updatedAt
      writableGroups
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAssignmentsQueryVariables,
  APITypes.ListAssignmentsQuery
>;
export const listAssistantChatFiles = /* GraphQL */ `query ListAssistantChatFiles(
  $filter: ModelAssistantChatFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssistantChatFiles(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      chatID
      createdAt
      fileID
      id
      owner
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAssistantChatFilesQueryVariables,
  APITypes.ListAssistantChatFilesQuery
>;
export const listAssistantChats = /* GraphQL */ `query ListAssistantChats(
  $filter: ModelAssistantChatFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssistantChats(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAssistantChatsQueryVariables,
  APITypes.ListAssistantChatsQuery
>;
export const listDocumentQuestions = /* GraphQL */ `query ListDocumentQuestions(
  $filter: ModelDocumentQuestionFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocumentQuestions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      documentID
      id
      owner
      questionID
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDocumentQuestionsQueryVariables,
  APITypes.ListDocumentQuestionsQuery
>;
export const listDocumentWords = /* GraphQL */ `query ListDocumentWords(
  $filter: ModelDocumentWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocumentWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      documentID
      id
      owner
      updatedAt
      wordID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDocumentWordsQueryVariables,
  APITypes.ListDocumentWordsQuery
>;
export const listDocuments = /* GraphQL */ `query ListDocuments(
  $filter: ModelDocumentFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocuments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDocumentsQueryVariables,
  APITypes.ListDocumentsQuery
>;
export const listFiles = /* GraphQL */ `query ListFiles(
  $filter: ModelFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListFilesQueryVariables, APITypes.ListFilesQuery>;
export const listGrades = /* GraphQL */ `query ListGrades(
  $filter: ModelGradeFilterInput
  $limit: Int
  $nextToken: String
) {
  listGrades(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
      owner
      percentComplete
      sectionID
      timerStarted
      unitID
      unitVersion
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListGradesQueryVariables,
  APITypes.ListGradesQuery
>;
export const listParsedContents = /* GraphQL */ `query ListParsedContents(
  $filter: ModelParsedContentFilterInput
  $limit: Int
  $nextToken: String
) {
  listParsedContents(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      conceptsJSON
      createdAt
      documentID
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListParsedContentsQueryVariables,
  APITypes.ListParsedContentsQuery
>;
export const listQuestionFiles = /* GraphQL */ `query ListQuestionFiles(
  $filter: ModelQuestionFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestionFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      fileID
      id
      owner
      questionID
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionFilesQueryVariables,
  APITypes.ListQuestionFilesQuery
>;
export const listQuestionUnits = /* GraphQL */ `query ListQuestionUnits(
  $filter: ModelQuestionUnitFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestionUnits(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      id
      owner
      questionID
      unitID
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionUnitsQueryVariables,
  APITypes.ListQuestionUnitsQuery
>;
export const listQuestionWords = /* GraphQL */ `query ListQuestionWords(
  $filter: ModelQuestionWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestionWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      id
      owner
      questionID
      updatedAt
      wordID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionWordsQueryVariables,
  APITypes.ListQuestionWordsQuery
>;
export const listQuestions = /* GraphQL */ `query ListQuestions(
  $filter: ModelQuestionFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionsQueryVariables,
  APITypes.ListQuestionsQuery
>;
export const listSectionStudents = /* GraphQL */ `query ListSectionStudents($sectionCode: String!) {
  listSectionStudents(sectionCode: $sectionCode) {
    email
    id
    name
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSectionStudentsQueryVariables,
  APITypes.ListSectionStudentsQuery
>;
export const listSections = /* GraphQL */ `query ListSections(
  $filter: ModelSectionFilterInput
  $limit: Int
  $nextToken: String
) {
  listSections(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSectionsQueryVariables,
  APITypes.ListSectionsQuery
>;
export const listSettings = /* GraphQL */ `query ListSettings(
  $filter: ModelSettingsFilterInput
  $limit: Int
  $nextToken: String
) {
  listSettings(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSettingsQueryVariables,
  APITypes.ListSettingsQuery
>;
export const listUnitDocuments = /* GraphQL */ `query ListUnitDocuments(
  $filter: ModelUnitDocumentFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnitDocuments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      documentID
      id
      owner
      unitID
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUnitDocumentsQueryVariables,
  APITypes.ListUnitDocumentsQuery
>;
export const listUnitFiles = /* GraphQL */ `query ListUnitFiles(
  $filter: ModelUnitFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnitFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      fileID
      id
      owner
      unitID
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUnitFilesQueryVariables,
  APITypes.ListUnitFilesQuery
>;
export const listUnitWords = /* GraphQL */ `query ListUnitWords(
  $filter: ModelUnitWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnitWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      id
      owner
      unitID
      updatedAt
      wordID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUnitWordsQueryVariables,
  APITypes.ListUnitWordsQuery
>;
export const listUnits = /* GraphQL */ `query ListUnits(
  $filter: ModelUnitFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnits(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUnitsQueryVariables, APITypes.ListUnitsQuery>;
export const listWordFiles = /* GraphQL */ `query ListWordFiles(
  $filter: ModelWordFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listWordFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      fileID
      id
      owner
      updatedAt
      wordID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWordFilesQueryVariables,
  APITypes.ListWordFilesQuery
>;
export const listWords = /* GraphQL */ `query ListWords(
  $filter: ModelWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListWordsQueryVariables, APITypes.ListWordsQuery>;
export const processImage = /* GraphQL */ `query ProcessImage($image: String!, $model: String) {
  processImage(image: $image, model: $model)
}
` as GeneratedQuery<
  APITypes.ProcessImageQueryVariables,
  APITypes.ProcessImageQuery
>;
export const processImageUrl = /* GraphQL */ `query ProcessImageUrl($imageUrl: String!, $model: String) {
  processImageUrl(imageUrl: $imageUrl, model: $model)
}
` as GeneratedQuery<
  APITypes.ProcessImageUrlQueryVariables,
  APITypes.ProcessImageUrlQuery
>;
export const transcribe = /* GraphQL */ `query Transcribe($audio: String!, $model: String) {
  transcribe(audio: $audio, model: $model)
}
` as GeneratedQuery<
  APITypes.TranscribeQueryVariables,
  APITypes.TranscribeQuery
>;
export const transcribeUrl = /* GraphQL */ `query TranscribeUrl($audioUrl: String!, $model: String) {
  transcribeUrl(audioUrl: $audioUrl, model: $model)
}
` as GeneratedQuery<
  APITypes.TranscribeUrlQueryVariables,
  APITypes.TranscribeUrlQuery
>;
export const verifyAudio = /* GraphQL */ `query VerifyAudio(
  $audio: String!
  $chatModel: String!
  $expected: String!
  $model: String
) {
  verifyAudio(
    audio: $audio
    chatModel: $chatModel
    expected: $expected
    model: $model
  )
}
` as GeneratedQuery<
  APITypes.VerifyAudioQueryVariables,
  APITypes.VerifyAudioQuery
>;
export const verifyAudioUrl = /* GraphQL */ `query VerifyAudioUrl(
  $audioUrl: String!
  $chatModel: String!
  $expected: String!
  $model: String!
) {
  verifyAudioUrl(
    audioUrl: $audioUrl
    chatModel: $chatModel
    expected: $expected
    model: $model
  )
}
` as GeneratedQuery<
  APITypes.VerifyAudioUrlQueryVariables,
  APITypes.VerifyAudioUrlQuery
>;
export const verifyDefinition = /* GraphQL */ `query VerifyDefinition(
  $definition: String!
  $expected: String!
  $model: String
  $phrase: String!
) {
  verifyDefinition(
    definition: $definition
    expected: $expected
    model: $model
    phrase: $phrase
  )
}
` as GeneratedQuery<
  APITypes.VerifyDefinitionQueryVariables,
  APITypes.VerifyDefinitionQuery
>;
export const verifyImage = /* GraphQL */ `query VerifyImage($expected: String!, $image: String!, $model: String) {
  verifyImage(expected: $expected, image: $image, model: $model)
}
` as GeneratedQuery<
  APITypes.VerifyImageQueryVariables,
  APITypes.VerifyImageQuery
>;
export const verifyImageUrl = /* GraphQL */ `query VerifyImageUrl($expected: String!, $imageUrl: String!, $model: String) {
  verifyImageUrl(expected: $expected, imageUrl: $imageUrl, model: $model)
}
` as GeneratedQuery<
  APITypes.VerifyImageUrlQueryVariables,
  APITypes.VerifyImageUrlQuery
>;
export const verifyShortAnswer = /* GraphQL */ `query VerifyShortAnswer(
  $answer: String!
  $expected: String!
  $model: String
  $prompt: String!
) {
  verifyShortAnswer(
    answer: $answer
    expected: $expected
    model: $model
    prompt: $prompt
  )
}
` as GeneratedQuery<
  APITypes.VerifyShortAnswerQueryVariables,
  APITypes.VerifyShortAnswerQuery
>;
export const verifyWord = /* GraphQL */ `query VerifyWord(
  $definition: String!
  $expected: String!
  $model: String
  $word: String!
) {
  verifyWord(
    definition: $definition
    expected: $expected
    model: $model
    word: $word
  )
}
` as GeneratedQuery<
  APITypes.VerifyWordQueryVariables,
  APITypes.VerifyWordQuery
>;
