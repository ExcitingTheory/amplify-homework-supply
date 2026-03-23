/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const addSelfToSection = /* GraphQL */ `mutation AddSelfToSection($code: String!) {
  addSelfToSection(code: $code)
}
` as GeneratedMutation<
  APITypes.AddSelfToSectionMutationVariables,
  APITypes.AddSelfToSectionMutation
>;
export const analyzeDocument = /* GraphQL */ `mutation AnalyzeDocument($fileID: ID!) {
  analyzeDocument(fileID: $fileID) {
    documentID
    fileID
    message
    pageCount
    progress
    responseId
    success
    __typename
  }
}
` as GeneratedMutation<
  APITypes.AnalyzeDocumentMutationVariables,
  APITypes.AnalyzeDocumentMutation
>;
export const cancelDocumentAnalysis = /* GraphQL */ `mutation CancelDocumentAnalysis($fileID: ID!) {
  cancelDocumentAnalysis(fileID: $fileID) {
    documentID
    fileID
    message
    success
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CancelDocumentAnalysisMutationVariables,
  APITypes.CancelDocumentAnalysisMutation
>;
export const chat = /* GraphQL */ `mutation Chat($messages: String!, $model: String) {
  chat(messages: $messages, model: $model)
}
` as GeneratedMutation<APITypes.ChatMutationVariables, APITypes.ChatMutation>;
export const chatAssistantThread = /* GraphQL */ `mutation ChatAssistantThread($assistantId: String!, $messages: String!) {
  chatAssistantThread(assistantId: $assistantId, messages: $messages)
}
` as GeneratedMutation<
  APITypes.ChatAssistantThreadMutationVariables,
  APITypes.ChatAssistantThreadMutation
>;
export const contentCompletion = /* GraphQL */ `mutation ContentCompletion($context: AWSJSON, $prompt: String!) {
  contentCompletion(context: $context, prompt: $prompt)
}
` as GeneratedMutation<
  APITypes.ContentCompletionMutationVariables,
  APITypes.ContentCompletionMutation
>;
export const createAIFeedback = /* GraphQL */ `mutation CreateAIFeedback(
  $condition: ModelAIFeedbackConditionInput
  $input: CreateAIFeedbackInput!
) {
  createAIFeedback(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAIFeedbackMutationVariables,
  APITypes.CreateAIFeedbackMutation
>;
export const createAgentJob = /* GraphQL */ `mutation CreateAgentJob(
  $condition: ModelAgentJobConditionInput
  $input: CreateAgentJobInput!
) {
  createAgentJob(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAgentJobMutationVariables,
  APITypes.CreateAgentJobMutation
>;
export const createAssignment = /* GraphQL */ `mutation CreateAssignment(
  $condition: ModelAssignmentConditionInput
  $input: CreateAssignmentInput!
) {
  createAssignment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAssignmentMutationVariables,
  APITypes.CreateAssignmentMutation
>;
export const createAssistantChat = /* GraphQL */ `mutation CreateAssistantChat(
  $condition: ModelAssistantChatConditionInput
  $input: CreateAssistantChatInput!
) {
  createAssistantChat(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAssistantChatMutationVariables,
  APITypes.CreateAssistantChatMutation
>;
export const createAssistantChatFile = /* GraphQL */ `mutation CreateAssistantChatFile(
  $condition: ModelAssistantChatFileConditionInput
  $input: CreateAssistantChatFileInput!
) {
  createAssistantChatFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAssistantChatFileMutationVariables,
  APITypes.CreateAssistantChatFileMutation
>;
export const createDocument = /* GraphQL */ `mutation CreateDocument(
  $condition: ModelDocumentConditionInput
  $input: CreateDocumentInput!
) {
  createDocument(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateDocumentMutationVariables,
  APITypes.CreateDocumentMutation
>;
export const createDocumentQuestion = /* GraphQL */ `mutation CreateDocumentQuestion(
  $condition: ModelDocumentQuestionConditionInput
  $input: CreateDocumentQuestionInput!
) {
  createDocumentQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateDocumentQuestionMutationVariables,
  APITypes.CreateDocumentQuestionMutation
>;
export const createDocumentWord = /* GraphQL */ `mutation CreateDocumentWord(
  $condition: ModelDocumentWordConditionInput
  $input: CreateDocumentWordInput!
) {
  createDocumentWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateDocumentWordMutationVariables,
  APITypes.CreateDocumentWordMutation
>;
export const createFile = /* GraphQL */ `mutation CreateFile(
  $condition: ModelFileConditionInput
  $input: CreateFileInput!
) {
  createFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateFileMutationVariables,
  APITypes.CreateFileMutation
>;
export const createGrade = /* GraphQL */ `mutation CreateGrade(
  $condition: ModelGradeConditionInput
  $input: CreateGradeInput!
) {
  createGrade(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateGradeMutationVariables,
  APITypes.CreateGradeMutation
>;
export const createParsedContent = /* GraphQL */ `mutation CreateParsedContent(
  $condition: ModelParsedContentConditionInput
  $input: CreateParsedContentInput!
) {
  createParsedContent(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateParsedContentMutationVariables,
  APITypes.CreateParsedContentMutation
>;
export const createQuestion = /* GraphQL */ `mutation CreateQuestion(
  $condition: ModelQuestionConditionInput
  $input: CreateQuestionInput!
) {
  createQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateQuestionMutationVariables,
  APITypes.CreateQuestionMutation
>;
export const createQuestionFile = /* GraphQL */ `mutation CreateQuestionFile(
  $condition: ModelQuestionFileConditionInput
  $input: CreateQuestionFileInput!
) {
  createQuestionFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateQuestionFileMutationVariables,
  APITypes.CreateQuestionFileMutation
>;
export const createQuestionUnit = /* GraphQL */ `mutation CreateQuestionUnit(
  $condition: ModelQuestionUnitConditionInput
  $input: CreateQuestionUnitInput!
) {
  createQuestionUnit(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateQuestionUnitMutationVariables,
  APITypes.CreateQuestionUnitMutation
>;
export const createQuestionWord = /* GraphQL */ `mutation CreateQuestionWord(
  $condition: ModelQuestionWordConditionInput
  $input: CreateQuestionWordInput!
) {
  createQuestionWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateQuestionWordMutationVariables,
  APITypes.CreateQuestionWordMutation
>;
export const createSection = /* GraphQL */ `mutation CreateSection(
  $condition: ModelSectionConditionInput
  $input: CreateSectionInput!
) {
  createSection(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSectionMutationVariables,
  APITypes.CreateSectionMutation
>;
export const createSectionGroup = /* GraphQL */ `mutation CreateSectionGroup($description: String!, $name: String!) {
  createSectionGroup(description: $description, name: $name)
}
` as GeneratedMutation<
  APITypes.CreateSectionGroupMutationVariables,
  APITypes.CreateSectionGroupMutation
>;
export const createSettings = /* GraphQL */ `mutation CreateSettings(
  $condition: ModelSettingsConditionInput
  $input: CreateSettingsInput!
) {
  createSettings(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSettingsMutationVariables,
  APITypes.CreateSettingsMutation
>;
export const createUnit = /* GraphQL */ `mutation CreateUnit(
  $condition: ModelUnitConditionInput
  $input: CreateUnitInput!
) {
  createUnit(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUnitMutationVariables,
  APITypes.CreateUnitMutation
>;
export const createUnitDocument = /* GraphQL */ `mutation CreateUnitDocument(
  $condition: ModelUnitDocumentConditionInput
  $input: CreateUnitDocumentInput!
) {
  createUnitDocument(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUnitDocumentMutationVariables,
  APITypes.CreateUnitDocumentMutation
>;
export const createUnitFile = /* GraphQL */ `mutation CreateUnitFile(
  $condition: ModelUnitFileConditionInput
  $input: CreateUnitFileInput!
) {
  createUnitFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUnitFileMutationVariables,
  APITypes.CreateUnitFileMutation
>;
export const createUnitWord = /* GraphQL */ `mutation CreateUnitWord(
  $condition: ModelUnitWordConditionInput
  $input: CreateUnitWordInput!
) {
  createUnitWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUnitWordMutationVariables,
  APITypes.CreateUnitWordMutation
>;
export const createWord = /* GraphQL */ `mutation CreateWord(
  $condition: ModelWordConditionInput
  $input: CreateWordInput!
) {
  createWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateWordMutationVariables,
  APITypes.CreateWordMutation
>;
export const createWordFile = /* GraphQL */ `mutation CreateWordFile(
  $condition: ModelWordFileConditionInput
  $input: CreateWordFileInput!
) {
  createWordFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateWordFileMutationVariables,
  APITypes.CreateWordFileMutation
>;
export const deleteAIFeedback = /* GraphQL */ `mutation DeleteAIFeedback(
  $condition: ModelAIFeedbackConditionInput
  $input: DeleteAIFeedbackInput!
) {
  deleteAIFeedback(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAIFeedbackMutationVariables,
  APITypes.DeleteAIFeedbackMutation
>;
export const deleteAgentJob = /* GraphQL */ `mutation DeleteAgentJob(
  $condition: ModelAgentJobConditionInput
  $input: DeleteAgentJobInput!
) {
  deleteAgentJob(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAgentJobMutationVariables,
  APITypes.DeleteAgentJobMutation
>;
export const deleteAssignment = /* GraphQL */ `mutation DeleteAssignment(
  $condition: ModelAssignmentConditionInput
  $input: DeleteAssignmentInput!
) {
  deleteAssignment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAssignmentMutationVariables,
  APITypes.DeleteAssignmentMutation
>;
export const deleteAssistantChat = /* GraphQL */ `mutation DeleteAssistantChat(
  $condition: ModelAssistantChatConditionInput
  $input: DeleteAssistantChatInput!
) {
  deleteAssistantChat(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAssistantChatMutationVariables,
  APITypes.DeleteAssistantChatMutation
>;
export const deleteAssistantChatFile = /* GraphQL */ `mutation DeleteAssistantChatFile(
  $condition: ModelAssistantChatFileConditionInput
  $input: DeleteAssistantChatFileInput!
) {
  deleteAssistantChatFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAssistantChatFileMutationVariables,
  APITypes.DeleteAssistantChatFileMutation
>;
export const deleteAssistantEditor = /* GraphQL */ `mutation DeleteAssistantEditor($assistantId: String!, $threadId: String!) {
  deleteAssistantEditor(assistantId: $assistantId, threadId: $threadId)
}
` as GeneratedMutation<
  APITypes.DeleteAssistantEditorMutationVariables,
  APITypes.DeleteAssistantEditorMutation
>;
export const deleteDocument = /* GraphQL */ `mutation DeleteDocument(
  $condition: ModelDocumentConditionInput
  $input: DeleteDocumentInput!
) {
  deleteDocument(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteDocumentMutationVariables,
  APITypes.DeleteDocumentMutation
>;
export const deleteDocumentQuestion = /* GraphQL */ `mutation DeleteDocumentQuestion(
  $condition: ModelDocumentQuestionConditionInput
  $input: DeleteDocumentQuestionInput!
) {
  deleteDocumentQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteDocumentQuestionMutationVariables,
  APITypes.DeleteDocumentQuestionMutation
>;
export const deleteDocumentWord = /* GraphQL */ `mutation DeleteDocumentWord(
  $condition: ModelDocumentWordConditionInput
  $input: DeleteDocumentWordInput!
) {
  deleteDocumentWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteDocumentWordMutationVariables,
  APITypes.DeleteDocumentWordMutation
>;
export const deleteFile = /* GraphQL */ `mutation DeleteFile(
  $condition: ModelFileConditionInput
  $input: DeleteFileInput!
) {
  deleteFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteFileMutationVariables,
  APITypes.DeleteFileMutation
>;
export const deleteGrade = /* GraphQL */ `mutation DeleteGrade(
  $condition: ModelGradeConditionInput
  $input: DeleteGradeInput!
) {
  deleteGrade(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteGradeMutationVariables,
  APITypes.DeleteGradeMutation
>;
export const deleteParsedContent = /* GraphQL */ `mutation DeleteParsedContent(
  $condition: ModelParsedContentConditionInput
  $input: DeleteParsedContentInput!
) {
  deleteParsedContent(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteParsedContentMutationVariables,
  APITypes.DeleteParsedContentMutation
>;
export const deleteQuestion = /* GraphQL */ `mutation DeleteQuestion(
  $condition: ModelQuestionConditionInput
  $input: DeleteQuestionInput!
) {
  deleteQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteQuestionMutationVariables,
  APITypes.DeleteQuestionMutation
>;
export const deleteQuestionFile = /* GraphQL */ `mutation DeleteQuestionFile(
  $condition: ModelQuestionFileConditionInput
  $input: DeleteQuestionFileInput!
) {
  deleteQuestionFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteQuestionFileMutationVariables,
  APITypes.DeleteQuestionFileMutation
>;
export const deleteQuestionUnit = /* GraphQL */ `mutation DeleteQuestionUnit(
  $condition: ModelQuestionUnitConditionInput
  $input: DeleteQuestionUnitInput!
) {
  deleteQuestionUnit(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteQuestionUnitMutationVariables,
  APITypes.DeleteQuestionUnitMutation
>;
export const deleteQuestionWord = /* GraphQL */ `mutation DeleteQuestionWord(
  $condition: ModelQuestionWordConditionInput
  $input: DeleteQuestionWordInput!
) {
  deleteQuestionWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteQuestionWordMutationVariables,
  APITypes.DeleteQuestionWordMutation
>;
export const deleteSection = /* GraphQL */ `mutation DeleteSection(
  $condition: ModelSectionConditionInput
  $input: DeleteSectionInput!
) {
  deleteSection(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSectionMutationVariables,
  APITypes.DeleteSectionMutation
>;
export const deleteSettings = /* GraphQL */ `mutation DeleteSettings(
  $condition: ModelSettingsConditionInput
  $input: DeleteSettingsInput!
) {
  deleteSettings(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSettingsMutationVariables,
  APITypes.DeleteSettingsMutation
>;
export const deleteUnit = /* GraphQL */ `mutation DeleteUnit(
  $condition: ModelUnitConditionInput
  $input: DeleteUnitInput!
) {
  deleteUnit(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteUnitMutationVariables,
  APITypes.DeleteUnitMutation
>;
export const deleteUnitDocument = /* GraphQL */ `mutation DeleteUnitDocument(
  $condition: ModelUnitDocumentConditionInput
  $input: DeleteUnitDocumentInput!
) {
  deleteUnitDocument(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteUnitDocumentMutationVariables,
  APITypes.DeleteUnitDocumentMutation
>;
export const deleteUnitFile = /* GraphQL */ `mutation DeleteUnitFile(
  $condition: ModelUnitFileConditionInput
  $input: DeleteUnitFileInput!
) {
  deleteUnitFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteUnitFileMutationVariables,
  APITypes.DeleteUnitFileMutation
>;
export const deleteUnitWord = /* GraphQL */ `mutation DeleteUnitWord(
  $condition: ModelUnitWordConditionInput
  $input: DeleteUnitWordInput!
) {
  deleteUnitWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteUnitWordMutationVariables,
  APITypes.DeleteUnitWordMutation
>;
export const deleteWord = /* GraphQL */ `mutation DeleteWord(
  $condition: ModelWordConditionInput
  $input: DeleteWordInput!
) {
  deleteWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteWordMutationVariables,
  APITypes.DeleteWordMutation
>;
export const deleteWordFile = /* GraphQL */ `mutation DeleteWordFile(
  $condition: ModelWordFileConditionInput
  $input: DeleteWordFileInput!
) {
  deleteWordFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteWordFileMutationVariables,
  APITypes.DeleteWordFileMutation
>;
export const generateAudio = /* GraphQL */ `mutation GenerateAudio($model: String, $phrase: String!, $voice: String) {
  generateAudio(model: $model, phrase: $phrase, voice: $voice)
}
` as GeneratedMutation<
  APITypes.GenerateAudioMutationVariables,
  APITypes.GenerateAudioMutation
>;
export const generateAudioFile = /* GraphQL */ `mutation GenerateAudioFile($model: String!, $phrase: String!, $voice: String!) {
  generateAudioFile(model: $model, phrase: $phrase, voice: $voice) {
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
` as GeneratedMutation<
  APITypes.GenerateAudioFileMutationVariables,
  APITypes.GenerateAudioFileMutation
>;
export const generateEmbedding = /* GraphQL */ `mutation GenerateEmbedding(
  $content: String!
  $dimensions: Int
  $model: String
) {
  generateEmbedding(content: $content, dimensions: $dimensions, model: $model) {
    dimensions
    embedding
    error
    model
    tokenCount
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateEmbeddingMutationVariables,
  APITypes.GenerateEmbeddingMutation
>;
export const generateEmbeddings = /* GraphQL */ `mutation GenerateEmbeddings($fileID: ID!) {
  generateEmbeddings(fileID: $fileID) {
    documentID
    embeddingCount
    fileID
    message
    success
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateEmbeddingsMutationVariables,
  APITypes.GenerateEmbeddingsMutation
>;
export const generateImage = /* GraphQL */ `mutation GenerateImage($model: String, $phrase: String!) {
  generateImage(model: $model, phrase: $phrase)
}
` as GeneratedMutation<
  APITypes.GenerateImageMutationVariables,
  APITypes.GenerateImageMutation
>;
export const generateImageFile = /* GraphQL */ `mutation GenerateImageFile($model: String, $phrase: String!) {
  generateImageFile(model: $model, phrase: $phrase) {
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
` as GeneratedMutation<
  APITypes.GenerateImageFileMutationVariables,
  APITypes.GenerateImageFileMutation
>;
export const initAssistantEditor = /* GraphQL */ `mutation InitAssistantEditor(
  $additionalInstructions: String!
  $model: String!
) {
  initAssistantEditor(
    additionalInstructions: $additionalInstructions
    model: $model
  )
}
` as GeneratedMutation<
  APITypes.InitAssistantEditorMutationVariables,
  APITypes.InitAssistantEditorMutation
>;
export const moderateContent = /* GraphQL */ `mutation ModerateContent($content: String!) {
  moderateContent(content: $content) {
    categories
    categoryScores
    error
    flagged
    model
    __typename
  }
}
` as GeneratedMutation<
  APITypes.ModerateContentMutationVariables,
  APITypes.ModerateContentMutation
>;
export const predictUnitByData = /* GraphQL */ `mutation PredictUnitByData($data: String!) {
  predictUnitByData(data: $data)
}
` as GeneratedMutation<
  APITypes.PredictUnitByDataMutationVariables,
  APITypes.PredictUnitByDataMutation
>;
export const predictUnitData = /* GraphQL */ `mutation PredictUnitData($unitID: ID!) {
  predictUnitData(unitID: $unitID)
}
` as GeneratedMutation<
  APITypes.PredictUnitDataMutationVariables,
  APITypes.PredictUnitDataMutation
>;
export const suggestBlocks = /* GraphQL */ `mutation SuggestBlocks(
  $currentContext: AWSJSON
  $unitStructure: AWSJSON!
  $userHistory: AWSJSON
) {
  suggestBlocks(
    currentContext: $currentContext
    unitStructure: $unitStructure
    userHistory: $userHistory
  )
}
` as GeneratedMutation<
  APITypes.SuggestBlocksMutationVariables,
  APITypes.SuggestBlocksMutation
>;
export const updateAIFeedback = /* GraphQL */ `mutation UpdateAIFeedback(
  $condition: ModelAIFeedbackConditionInput
  $input: UpdateAIFeedbackInput!
) {
  updateAIFeedback(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAIFeedbackMutationVariables,
  APITypes.UpdateAIFeedbackMutation
>;
export const updateAgentJob = /* GraphQL */ `mutation UpdateAgentJob(
  $condition: ModelAgentJobConditionInput
  $input: UpdateAgentJobInput!
) {
  updateAgentJob(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAgentJobMutationVariables,
  APITypes.UpdateAgentJobMutation
>;
export const updateAssignment = /* GraphQL */ `mutation UpdateAssignment(
  $condition: ModelAssignmentConditionInput
  $input: UpdateAssignmentInput!
) {
  updateAssignment(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAssignmentMutationVariables,
  APITypes.UpdateAssignmentMutation
>;
export const updateAssistantChat = /* GraphQL */ `mutation UpdateAssistantChat(
  $condition: ModelAssistantChatConditionInput
  $input: UpdateAssistantChatInput!
) {
  updateAssistantChat(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAssistantChatMutationVariables,
  APITypes.UpdateAssistantChatMutation
>;
export const updateAssistantChatFile = /* GraphQL */ `mutation UpdateAssistantChatFile(
  $condition: ModelAssistantChatFileConditionInput
  $input: UpdateAssistantChatFileInput!
) {
  updateAssistantChatFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAssistantChatFileMutationVariables,
  APITypes.UpdateAssistantChatFileMutation
>;
export const updateAssistantEditor = /* GraphQL */ `mutation UpdateAssistantEditor(
  $additionalInstructions: String!
  $assistantId: String!
  $model: String
) {
  updateAssistantEditor(
    additionalInstructions: $additionalInstructions
    assistantId: $assistantId
    model: $model
  )
}
` as GeneratedMutation<
  APITypes.UpdateAssistantEditorMutationVariables,
  APITypes.UpdateAssistantEditorMutation
>;
export const updateDocument = /* GraphQL */ `mutation UpdateDocument(
  $condition: ModelDocumentConditionInput
  $input: UpdateDocumentInput!
) {
  updateDocument(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateDocumentMutationVariables,
  APITypes.UpdateDocumentMutation
>;
export const updateDocumentQuestion = /* GraphQL */ `mutation UpdateDocumentQuestion(
  $condition: ModelDocumentQuestionConditionInput
  $input: UpdateDocumentQuestionInput!
) {
  updateDocumentQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateDocumentQuestionMutationVariables,
  APITypes.UpdateDocumentQuestionMutation
>;
export const updateDocumentWord = /* GraphQL */ `mutation UpdateDocumentWord(
  $condition: ModelDocumentWordConditionInput
  $input: UpdateDocumentWordInput!
) {
  updateDocumentWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateDocumentWordMutationVariables,
  APITypes.UpdateDocumentWordMutation
>;
export const updateFile = /* GraphQL */ `mutation UpdateFile(
  $condition: ModelFileConditionInput
  $input: UpdateFileInput!
) {
  updateFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateFileMutationVariables,
  APITypes.UpdateFileMutation
>;
export const updateGrade = /* GraphQL */ `mutation UpdateGrade(
  $condition: ModelGradeConditionInput
  $input: UpdateGradeInput!
) {
  updateGrade(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateGradeMutationVariables,
  APITypes.UpdateGradeMutation
>;
export const updateParsedContent = /* GraphQL */ `mutation UpdateParsedContent(
  $condition: ModelParsedContentConditionInput
  $input: UpdateParsedContentInput!
) {
  updateParsedContent(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateParsedContentMutationVariables,
  APITypes.UpdateParsedContentMutation
>;
export const updateQuestion = /* GraphQL */ `mutation UpdateQuestion(
  $condition: ModelQuestionConditionInput
  $input: UpdateQuestionInput!
) {
  updateQuestion(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateQuestionMutationVariables,
  APITypes.UpdateQuestionMutation
>;
export const updateQuestionFile = /* GraphQL */ `mutation UpdateQuestionFile(
  $condition: ModelQuestionFileConditionInput
  $input: UpdateQuestionFileInput!
) {
  updateQuestionFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateQuestionFileMutationVariables,
  APITypes.UpdateQuestionFileMutation
>;
export const updateQuestionUnit = /* GraphQL */ `mutation UpdateQuestionUnit(
  $condition: ModelQuestionUnitConditionInput
  $input: UpdateQuestionUnitInput!
) {
  updateQuestionUnit(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateQuestionUnitMutationVariables,
  APITypes.UpdateQuestionUnitMutation
>;
export const updateQuestionWord = /* GraphQL */ `mutation UpdateQuestionWord(
  $condition: ModelQuestionWordConditionInput
  $input: UpdateQuestionWordInput!
) {
  updateQuestionWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateQuestionWordMutationVariables,
  APITypes.UpdateQuestionWordMutation
>;
export const updateSection = /* GraphQL */ `mutation UpdateSection(
  $condition: ModelSectionConditionInput
  $input: UpdateSectionInput!
) {
  updateSection(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSectionMutationVariables,
  APITypes.UpdateSectionMutation
>;
export const updateSettings = /* GraphQL */ `mutation UpdateSettings(
  $condition: ModelSettingsConditionInput
  $input: UpdateSettingsInput!
) {
  updateSettings(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSettingsMutationVariables,
  APITypes.UpdateSettingsMutation
>;
export const updateUnit = /* GraphQL */ `mutation UpdateUnit(
  $condition: ModelUnitConditionInput
  $input: UpdateUnitInput!
) {
  updateUnit(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUnitMutationVariables,
  APITypes.UpdateUnitMutation
>;
export const updateUnitDocument = /* GraphQL */ `mutation UpdateUnitDocument(
  $condition: ModelUnitDocumentConditionInput
  $input: UpdateUnitDocumentInput!
) {
  updateUnitDocument(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUnitDocumentMutationVariables,
  APITypes.UpdateUnitDocumentMutation
>;
export const updateUnitFile = /* GraphQL */ `mutation UpdateUnitFile(
  $condition: ModelUnitFileConditionInput
  $input: UpdateUnitFileInput!
) {
  updateUnitFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUnitFileMutationVariables,
  APITypes.UpdateUnitFileMutation
>;
export const updateUnitWord = /* GraphQL */ `mutation UpdateUnitWord(
  $condition: ModelUnitWordConditionInput
  $input: UpdateUnitWordInput!
) {
  updateUnitWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUnitWordMutationVariables,
  APITypes.UpdateUnitWordMutation
>;
export const updateWord = /* GraphQL */ `mutation UpdateWord(
  $condition: ModelWordConditionInput
  $input: UpdateWordInput!
) {
  updateWord(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateWordMutationVariables,
  APITypes.UpdateWordMutation
>;
export const updateWordFile = /* GraphQL */ `mutation UpdateWordFile(
  $condition: ModelWordFileConditionInput
  $input: UpdateWordFileInput!
) {
  updateWordFile(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateWordFileMutationVariables,
  APITypes.UpdateWordFileMutation
>;
export const useAssistantEditor = /* GraphQL */ `mutation UseAssistantEditor(
  $assistantId: String!
  $threadId: String!
  $threadInstructions: String!
) {
  useAssistantEditor(
    assistantId: $assistantId
    threadId: $threadId
    threadInstructions: $threadInstructions
  )
}
` as GeneratedMutation<
  APITypes.UseAssistantEditorMutationVariables,
  APITypes.UseAssistantEditorMutation
>;
