/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAssistant = /* GraphQL */ `subscription OnCreateAssistant(
  $filter: ModelSubscriptionAssistantFilterInput
  $owner: String
) {
  onCreateAssistant(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAssistantSubscriptionVariables,
  APITypes.OnCreateAssistantSubscription
>;
export const onUpdateAssistant = /* GraphQL */ `subscription OnUpdateAssistant(
  $filter: ModelSubscriptionAssistantFilterInput
  $owner: String
) {
  onUpdateAssistant(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAssistantSubscriptionVariables,
  APITypes.OnUpdateAssistantSubscription
>;
export const onDeleteAssistant = /* GraphQL */ `subscription OnDeleteAssistant(
  $filter: ModelSubscriptionAssistantFilterInput
  $owner: String
) {
  onDeleteAssistant(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAssistantSubscriptionVariables,
  APITypes.OnDeleteAssistantSubscription
>;
export const onCreateQuestion = /* GraphQL */ `subscription OnCreateQuestion(
  $filter: ModelSubscriptionQuestionFilterInput
  $owner: String
) {
  onCreateQuestion(filter: $filter, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateQuestionSubscriptionVariables,
  APITypes.OnCreateQuestionSubscription
>;
export const onUpdateQuestion = /* GraphQL */ `subscription OnUpdateQuestion(
  $filter: ModelSubscriptionQuestionFilterInput
  $owner: String
) {
  onUpdateQuestion(filter: $filter, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionSubscriptionVariables,
  APITypes.OnUpdateQuestionSubscription
>;
export const onDeleteQuestion = /* GraphQL */ `subscription OnDeleteQuestion(
  $filter: ModelSubscriptionQuestionFilterInput
  $owner: String
) {
  onDeleteQuestion(filter: $filter, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionSubscriptionVariables,
  APITypes.OnDeleteQuestionSubscription
>;
export const onCreateFile = /* GraphQL */ `subscription OnCreateFile(
  $filter: ModelSubscriptionFileFilterInput
  $owner: String
) {
  onCreateFile(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
    parsedContentID
    parsedContent {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      fileID
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
        parsedContentID
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
` as GeneratedSubscription<
  APITypes.OnCreateFileSubscriptionVariables,
  APITypes.OnCreateFileSubscription
>;
export const onUpdateFile = /* GraphQL */ `subscription OnUpdateFile(
  $filter: ModelSubscriptionFileFilterInput
  $owner: String
) {
  onUpdateFile(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
    parsedContentID
    parsedContent {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      fileID
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
        parsedContentID
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
` as GeneratedSubscription<
  APITypes.OnUpdateFileSubscriptionVariables,
  APITypes.OnUpdateFileSubscription
>;
export const onDeleteFile = /* GraphQL */ `subscription OnDeleteFile(
  $filter: ModelSubscriptionFileFilterInput
  $owner: String
) {
  onDeleteFile(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
    parsedContentID
    parsedContent {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      fileID
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
        parsedContentID
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
` as GeneratedSubscription<
  APITypes.OnDeleteFileSubscriptionVariables,
  APITypes.OnDeleteFileSubscription
>;
export const onCreateChatHistory = /* GraphQL */ `subscription OnCreateChatHistory(
  $filter: ModelSubscriptionChatHistoryFilterInput
  $owner: String
) {
  onCreateChatHistory(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateChatHistorySubscriptionVariables,
  APITypes.OnCreateChatHistorySubscription
>;
export const onUpdateChatHistory = /* GraphQL */ `subscription OnUpdateChatHistory(
  $filter: ModelSubscriptionChatHistoryFilterInput
  $owner: String
) {
  onUpdateChatHistory(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateChatHistorySubscriptionVariables,
  APITypes.OnUpdateChatHistorySubscription
>;
export const onDeleteChatHistory = /* GraphQL */ `subscription OnDeleteChatHistory(
  $filter: ModelSubscriptionChatHistoryFilterInput
  $owner: String
) {
  onDeleteChatHistory(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteChatHistorySubscriptionVariables,
  APITypes.OnDeleteChatHistorySubscription
>;
export const onCreateSection = /* GraphQL */ `subscription OnCreateSection(
  $filter: ModelSubscriptionSectionFilterInput
  $owner: String
) {
  onCreateSection(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSectionSubscriptionVariables,
  APITypes.OnCreateSectionSubscription
>;
export const onUpdateSection = /* GraphQL */ `subscription OnUpdateSection(
  $filter: ModelSubscriptionSectionFilterInput
  $owner: String
) {
  onUpdateSection(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSectionSubscriptionVariables,
  APITypes.OnUpdateSectionSubscription
>;
export const onDeleteSection = /* GraphQL */ `subscription OnDeleteSection(
  $filter: ModelSubscriptionSectionFilterInput
  $owner: String
) {
  onDeleteSection(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSectionSubscriptionVariables,
  APITypes.OnDeleteSectionSubscription
>;
export const onCreateAssignment = /* GraphQL */ `subscription OnCreateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
  $owner: String
) {
  onCreateAssignment(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAssignmentSubscriptionVariables,
  APITypes.OnCreateAssignmentSubscription
>;
export const onUpdateAssignment = /* GraphQL */ `subscription OnUpdateAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
  $owner: String
) {
  onUpdateAssignment(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAssignmentSubscriptionVariables,
  APITypes.OnUpdateAssignmentSubscription
>;
export const onDeleteAssignment = /* GraphQL */ `subscription OnDeleteAssignment(
  $filter: ModelSubscriptionAssignmentFilterInput
  $owner: String
) {
  onDeleteAssignment(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAssignmentSubscriptionVariables,
  APITypes.OnDeleteAssignmentSubscription
>;
export const onCreateGrade = /* GraphQL */ `subscription OnCreateGrade(
  $filter: ModelSubscriptionGradeFilterInput
  $instructor: String
  $owner: String
) {
  onCreateGrade(filter: $filter, instructor: $instructor, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateGradeSubscriptionVariables,
  APITypes.OnCreateGradeSubscription
>;
export const onUpdateGrade = /* GraphQL */ `subscription OnUpdateGrade(
  $filter: ModelSubscriptionGradeFilterInput
  $instructor: String
  $owner: String
) {
  onUpdateGrade(filter: $filter, instructor: $instructor, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateGradeSubscriptionVariables,
  APITypes.OnUpdateGradeSubscription
>;
export const onDeleteGrade = /* GraphQL */ `subscription OnDeleteGrade(
  $filter: ModelSubscriptionGradeFilterInput
  $instructor: String
  $owner: String
) {
  onDeleteGrade(filter: $filter, instructor: $instructor, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteGradeSubscriptionVariables,
  APITypes.OnDeleteGradeSubscription
>;
export const onCreateUnit = /* GraphQL */ `subscription OnCreateUnit(
  $filter: ModelSubscriptionUnitFilterInput
  $owner: String
) {
  onCreateUnit(filter: $filter, owner: $owner) {
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
        moderationStatus
        moderationFlags
        moderationCheckedAt
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUnitSubscriptionVariables,
  APITypes.OnCreateUnitSubscription
>;
export const onUpdateUnit = /* GraphQL */ `subscription OnUpdateUnit(
  $filter: ModelSubscriptionUnitFilterInput
  $owner: String
) {
  onUpdateUnit(filter: $filter, owner: $owner) {
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
        moderationStatus
        moderationFlags
        moderationCheckedAt
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUnitSubscriptionVariables,
  APITypes.OnUpdateUnitSubscription
>;
export const onDeleteUnit = /* GraphQL */ `subscription OnDeleteUnit(
  $filter: ModelSubscriptionUnitFilterInput
  $owner: String
) {
  onDeleteUnit(filter: $filter, owner: $owner) {
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
        moderationStatus
        moderationFlags
        moderationCheckedAt
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUnitSubscriptionVariables,
  APITypes.OnDeleteUnitSubscription
>;
export const onCreateWord = /* GraphQL */ `subscription OnCreateWord(
  $filter: ModelSubscriptionWordFilterInput
  $owner: String
) {
  onCreateWord(filter: $filter, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateWordSubscriptionVariables,
  APITypes.OnCreateWordSubscription
>;
export const onUpdateWord = /* GraphQL */ `subscription OnUpdateWord(
  $filter: ModelSubscriptionWordFilterInput
  $owner: String
) {
  onUpdateWord(filter: $filter, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateWordSubscriptionVariables,
  APITypes.OnUpdateWordSubscription
>;
export const onDeleteWord = /* GraphQL */ `subscription OnDeleteWord(
  $filter: ModelSubscriptionWordFilterInput
  $owner: String
) {
  onDeleteWord(filter: $filter, owner: $owner) {
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
    moderationStatus
    moderationFlags
    moderationCheckedAt
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteWordSubscriptionVariables,
  APITypes.OnDeleteWordSubscription
>;
export const onCreateDocument = /* GraphQL */ `subscription OnCreateDocument(
  $filter: ModelSubscriptionDocumentFilterInput
  $owner: String
) {
  onCreateDocument(filter: $filter, owner: $owner) {
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
    embeddingsS3Key
    parsedContent {
      items {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnCreateDocumentSubscriptionVariables,
  APITypes.OnCreateDocumentSubscription
>;
export const onUpdateDocument = /* GraphQL */ `subscription OnUpdateDocument(
  $filter: ModelSubscriptionDocumentFilterInput
  $owner: String
) {
  onUpdateDocument(filter: $filter, owner: $owner) {
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
    embeddingsS3Key
    parsedContent {
      items {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentSubscriptionVariables,
  APITypes.OnUpdateDocumentSubscription
>;
export const onDeleteDocument = /* GraphQL */ `subscription OnDeleteDocument(
  $filter: ModelSubscriptionDocumentFilterInput
  $owner: String
) {
  onDeleteDocument(filter: $filter, owner: $owner) {
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
    embeddingsS3Key
    parsedContent {
      items {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentSubscriptionVariables,
  APITypes.OnDeleteDocumentSubscription
>;
export const onCreateParsedContent = /* GraphQL */ `subscription OnCreateParsedContent(
  $filter: ModelSubscriptionParsedContentFilterInput
  $owner: String
) {
  onCreateParsedContent(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
    fileID
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnCreateParsedContentSubscriptionVariables,
  APITypes.OnCreateParsedContentSubscription
>;
export const onUpdateParsedContent = /* GraphQL */ `subscription OnUpdateParsedContent(
  $filter: ModelSubscriptionParsedContentFilterInput
  $owner: String
) {
  onUpdateParsedContent(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
    fileID
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnUpdateParsedContentSubscriptionVariables,
  APITypes.OnUpdateParsedContentSubscription
>;
export const onDeleteParsedContent = /* GraphQL */ `subscription OnDeleteParsedContent(
  $filter: ModelSubscriptionParsedContentFilterInput
  $owner: String
) {
  onDeleteParsedContent(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
    fileID
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnDeleteParsedContentSubscriptionVariables,
  APITypes.OnDeleteParsedContentSubscription
>;
export const onCreateAgentJob = /* GraphQL */ `subscription OnCreateAgentJob(
  $filter: ModelSubscriptionAgentJobFilterInput
  $owner: String
) {
  onCreateAgentJob(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateAgentJobSubscriptionVariables,
  APITypes.OnCreateAgentJobSubscription
>;
export const onUpdateAgentJob = /* GraphQL */ `subscription OnUpdateAgentJob(
  $filter: ModelSubscriptionAgentJobFilterInput
  $owner: String
) {
  onUpdateAgentJob(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateAgentJobSubscriptionVariables,
  APITypes.OnUpdateAgentJobSubscription
>;
export const onDeleteAgentJob = /* GraphQL */ `subscription OnDeleteAgentJob(
  $filter: ModelSubscriptionAgentJobFilterInput
  $owner: String
) {
  onDeleteAgentJob(filter: $filter, owner: $owner) {
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
      embeddingsS3Key
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteAgentJobSubscriptionVariables,
  APITypes.OnDeleteAgentJobSubscription
>;
export const onCreateSettings = /* GraphQL */ `subscription OnCreateSettings(
  $filter: ModelSubscriptionSettingsFilterInput
  $owner: String
) {
  onCreateSettings(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSettingsSubscriptionVariables,
  APITypes.OnCreateSettingsSubscription
>;
export const onUpdateSettings = /* GraphQL */ `subscription OnUpdateSettings(
  $filter: ModelSubscriptionSettingsFilterInput
  $owner: String
) {
  onUpdateSettings(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSettingsSubscriptionVariables,
  APITypes.OnUpdateSettingsSubscription
>;
export const onDeleteSettings = /* GraphQL */ `subscription OnDeleteSettings(
  $filter: ModelSubscriptionSettingsFilterInput
  $owner: String
) {
  onDeleteSettings(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSettingsSubscriptionVariables,
  APITypes.OnDeleteSettingsSubscription
>;
export const onCreateAIFeedback = /* GraphQL */ `subscription OnCreateAIFeedback(
  $filter: ModelSubscriptionAIFeedbackFilterInput
  $owner: String
) {
  onCreateAIFeedback(filter: $filter, owner: $owner) {
    id
    owner
    identityId
    contentType
    feedbackType
    reasons
    comment
    model
    prompt
    generatedContent
    unitID
    gradeID
    documentID
    messageId
    sessionId
    metadata
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAIFeedbackSubscriptionVariables,
  APITypes.OnCreateAIFeedbackSubscription
>;
export const onUpdateAIFeedback = /* GraphQL */ `subscription OnUpdateAIFeedback(
  $filter: ModelSubscriptionAIFeedbackFilterInput
  $owner: String
) {
  onUpdateAIFeedback(filter: $filter, owner: $owner) {
    id
    owner
    identityId
    contentType
    feedbackType
    reasons
    comment
    model
    prompt
    generatedContent
    unitID
    gradeID
    documentID
    messageId
    sessionId
    metadata
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAIFeedbackSubscriptionVariables,
  APITypes.OnUpdateAIFeedbackSubscription
>;
export const onDeleteAIFeedback = /* GraphQL */ `subscription OnDeleteAIFeedback(
  $filter: ModelSubscriptionAIFeedbackFilterInput
  $owner: String
) {
  onDeleteAIFeedback(filter: $filter, owner: $owner) {
    id
    owner
    identityId
    contentType
    feedbackType
    reasons
    comment
    model
    prompt
    generatedContent
    unitID
    gradeID
    documentID
    messageId
    sessionId
    metadata
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAIFeedbackSubscriptionVariables,
  APITypes.OnDeleteAIFeedbackSubscription
>;
export const onCreateQuestionUnit = /* GraphQL */ `subscription OnCreateQuestionUnit(
  $filter: ModelSubscriptionQuestionUnitFilterInput
  $owner: String
) {
  onCreateQuestionUnit(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateQuestionUnitSubscriptionVariables,
  APITypes.OnCreateQuestionUnitSubscription
>;
export const onUpdateQuestionUnit = /* GraphQL */ `subscription OnUpdateQuestionUnit(
  $filter: ModelSubscriptionQuestionUnitFilterInput
  $owner: String
) {
  onUpdateQuestionUnit(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionUnitSubscriptionVariables,
  APITypes.OnUpdateQuestionUnitSubscription
>;
export const onDeleteQuestionUnit = /* GraphQL */ `subscription OnDeleteQuestionUnit(
  $filter: ModelSubscriptionQuestionUnitFilterInput
  $owner: String
) {
  onDeleteQuestionUnit(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionUnitSubscriptionVariables,
  APITypes.OnDeleteQuestionUnitSubscription
>;
export const onCreateQuestionWord = /* GraphQL */ `subscription OnCreateQuestionWord(
  $filter: ModelSubscriptionQuestionWordFilterInput
  $owner: String
) {
  onCreateQuestionWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateQuestionWordSubscriptionVariables,
  APITypes.OnCreateQuestionWordSubscription
>;
export const onUpdateQuestionWord = /* GraphQL */ `subscription OnUpdateQuestionWord(
  $filter: ModelSubscriptionQuestionWordFilterInput
  $owner: String
) {
  onUpdateQuestionWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionWordSubscriptionVariables,
  APITypes.OnUpdateQuestionWordSubscription
>;
export const onDeleteQuestionWord = /* GraphQL */ `subscription OnDeleteQuestionWord(
  $filter: ModelSubscriptionQuestionWordFilterInput
  $owner: String
) {
  onDeleteQuestionWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionWordSubscriptionVariables,
  APITypes.OnDeleteQuestionWordSubscription
>;
export const onCreateQuestionFile = /* GraphQL */ `subscription OnCreateQuestionFile(
  $filter: ModelSubscriptionQuestionFileFilterInput
  $owner: String
) {
  onCreateQuestionFile(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnCreateQuestionFileSubscriptionVariables,
  APITypes.OnCreateQuestionFileSubscription
>;
export const onUpdateQuestionFile = /* GraphQL */ `subscription OnUpdateQuestionFile(
  $filter: ModelSubscriptionQuestionFileFilterInput
  $owner: String
) {
  onUpdateQuestionFile(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnUpdateQuestionFileSubscriptionVariables,
  APITypes.OnUpdateQuestionFileSubscription
>;
export const onDeleteQuestionFile = /* GraphQL */ `subscription OnDeleteQuestionFile(
  $filter: ModelSubscriptionQuestionFileFilterInput
  $owner: String
) {
  onDeleteQuestionFile(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionFileSubscriptionVariables,
  APITypes.OnDeleteQuestionFileSubscription
>;
export const onCreateDocumentQuestion = /* GraphQL */ `subscription OnCreateDocumentQuestion(
  $filter: ModelSubscriptionDocumentQuestionFilterInput
  $owner: String
) {
  onCreateDocumentQuestion(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnCreateDocumentQuestionSubscriptionVariables,
  APITypes.OnCreateDocumentQuestionSubscription
>;
export const onUpdateDocumentQuestion = /* GraphQL */ `subscription OnUpdateDocumentQuestion(
  $filter: ModelSubscriptionDocumentQuestionFilterInput
  $owner: String
) {
  onUpdateDocumentQuestion(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentQuestionSubscriptionVariables,
  APITypes.OnUpdateDocumentQuestionSubscription
>;
export const onDeleteDocumentQuestion = /* GraphQL */ `subscription OnDeleteDocumentQuestion(
  $filter: ModelSubscriptionDocumentQuestionFilterInput
  $owner: String
) {
  onDeleteDocumentQuestion(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentQuestionSubscriptionVariables,
  APITypes.OnDeleteDocumentQuestionSubscription
>;
export const onCreateUnitFile = /* GraphQL */ `subscription OnCreateUnitFile(
  $filter: ModelSubscriptionUnitFileFilterInput
  $owner: String
) {
  onCreateUnitFile(filter: $filter, owner: $owner) {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateUnitFileSubscriptionVariables,
  APITypes.OnCreateUnitFileSubscription
>;
export const onUpdateUnitFile = /* GraphQL */ `subscription OnUpdateUnitFile(
  $filter: ModelSubscriptionUnitFileFilterInput
  $owner: String
) {
  onUpdateUnitFile(filter: $filter, owner: $owner) {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateUnitFileSubscriptionVariables,
  APITypes.OnUpdateUnitFileSubscription
>;
export const onDeleteUnitFile = /* GraphQL */ `subscription OnDeleteUnitFile(
  $filter: ModelSubscriptionUnitFileFilterInput
  $owner: String
) {
  onDeleteUnitFile(filter: $filter, owner: $owner) {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteUnitFileSubscriptionVariables,
  APITypes.OnDeleteUnitFileSubscription
>;
export const onCreateWordFile = /* GraphQL */ `subscription OnCreateWordFile(
  $filter: ModelSubscriptionWordFileFilterInput
  $owner: String
) {
  onCreateWordFile(filter: $filter, owner: $owner) {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateWordFileSubscriptionVariables,
  APITypes.OnCreateWordFileSubscription
>;
export const onUpdateWordFile = /* GraphQL */ `subscription OnUpdateWordFile(
  $filter: ModelSubscriptionWordFileFilterInput
  $owner: String
) {
  onUpdateWordFile(filter: $filter, owner: $owner) {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateWordFileSubscriptionVariables,
  APITypes.OnUpdateWordFileSubscription
>;
export const onDeleteWordFile = /* GraphQL */ `subscription OnDeleteWordFile(
  $filter: ModelSubscriptionWordFileFilterInput
  $owner: String
) {
  onDeleteWordFile(filter: $filter, owner: $owner) {
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
        embeddingsS3Key
        metadata
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      parsedContentID
      parsedContent {
        id
        owner
        identityId
        documentID
        fileID
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteWordFileSubscriptionVariables,
  APITypes.OnDeleteWordFileSubscription
>;
export const onCreateUnitWord = /* GraphQL */ `subscription OnCreateUnitWord(
  $filter: ModelSubscriptionUnitWordFilterInput
  $owner: String
) {
  onCreateUnitWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnCreateUnitWordSubscriptionVariables,
  APITypes.OnCreateUnitWordSubscription
>;
export const onUpdateUnitWord = /* GraphQL */ `subscription OnUpdateUnitWord(
  $filter: ModelSubscriptionUnitWordFilterInput
  $owner: String
) {
  onUpdateUnitWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnUpdateUnitWordSubscriptionVariables,
  APITypes.OnUpdateUnitWordSubscription
>;
export const onDeleteUnitWord = /* GraphQL */ `subscription OnDeleteUnitWord(
  $filter: ModelSubscriptionUnitWordFilterInput
  $owner: String
) {
  onDeleteUnitWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
` as GeneratedSubscription<
  APITypes.OnDeleteUnitWordSubscriptionVariables,
  APITypes.OnDeleteUnitWordSubscription
>;
export const onCreateUnitDocument = /* GraphQL */ `subscription OnCreateUnitDocument(
  $filter: ModelSubscriptionUnitDocumentFilterInput
  $owner: String
) {
  onCreateUnitDocument(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnCreateUnitDocumentSubscriptionVariables,
  APITypes.OnCreateUnitDocumentSubscription
>;
export const onUpdateUnitDocument = /* GraphQL */ `subscription OnUpdateUnitDocument(
  $filter: ModelSubscriptionUnitDocumentFilterInput
  $owner: String
) {
  onUpdateUnitDocument(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnUpdateUnitDocumentSubscriptionVariables,
  APITypes.OnUpdateUnitDocumentSubscription
>;
export const onDeleteUnitDocument = /* GraphQL */ `subscription OnDeleteUnitDocument(
  $filter: ModelSubscriptionUnitDocumentFilterInput
  $owner: String
) {
  onDeleteUnitDocument(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnDeleteUnitDocumentSubscriptionVariables,
  APITypes.OnDeleteUnitDocumentSubscription
>;
export const onCreateDocumentWord = /* GraphQL */ `subscription OnCreateDocumentWord(
  $filter: ModelSubscriptionDocumentWordFilterInput
  $owner: String
) {
  onCreateDocumentWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnCreateDocumentWordSubscriptionVariables,
  APITypes.OnCreateDocumentWordSubscription
>;
export const onUpdateDocumentWord = /* GraphQL */ `subscription OnUpdateDocumentWord(
  $filter: ModelSubscriptionDocumentWordFilterInput
  $owner: String
) {
  onUpdateDocumentWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentWordSubscriptionVariables,
  APITypes.OnUpdateDocumentWordSubscription
>;
export const onDeleteDocumentWord = /* GraphQL */ `subscription OnDeleteDocumentWord(
  $filter: ModelSubscriptionDocumentWordFilterInput
  $owner: String
) {
  onDeleteDocumentWord(filter: $filter, owner: $owner) {
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
      moderationStatus
      moderationFlags
      moderationCheckedAt
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
      embeddingsS3Key
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
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentWordSubscriptionVariables,
  APITypes.OnDeleteDocumentWordSubscription
>;
