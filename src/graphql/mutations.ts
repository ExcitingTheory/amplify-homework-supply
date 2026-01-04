/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../../amplify/backend/function/analyzeDocument/src/src/API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createSectionGroup = /* GraphQL */ `mutation CreateSectionGroup($name: String!, $description: String!) {
  createSectionGroup(name: $name, description: $description)
}
` as GeneratedMutation<
  APITypes.CreateSectionGroupMutationVariables,
  APITypes.CreateSectionGroupMutation
>;
export const addSelfToSection = /* GraphQL */ `mutation AddSelfToSection($code: String!) {
  addSelfToSection(code: $code)
}
` as GeneratedMutation<
  APITypes.AddSelfToSectionMutationVariables,
  APITypes.AddSelfToSectionMutation
>;
export const chat = /* GraphQL */ `mutation Chat($messages: String!, $model: String) {
  chat(messages: $messages, model: $model)
}
` as GeneratedMutation<APITypes.ChatMutationVariables, APITypes.ChatMutation>;
export const generateAudio = /* GraphQL */ `mutation GenerateAudio($phrase: String!, $voice: String, $model: String) {
  generateAudio(phrase: $phrase, voice: $voice, model: $model)
}
` as GeneratedMutation<
  APITypes.GenerateAudioMutationVariables,
  APITypes.GenerateAudioMutation
>;
export const generateAudioFile = /* GraphQL */ `mutation GenerateAudioFile($phrase: String!, $voice: String!, $model: String!) {
  generateAudioFile(phrase: $phrase, voice: $voice, model: $model) {
    id
    name
    owner
    identityId
    description
    prompt
    model
    variant
    mimeType
    level
    path
    duration
    size
    generated
    hex
    byHex
    thumbnail
    waveformData
    embedding
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    units {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateAudioFileMutationVariables,
  APITypes.GenerateAudioFileMutation
>;
export const generateImage = /* GraphQL */ `mutation GenerateImage($phrase: String!, $model: String) {
  generateImage(phrase: $phrase, model: $model)
}
` as GeneratedMutation<
  APITypes.GenerateImageMutationVariables,
  APITypes.GenerateImageMutation
>;
export const generateImageFile = /* GraphQL */ `mutation GenerateImageFile($phrase: String!, $model: String) {
  generateImageFile(phrase: $phrase, model: $model) {
    id
    name
    owner
    identityId
    description
    prompt
    model
    variant
    mimeType
    level
    path
    duration
    size
    generated
    hex
    byHex
    thumbnail
    waveformData
    embedding
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    units {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateImageFileMutationVariables,
  APITypes.GenerateImageFileMutation
>;
export const predictUnitData = /* GraphQL */ `mutation PredictUnitData($unitID: ID!) {
  predictUnitData(unitID: $unitID)
}
` as GeneratedMutation<
  APITypes.PredictUnitDataMutationVariables,
  APITypes.PredictUnitDataMutation
>;
export const predictUnitByData = /* GraphQL */ `mutation PredictUnitByData($data: String!) {
  predictUnitByData(data: $data)
}
` as GeneratedMutation<
  APITypes.PredictUnitByDataMutationVariables,
  APITypes.PredictUnitByDataMutation
>;
export const useAssistantEditor = /* GraphQL */ `mutation UseAssistantEditor(
  $threadInstructions: String!
  $assistantId: String!
  $threadId: String!
) {
  useAssistantEditor(
    threadInstructions: $threadInstructions
    assistantId: $assistantId
    threadId: $threadId
  )
}
` as GeneratedMutation<
  APITypes.UseAssistantEditorMutationVariables,
  APITypes.UseAssistantEditorMutation
>;
export const initAssistantEditor = /* GraphQL */ `mutation InitAssistantEditor(
  $model: String!
  $additionalInstructions: String!
) {
  initAssistantEditor(
    model: $model
    additionalInstructions: $additionalInstructions
  )
}
` as GeneratedMutation<
  APITypes.InitAssistantEditorMutationVariables,
  APITypes.InitAssistantEditorMutation
>;
export const updateAssistantEditor = /* GraphQL */ `mutation UpdateAssistantEditor(
  $assistantId: String!
  $additionalInstructions: String!
  $model: String
) {
  updateAssistantEditor(
    assistantId: $assistantId
    additionalInstructions: $additionalInstructions
    model: $model
  )
}
` as GeneratedMutation<
  APITypes.UpdateAssistantEditorMutationVariables,
  APITypes.UpdateAssistantEditorMutation
>;
export const deleteAssistantEditor = /* GraphQL */ `mutation DeleteAssistantEditor($assistantId: String!, $threadId: String!) {
  deleteAssistantEditor(assistantId: $assistantId, threadId: $threadId)
}
` as GeneratedMutation<
  APITypes.DeleteAssistantEditorMutationVariables,
  APITypes.DeleteAssistantEditorMutation
>;
export const chatAssistantThread = /* GraphQL */ `mutation ChatAssistantThread($assistantId: String!, $messages: String!) {
  chatAssistantThread(assistantId: $assistantId, messages: $messages)
}
` as GeneratedMutation<
  APITypes.ChatAssistantThreadMutationVariables,
  APITypes.ChatAssistantThreadMutation
>;
export const analyzeDocument = /* GraphQL */ `mutation AnalyzeDocument($fileID: ID!) {
  analyzeDocument(fileID: $fileID) {
    success
    fileID
    documentID
    responseId
    pageCount
    progress
    message
    __typename
  }
}
` as GeneratedMutation<
  APITypes.AnalyzeDocumentMutationVariables,
  APITypes.AnalyzeDocumentMutation
>;
export const cancelDocumentAnalysis = /* GraphQL */ `mutation CancelDocumentAnalysis($fileID: ID!) {
  cancelDocumentAnalysis(fileID: $fileID) {
    success
    fileID
    documentID
    message
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CancelDocumentAnalysisMutationVariables,
  APITypes.CancelDocumentAnalysisMutation
>;
export const generateEmbeddings = /* GraphQL */ `mutation GenerateEmbeddings($fileID: ID!) {
  generateEmbeddings(fileID: $fileID) {
    success
    fileID
    documentID
    embeddingCount
    message
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateEmbeddingsMutationVariables,
  APITypes.GenerateEmbeddingsMutation
>;
export const generateEmbedding = /* GraphQL */ `mutation GenerateEmbedding(
  $content: String!
  $model: String
  $dimensions: Int
) {
  generateEmbedding(content: $content, model: $model, dimensions: $dimensions) {
    embedding
    model
    dimensions
    tokenCount
    error
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateEmbeddingMutationVariables,
  APITypes.GenerateEmbeddingMutation
>;
export const createAssistant = /* GraphQL */ `mutation CreateAssistant(
  $input: CreateAssistantInput!
  $condition: ModelAssistantConditionInput
) {
  createAssistant(input: $input, condition: $condition) {
    id
    model
    assistantId
    threadInstructions
    additionalInstructions
    messages
    moderationFlag
    identityId
    threadId
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAssistantMutationVariables,
  APITypes.CreateAssistantMutation
>;
export const updateAssistant = /* GraphQL */ `mutation UpdateAssistant(
  $input: UpdateAssistantInput!
  $condition: ModelAssistantConditionInput
) {
  updateAssistant(input: $input, condition: $condition) {
    id
    model
    assistantId
    threadInstructions
    additionalInstructions
    messages
    moderationFlag
    identityId
    threadId
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAssistantMutationVariables,
  APITypes.UpdateAssistantMutation
>;
export const deleteAssistant = /* GraphQL */ `mutation DeleteAssistant(
  $input: DeleteAssistantInput!
  $condition: ModelAssistantConditionInput
) {
  deleteAssistant(input: $input, condition: $condition) {
    id
    model
    assistantId
    threadInstructions
    additionalInstructions
    messages
    moderationFlag
    identityId
    threadId
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAssistantMutationVariables,
  APITypes.DeleteAssistantMutation
>;
export const createQuestion = /* GraphQL */ `mutation CreateQuestion(
  $input: CreateQuestionInput!
  $condition: ModelQuestionConditionInput
) {
  createQuestion(input: $input, condition: $condition) {
    id
    owner
    identityId
    answer
    choices {
      choice
      correct
      __typename
    }
    hint
    prompt
    audio
    audioWaveformData
    answerAudio
    answerAudioWaveformData
    generated
    model
    promptHex
    byPromptHex
    thumbnail
    difficulty
    metadata
    importedAt
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    units {
      items {
        id
        questionId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        questionId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    files {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        questionId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuestionMutationVariables,
  APITypes.CreateQuestionMutation
>;
export const updateQuestion = /* GraphQL */ `mutation UpdateQuestion(
  $input: UpdateQuestionInput!
  $condition: ModelQuestionConditionInput
) {
  updateQuestion(input: $input, condition: $condition) {
    id
    owner
    identityId
    answer
    choices {
      choice
      correct
      __typename
    }
    hint
    prompt
    audio
    audioWaveformData
    answerAudio
    answerAudioWaveformData
    generated
    model
    promptHex
    byPromptHex
    thumbnail
    difficulty
    metadata
    importedAt
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    units {
      items {
        id
        questionId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        questionId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    files {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        questionId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuestionMutationVariables,
  APITypes.UpdateQuestionMutation
>;
export const deleteQuestion = /* GraphQL */ `mutation DeleteQuestion(
  $input: DeleteQuestionInput!
  $condition: ModelQuestionConditionInput
) {
  deleteQuestion(input: $input, condition: $condition) {
    id
    owner
    identityId
    answer
    choices {
      choice
      correct
      __typename
    }
    hint
    prompt
    audio
    audioWaveformData
    answerAudio
    answerAudioWaveformData
    generated
    model
    promptHex
    byPromptHex
    thumbnail
    difficulty
    metadata
    importedAt
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    units {
      items {
        id
        questionId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        questionId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    files {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        questionId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuestionMutationVariables,
  APITypes.DeleteQuestionMutation
>;
export const createFile = /* GraphQL */ `mutation CreateFile(
  $input: CreateFileInput!
  $condition: ModelFileConditionInput
) {
  createFile(input: $input, condition: $condition) {
    id
    name
    owner
    identityId
    description
    prompt
    model
    variant
    mimeType
    level
    path
    duration
    size
    generated
    hex
    byHex
    thumbnail
    waveformData
    embedding
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    units {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateFileMutationVariables,
  APITypes.CreateFileMutation
>;
export const updateFile = /* GraphQL */ `mutation UpdateFile(
  $input: UpdateFileInput!
  $condition: ModelFileConditionInput
) {
  updateFile(input: $input, condition: $condition) {
    id
    name
    owner
    identityId
    description
    prompt
    model
    variant
    mimeType
    level
    path
    duration
    size
    generated
    hex
    byHex
    thumbnail
    waveformData
    embedding
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    units {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateFileMutationVariables,
  APITypes.UpdateFileMutation
>;
export const deleteFile = /* GraphQL */ `mutation DeleteFile(
  $input: DeleteFileInput!
  $condition: ModelFileConditionInput
) {
  deleteFile(input: $input, condition: $condition) {
    id
    name
    owner
    identityId
    description
    prompt
    model
    variant
    mimeType
    level
    path
    duration
    size
    generated
    hex
    byHex
    thumbnail
    waveformData
    embedding
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    units {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        fileId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteFileMutationVariables,
  APITypes.DeleteFileMutation
>;
export const createChatHistory = /* GraphQL */ `mutation CreateChatHistory(
  $input: CreateChatHistoryInput!
  $condition: ModelChatHistoryConditionInput
) {
  createChatHistory(input: $input, condition: $condition) {
    id
    owner
    messages
    model
    inputTokens
    outputTokens
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateChatHistoryMutationVariables,
  APITypes.CreateChatHistoryMutation
>;
export const updateChatHistory = /* GraphQL */ `mutation UpdateChatHistory(
  $input: UpdateChatHistoryInput!
  $condition: ModelChatHistoryConditionInput
) {
  updateChatHistory(input: $input, condition: $condition) {
    id
    owner
    messages
    model
    inputTokens
    outputTokens
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateChatHistoryMutationVariables,
  APITypes.UpdateChatHistoryMutation
>;
export const deleteChatHistory = /* GraphQL */ `mutation DeleteChatHistory(
  $input: DeleteChatHistoryInput!
  $condition: ModelChatHistoryConditionInput
) {
  deleteChatHistory(input: $input, condition: $condition) {
    id
    owner
    messages
    model
    inputTokens
    outputTokens
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteChatHistoryMutationVariables,
  APITypes.DeleteChatHistoryMutation
>;
export const createSection = /* GraphQL */ `mutation CreateSection(
  $input: CreateSectionInput!
  $condition: ModelSectionConditionInput
) {
  createSection(input: $input, condition: $condition) {
    id
    name
    owner
    learner
    description
    status
    code
    assignments {
      items {
        id
        dueDate
        learner
        owner
        status
        sectionID
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    featuredImage
    identityId
    thumbnail
    backgroundColor
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSectionMutationVariables,
  APITypes.CreateSectionMutation
>;
export const updateSection = /* GraphQL */ `mutation UpdateSection(
  $input: UpdateSectionInput!
  $condition: ModelSectionConditionInput
) {
  updateSection(input: $input, condition: $condition) {
    id
    name
    owner
    learner
    description
    status
    code
    assignments {
      items {
        id
        dueDate
        learner
        owner
        status
        sectionID
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    featuredImage
    identityId
    thumbnail
    backgroundColor
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSectionMutationVariables,
  APITypes.UpdateSectionMutation
>;
export const deleteSection = /* GraphQL */ `mutation DeleteSection(
  $input: DeleteSectionInput!
  $condition: ModelSectionConditionInput
) {
  deleteSection(input: $input, condition: $condition) {
    id
    name
    owner
    learner
    description
    status
    code
    assignments {
      items {
        id
        dueDate
        learner
        owner
        status
        sectionID
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    featuredImage
    identityId
    thumbnail
    backgroundColor
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSectionMutationVariables,
  APITypes.DeleteSectionMutation
>;
export const createAssignment = /* GraphQL */ `mutation CreateAssignment(
  $input: CreateAssignmentInput!
  $condition: ModelAssignmentConditionInput
) {
  createAssignment(input: $input, condition: $condition) {
    id
    dueDate
    learner
    owner
    status
    sectionID
    unitID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAssignmentMutationVariables,
  APITypes.CreateAssignmentMutation
>;
export const updateAssignment = /* GraphQL */ `mutation UpdateAssignment(
  $input: UpdateAssignmentInput!
  $condition: ModelAssignmentConditionInput
) {
  updateAssignment(input: $input, condition: $condition) {
    id
    dueDate
    learner
    owner
    status
    sectionID
    unitID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAssignmentMutationVariables,
  APITypes.UpdateAssignmentMutation
>;
export const deleteAssignment = /* GraphQL */ `mutation DeleteAssignment(
  $input: DeleteAssignmentInput!
  $condition: ModelAssignmentConditionInput
) {
  deleteAssignment(input: $input, condition: $condition) {
    id
    dueDate
    learner
    owner
    status
    sectionID
    unitID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAssignmentMutationVariables,
  APITypes.DeleteAssignmentMutation
>;
export const createGrade = /* GraphQL */ `mutation CreateGrade(
  $input: CreateGradeInput!
  $condition: ModelGradeConditionInput
) {
  createGrade(input: $input, condition: $condition) {
    id
    percentComplete
    accuracy
    timerStarted
    complete
    owner
    identityId
    instructor
    unitVersion
    data
    feedback
    files
    unitID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateGradeMutationVariables,
  APITypes.CreateGradeMutation
>;
export const updateGrade = /* GraphQL */ `mutation UpdateGrade(
  $input: UpdateGradeInput!
  $condition: ModelGradeConditionInput
) {
  updateGrade(input: $input, condition: $condition) {
    id
    percentComplete
    accuracy
    timerStarted
    complete
    owner
    identityId
    instructor
    unitVersion
    data
    feedback
    files
    unitID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateGradeMutationVariables,
  APITypes.UpdateGradeMutation
>;
export const deleteGrade = /* GraphQL */ `mutation DeleteGrade(
  $input: DeleteGradeInput!
  $condition: ModelGradeConditionInput
) {
  deleteGrade(input: $input, condition: $condition) {
    id
    percentComplete
    accuracy
    timerStarted
    complete
    owner
    identityId
    instructor
    unitVersion
    data
    feedback
    files
    unitID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteGradeMutationVariables,
  APITypes.DeleteGradeMutation
>;
export const createUnit = /* GraphQL */ `mutation CreateUnit(
  $input: CreateUnitInput!
  $condition: ModelUnitConditionInput
) {
  createUnit(input: $input, condition: $condition) {
    id
    number
    name
    owner
    description
    data
    status
    timeLimitSeconds
    assignments {
      items {
        id
        dueDate
        learner
        owner
        status
        sectionID
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    grades {
      items {
        id
        percentComplete
        accuracy
        timerStarted
        complete
        owner
        identityId
        instructor
        unitVersion
        data
        feedback
        files
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    featuredImage
    identityId
    thumbnail
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    publishedAt
    isDraft
    files {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        unitId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        unitId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    agentJobs {
      items {
        id
        owner
        identityId
        type
        status
        documentID
        unitID
        responseId
        webhookData
        error
        startedAt
        completedAt
        modelUsed
        tokensUsed
        estimatedCost
        retryCount
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUnitMutationVariables,
  APITypes.CreateUnitMutation
>;
export const updateUnit = /* GraphQL */ `mutation UpdateUnit(
  $input: UpdateUnitInput!
  $condition: ModelUnitConditionInput
) {
  updateUnit(input: $input, condition: $condition) {
    id
    number
    name
    owner
    description
    data
    status
    timeLimitSeconds
    assignments {
      items {
        id
        dueDate
        learner
        owner
        status
        sectionID
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    grades {
      items {
        id
        percentComplete
        accuracy
        timerStarted
        complete
        owner
        identityId
        instructor
        unitVersion
        data
        feedback
        files
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    featuredImage
    identityId
    thumbnail
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    publishedAt
    isDraft
    files {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        unitId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        unitId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    agentJobs {
      items {
        id
        owner
        identityId
        type
        status
        documentID
        unitID
        responseId
        webhookData
        error
        startedAt
        completedAt
        modelUsed
        tokensUsed
        estimatedCost
        retryCount
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUnitMutationVariables,
  APITypes.UpdateUnitMutation
>;
export const deleteUnit = /* GraphQL */ `mutation DeleteUnit(
  $input: DeleteUnitInput!
  $condition: ModelUnitConditionInput
) {
  deleteUnit(input: $input, condition: $condition) {
    id
    number
    name
    owner
    description
    data
    status
    timeLimitSeconds
    assignments {
      items {
        id
        dueDate
        learner
        owner
        status
        sectionID
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    grades {
      items {
        id
        percentComplete
        accuracy
        timerStarted
        complete
        owner
        identityId
        instructor
        unitVersion
        data
        feedback
        files
        unitID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    featuredImage
    identityId
    thumbnail
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    publishedAt
    isDraft
    files {
      items {
        id
        fileId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        unitId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        unitId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        unitId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    agentJobs {
      items {
        id
        owner
        identityId
        type
        status
        documentID
        unitID
        responseId
        webhookData
        error
        startedAt
        completedAt
        modelUsed
        tokensUsed
        estimatedCost
        retryCount
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUnitMutationVariables,
  APITypes.DeleteUnitMutation
>;
export const createWord = /* GraphQL */ `mutation CreateWord(
  $input: CreateWordInput!
  $condition: ModelWordConditionInput
) {
  createWord(input: $input, condition: $condition) {
    id
    phrase
    owner
    identityId
    pronunciation
    definition
    audio
    waveformData
    definitionAudio
    definitionWaveformData
    rubyTags
    importedAt
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    units {
      items {
        id
        unitId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    files {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        wordId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateWordMutationVariables,
  APITypes.CreateWordMutation
>;
export const updateWord = /* GraphQL */ `mutation UpdateWord(
  $input: UpdateWordInput!
  $condition: ModelWordConditionInput
) {
  updateWord(input: $input, condition: $condition) {
    id
    phrase
    owner
    identityId
    pronunciation
    definition
    audio
    waveformData
    definitionAudio
    definitionWaveformData
    rubyTags
    importedAt
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    units {
      items {
        id
        unitId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    files {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        wordId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateWordMutationVariables,
  APITypes.UpdateWordMutation
>;
export const deleteWord = /* GraphQL */ `mutation DeleteWord(
  $input: DeleteWordInput!
  $condition: ModelWordConditionInput
) {
  deleteWord(input: $input, condition: $condition) {
    id
    phrase
    owner
    identityId
    pronunciation
    definition
    audio
    waveformData
    definitionAudio
    definitionWaveformData
    rubyTags
    importedAt
    embedding
    embeddingModel
    embeddingDimensions
    embeddingVersion
    embeddingWordCount
    units {
      items {
        id
        unitId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    files {
      items {
        id
        fileId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        wordId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    documents {
      items {
        id
        wordId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteWordMutationVariables,
  APITypes.DeleteWordMutation
>;
export const createDocument = /* GraphQL */ `mutation CreateDocument(
  $input: CreateDocumentInput!
  $condition: ModelDocumentConditionInput
) {
  createDocument(input: $input, condition: $condition) {
    id
    filename
    s3Key
    status
    owner
    identityId
    learner
    extractedText
    pageCount
    fileSize
    mimeType
    uploadedAt
    resumeState
    pageEmbeddings {
      page
      embedding
      text
      __typename
    }
    parsedContent {
      items {
        id
        owner
        identityId
        documentID
        vocabularyJSON
        summariesJSON
        objectivesJSON
        conceptsJSON
        questionsJSON
        responseId
        modelUsed
        tokensUsed
        processingTime
        createdAt
        importedAt
        metadata
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    agentJobs {
      items {
        id
        owner
        identityId
        type
        status
        documentID
        unitID
        responseId
        webhookData
        error
        startedAt
        completedAt
        modelUsed
        tokensUsed
        estimatedCost
        retryCount
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    metadata
    units {
      items {
        id
        unitId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        wordId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateDocumentMutationVariables,
  APITypes.CreateDocumentMutation
>;
export const updateDocument = /* GraphQL */ `mutation UpdateDocument(
  $input: UpdateDocumentInput!
  $condition: ModelDocumentConditionInput
) {
  updateDocument(input: $input, condition: $condition) {
    id
    filename
    s3Key
    status
    owner
    identityId
    learner
    extractedText
    pageCount
    fileSize
    mimeType
    uploadedAt
    resumeState
    pageEmbeddings {
      page
      embedding
      text
      __typename
    }
    parsedContent {
      items {
        id
        owner
        identityId
        documentID
        vocabularyJSON
        summariesJSON
        objectivesJSON
        conceptsJSON
        questionsJSON
        responseId
        modelUsed
        tokensUsed
        processingTime
        createdAt
        importedAt
        metadata
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    agentJobs {
      items {
        id
        owner
        identityId
        type
        status
        documentID
        unitID
        responseId
        webhookData
        error
        startedAt
        completedAt
        modelUsed
        tokensUsed
        estimatedCost
        retryCount
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    metadata
    units {
      items {
        id
        unitId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        wordId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateDocumentMutationVariables,
  APITypes.UpdateDocumentMutation
>;
export const deleteDocument = /* GraphQL */ `mutation DeleteDocument(
  $input: DeleteDocumentInput!
  $condition: ModelDocumentConditionInput
) {
  deleteDocument(input: $input, condition: $condition) {
    id
    filename
    s3Key
    status
    owner
    identityId
    learner
    extractedText
    pageCount
    fileSize
    mimeType
    uploadedAt
    resumeState
    pageEmbeddings {
      page
      embedding
      text
      __typename
    }
    parsedContent {
      items {
        id
        owner
        identityId
        documentID
        vocabularyJSON
        summariesJSON
        objectivesJSON
        conceptsJSON
        questionsJSON
        responseId
        modelUsed
        tokensUsed
        processingTime
        createdAt
        importedAt
        metadata
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    agentJobs {
      items {
        id
        owner
        identityId
        type
        status
        documentID
        unitID
        responseId
        webhookData
        error
        startedAt
        completedAt
        modelUsed
        tokensUsed
        estimatedCost
        retryCount
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    metadata
    units {
      items {
        id
        unitId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    words {
      items {
        id
        wordId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    questions {
      items {
        id
        questionId
        documentId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteDocumentMutationVariables,
  APITypes.DeleteDocumentMutation
>;
export const createParsedContent = /* GraphQL */ `mutation CreateParsedContent(
  $input: CreateParsedContentInput!
  $condition: ModelParsedContentConditionInput
) {
  createParsedContent(input: $input, condition: $condition) {
    id
    owner
    identityId
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    vocabularyJSON
    summariesJSON
    objectivesJSON
    conceptsJSON
    questionsJSON
    responseId
    modelUsed
    tokensUsed
    processingTime
    createdAt
    importedAt
    metadata
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateParsedContentMutationVariables,
  APITypes.CreateParsedContentMutation
>;
export const updateParsedContent = /* GraphQL */ `mutation UpdateParsedContent(
  $input: UpdateParsedContentInput!
  $condition: ModelParsedContentConditionInput
) {
  updateParsedContent(input: $input, condition: $condition) {
    id
    owner
    identityId
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    vocabularyJSON
    summariesJSON
    objectivesJSON
    conceptsJSON
    questionsJSON
    responseId
    modelUsed
    tokensUsed
    processingTime
    createdAt
    importedAt
    metadata
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateParsedContentMutationVariables,
  APITypes.UpdateParsedContentMutation
>;
export const deleteParsedContent = /* GraphQL */ `mutation DeleteParsedContent(
  $input: DeleteParsedContentInput!
  $condition: ModelParsedContentConditionInput
) {
  deleteParsedContent(input: $input, condition: $condition) {
    id
    owner
    identityId
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    vocabularyJSON
    summariesJSON
    objectivesJSON
    conceptsJSON
    questionsJSON
    responseId
    modelUsed
    tokensUsed
    processingTime
    createdAt
    importedAt
    metadata
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteParsedContentMutationVariables,
  APITypes.DeleteParsedContentMutation
>;
export const createAgentJob = /* GraphQL */ `mutation CreateAgentJob(
  $input: CreateAgentJobInput!
  $condition: ModelAgentJobConditionInput
) {
  createAgentJob(input: $input, condition: $condition) {
    id
    owner
    identityId
    type
    status
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unitID
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    responseId
    webhookData
    error
    startedAt
    completedAt
    modelUsed
    tokensUsed
    estimatedCost
    retryCount
    metadata
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAgentJobMutationVariables,
  APITypes.CreateAgentJobMutation
>;
export const updateAgentJob = /* GraphQL */ `mutation UpdateAgentJob(
  $input: UpdateAgentJobInput!
  $condition: ModelAgentJobConditionInput
) {
  updateAgentJob(input: $input, condition: $condition) {
    id
    owner
    identityId
    type
    status
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unitID
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    responseId
    webhookData
    error
    startedAt
    completedAt
    modelUsed
    tokensUsed
    estimatedCost
    retryCount
    metadata
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAgentJobMutationVariables,
  APITypes.UpdateAgentJobMutation
>;
export const deleteAgentJob = /* GraphQL */ `mutation DeleteAgentJob(
  $input: DeleteAgentJobInput!
  $condition: ModelAgentJobConditionInput
) {
  deleteAgentJob(input: $input, condition: $condition) {
    id
    owner
    identityId
    type
    status
    documentID
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unitID
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    responseId
    webhookData
    error
    startedAt
    completedAt
    modelUsed
    tokensUsed
    estimatedCost
    retryCount
    metadata
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAgentJobMutationVariables,
  APITypes.DeleteAgentJobMutation
>;
export const createSettings = /* GraphQL */ `mutation CreateSettings(
  $input: CreateSettingsInput!
  $condition: ModelSettingsConditionInput
) {
  createSettings(input: $input, condition: $condition) {
    id
    owner
    identityId
    autoAnalyzeDocuments
    documentAnalysisModel
    editorTheme
    editorFontSize
    defaultAIModel
    assistantVoice
    emailNotifications
    webhookNotifications
    language
    timezone
    metadata
    updatedAt
    createdAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSettingsMutationVariables,
  APITypes.CreateSettingsMutation
>;
export const updateSettings = /* GraphQL */ `mutation UpdateSettings(
  $input: UpdateSettingsInput!
  $condition: ModelSettingsConditionInput
) {
  updateSettings(input: $input, condition: $condition) {
    id
    owner
    identityId
    autoAnalyzeDocuments
    documentAnalysisModel
    editorTheme
    editorFontSize
    defaultAIModel
    assistantVoice
    emailNotifications
    webhookNotifications
    language
    timezone
    metadata
    updatedAt
    createdAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSettingsMutationVariables,
  APITypes.UpdateSettingsMutation
>;
export const deleteSettings = /* GraphQL */ `mutation DeleteSettings(
  $input: DeleteSettingsInput!
  $condition: ModelSettingsConditionInput
) {
  deleteSettings(input: $input, condition: $condition) {
    id
    owner
    identityId
    autoAnalyzeDocuments
    documentAnalysisModel
    editorTheme
    editorFontSize
    defaultAIModel
    assistantVoice
    emailNotifications
    webhookNotifications
    language
    timezone
    metadata
    updatedAt
    createdAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSettingsMutationVariables,
  APITypes.DeleteSettingsMutation
>;
export const createQuestionUnit = /* GraphQL */ `mutation CreateQuestionUnit(
  $input: CreateQuestionUnitInput!
  $condition: ModelQuestionUnitConditionInput
) {
  createQuestionUnit(input: $input, condition: $condition) {
    id
    questionId
    unitId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuestionUnitMutationVariables,
  APITypes.CreateQuestionUnitMutation
>;
export const updateQuestionUnit = /* GraphQL */ `mutation UpdateQuestionUnit(
  $input: UpdateQuestionUnitInput!
  $condition: ModelQuestionUnitConditionInput
) {
  updateQuestionUnit(input: $input, condition: $condition) {
    id
    questionId
    unitId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuestionUnitMutationVariables,
  APITypes.UpdateQuestionUnitMutation
>;
export const deleteQuestionUnit = /* GraphQL */ `mutation DeleteQuestionUnit(
  $input: DeleteQuestionUnitInput!
  $condition: ModelQuestionUnitConditionInput
) {
  deleteQuestionUnit(input: $input, condition: $condition) {
    id
    questionId
    unitId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuestionUnitMutationVariables,
  APITypes.DeleteQuestionUnitMutation
>;
export const createQuestionWord = /* GraphQL */ `mutation CreateQuestionWord(
  $input: CreateQuestionWordInput!
  $condition: ModelQuestionWordConditionInput
) {
  createQuestionWord(input: $input, condition: $condition) {
    id
    questionId
    wordId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuestionWordMutationVariables,
  APITypes.CreateQuestionWordMutation
>;
export const updateQuestionWord = /* GraphQL */ `mutation UpdateQuestionWord(
  $input: UpdateQuestionWordInput!
  $condition: ModelQuestionWordConditionInput
) {
  updateQuestionWord(input: $input, condition: $condition) {
    id
    questionId
    wordId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuestionWordMutationVariables,
  APITypes.UpdateQuestionWordMutation
>;
export const deleteQuestionWord = /* GraphQL */ `mutation DeleteQuestionWord(
  $input: DeleteQuestionWordInput!
  $condition: ModelQuestionWordConditionInput
) {
  deleteQuestionWord(input: $input, condition: $condition) {
    id
    questionId
    wordId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuestionWordMutationVariables,
  APITypes.DeleteQuestionWordMutation
>;
export const createQuestionFile = /* GraphQL */ `mutation CreateQuestionFile(
  $input: CreateQuestionFileInput!
  $condition: ModelQuestionFileConditionInput
) {
  createQuestionFile(input: $input, condition: $condition) {
    id
    questionId
    fileId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuestionFileMutationVariables,
  APITypes.CreateQuestionFileMutation
>;
export const updateQuestionFile = /* GraphQL */ `mutation UpdateQuestionFile(
  $input: UpdateQuestionFileInput!
  $condition: ModelQuestionFileConditionInput
) {
  updateQuestionFile(input: $input, condition: $condition) {
    id
    questionId
    fileId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuestionFileMutationVariables,
  APITypes.UpdateQuestionFileMutation
>;
export const deleteQuestionFile = /* GraphQL */ `mutation DeleteQuestionFile(
  $input: DeleteQuestionFileInput!
  $condition: ModelQuestionFileConditionInput
) {
  deleteQuestionFile(input: $input, condition: $condition) {
    id
    questionId
    fileId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuestionFileMutationVariables,
  APITypes.DeleteQuestionFileMutation
>;
export const createDocumentQuestion = /* GraphQL */ `mutation CreateDocumentQuestion(
  $input: CreateDocumentQuestionInput!
  $condition: ModelDocumentQuestionConditionInput
) {
  createDocumentQuestion(input: $input, condition: $condition) {
    id
    questionId
    documentId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateDocumentQuestionMutationVariables,
  APITypes.CreateDocumentQuestionMutation
>;
export const updateDocumentQuestion = /* GraphQL */ `mutation UpdateDocumentQuestion(
  $input: UpdateDocumentQuestionInput!
  $condition: ModelDocumentQuestionConditionInput
) {
  updateDocumentQuestion(input: $input, condition: $condition) {
    id
    questionId
    documentId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateDocumentQuestionMutationVariables,
  APITypes.UpdateDocumentQuestionMutation
>;
export const deleteDocumentQuestion = /* GraphQL */ `mutation DeleteDocumentQuestion(
  $input: DeleteDocumentQuestionInput!
  $condition: ModelDocumentQuestionConditionInput
) {
  deleteDocumentQuestion(input: $input, condition: $condition) {
    id
    questionId
    documentId
    question {
      id
      owner
      identityId
      answer
      choices {
        choice
        correct
        __typename
      }
      hint
      prompt
      audio
      audioWaveformData
      answerAudio
      answerAudioWaveformData
      generated
      model
      promptHex
      byPromptHex
      thumbnail
      difficulty
      metadata
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteDocumentQuestionMutationVariables,
  APITypes.DeleteDocumentQuestionMutation
>;
export const createUnitFile = /* GraphQL */ `mutation CreateUnitFile(
  $input: CreateUnitFileInput!
  $condition: ModelUnitFileConditionInput
) {
  createUnitFile(input: $input, condition: $condition) {
    id
    fileId
    unitId
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUnitFileMutationVariables,
  APITypes.CreateUnitFileMutation
>;
export const updateUnitFile = /* GraphQL */ `mutation UpdateUnitFile(
  $input: UpdateUnitFileInput!
  $condition: ModelUnitFileConditionInput
) {
  updateUnitFile(input: $input, condition: $condition) {
    id
    fileId
    unitId
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUnitFileMutationVariables,
  APITypes.UpdateUnitFileMutation
>;
export const deleteUnitFile = /* GraphQL */ `mutation DeleteUnitFile(
  $input: DeleteUnitFileInput!
  $condition: ModelUnitFileConditionInput
) {
  deleteUnitFile(input: $input, condition: $condition) {
    id
    fileId
    unitId
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUnitFileMutationVariables,
  APITypes.DeleteUnitFileMutation
>;
export const createWordFile = /* GraphQL */ `mutation CreateWordFile(
  $input: CreateWordFileInput!
  $condition: ModelWordFileConditionInput
) {
  createWordFile(input: $input, condition: $condition) {
    id
    fileId
    wordId
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateWordFileMutationVariables,
  APITypes.CreateWordFileMutation
>;
export const updateWordFile = /* GraphQL */ `mutation UpdateWordFile(
  $input: UpdateWordFileInput!
  $condition: ModelWordFileConditionInput
) {
  updateWordFile(input: $input, condition: $condition) {
    id
    fileId
    wordId
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateWordFileMutationVariables,
  APITypes.UpdateWordFileMutation
>;
export const deleteWordFile = /* GraphQL */ `mutation DeleteWordFile(
  $input: DeleteWordFileInput!
  $condition: ModelWordFileConditionInput
) {
  deleteWordFile(input: $input, condition: $condition) {
    id
    fileId
    wordId
    file {
      id
      name
      owner
      identityId
      description
      prompt
      model
      variant
      mimeType
      level
      path
      duration
      size
      generated
      hex
      byHex
      thumbnail
      waveformData
      embedding
      documentID
      document {
        id
        filename
        s3Key
        status
        owner
        identityId
        learner
        extractedText
        pageCount
        fileSize
        mimeType
        uploadedAt
        resumeState
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteWordFileMutationVariables,
  APITypes.DeleteWordFileMutation
>;
export const createUnitWord = /* GraphQL */ `mutation CreateUnitWord(
  $input: CreateUnitWordInput!
  $condition: ModelUnitWordConditionInput
) {
  createUnitWord(input: $input, condition: $condition) {
    id
    unitId
    wordId
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUnitWordMutationVariables,
  APITypes.CreateUnitWordMutation
>;
export const updateUnitWord = /* GraphQL */ `mutation UpdateUnitWord(
  $input: UpdateUnitWordInput!
  $condition: ModelUnitWordConditionInput
) {
  updateUnitWord(input: $input, condition: $condition) {
    id
    unitId
    wordId
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUnitWordMutationVariables,
  APITypes.UpdateUnitWordMutation
>;
export const deleteUnitWord = /* GraphQL */ `mutation DeleteUnitWord(
  $input: DeleteUnitWordInput!
  $condition: ModelUnitWordConditionInput
) {
  deleteUnitWord(input: $input, condition: $condition) {
    id
    unitId
    wordId
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUnitWordMutationVariables,
  APITypes.DeleteUnitWordMutation
>;
export const createUnitDocument = /* GraphQL */ `mutation CreateUnitDocument(
  $input: CreateUnitDocumentInput!
  $condition: ModelUnitDocumentConditionInput
) {
  createUnitDocument(input: $input, condition: $condition) {
    id
    unitId
    documentId
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUnitDocumentMutationVariables,
  APITypes.CreateUnitDocumentMutation
>;
export const updateUnitDocument = /* GraphQL */ `mutation UpdateUnitDocument(
  $input: UpdateUnitDocumentInput!
  $condition: ModelUnitDocumentConditionInput
) {
  updateUnitDocument(input: $input, condition: $condition) {
    id
    unitId
    documentId
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUnitDocumentMutationVariables,
  APITypes.UpdateUnitDocumentMutation
>;
export const deleteUnitDocument = /* GraphQL */ `mutation DeleteUnitDocument(
  $input: DeleteUnitDocumentInput!
  $condition: ModelUnitDocumentConditionInput
) {
  deleteUnitDocument(input: $input, condition: $condition) {
    id
    unitId
    documentId
    unit {
      id
      number
      name
      owner
      description
      data
      status
      timeLimitSeconds
      assignments {
        nextToken
        startedAt
        __typename
      }
      grades {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      publishedAt
      isDraft
      files {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUnitDocumentMutationVariables,
  APITypes.DeleteUnitDocumentMutation
>;
export const createDocumentWord = /* GraphQL */ `mutation CreateDocumentWord(
  $input: CreateDocumentWordInput!
  $condition: ModelDocumentWordConditionInput
) {
  createDocumentWord(input: $input, condition: $condition) {
    id
    wordId
    documentId
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateDocumentWordMutationVariables,
  APITypes.CreateDocumentWordMutation
>;
export const updateDocumentWord = /* GraphQL */ `mutation UpdateDocumentWord(
  $input: UpdateDocumentWordInput!
  $condition: ModelDocumentWordConditionInput
) {
  updateDocumentWord(input: $input, condition: $condition) {
    id
    wordId
    documentId
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateDocumentWordMutationVariables,
  APITypes.UpdateDocumentWordMutation
>;
export const deleteDocumentWord = /* GraphQL */ `mutation DeleteDocumentWord(
  $input: DeleteDocumentWordInput!
  $condition: ModelDocumentWordConditionInput
) {
  deleteDocumentWord(input: $input, condition: $condition) {
    id
    wordId
    documentId
    word {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      waveformData
      definitionAudio
      definitionWaveformData
      rubyTags
      importedAt
      embedding
      embeddingModel
      embeddingDimensions
      embeddingVersion
      embeddingWordCount
      units {
        nextToken
        startedAt
        __typename
      }
      files {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      documents {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    document {
      id
      filename
      s3Key
      status
      owner
      identityId
      learner
      extractedText
      pageCount
      fileSize
      mimeType
      uploadedAt
      resumeState
      pageEmbeddings {
        page
        embedding
        text
        __typename
      }
      parsedContent {
        nextToken
        startedAt
        __typename
      }
      agentJobs {
        nextToken
        startedAt
        __typename
      }
      metadata
      units {
        nextToken
        startedAt
        __typename
      }
      words {
        nextToken
        startedAt
        __typename
      }
      questions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteDocumentWordMutationVariables,
  APITypes.DeleteDocumentWordMutation
>;
