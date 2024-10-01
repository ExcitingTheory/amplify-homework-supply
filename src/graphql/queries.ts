/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const listSectionStudents = /* GraphQL */ `query ListSectionStudents($sectionCode: String!) {
  listSectionStudents(sectionCode: $sectionCode) {
    id
    name
    email
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSectionStudentsQueryVariables,
  APITypes.ListSectionStudentsQuery
>;
export const verifyDefinition = /* GraphQL */ `query VerifyDefinition(
  $phrase: String!
  $expected: String!
  $definition: String!
  $model: String
) {
  verifyDefinition(
    phrase: $phrase
    expected: $expected
    definition: $definition
    model: $model
  )
}
` as GeneratedQuery<
  APITypes.VerifyDefinitionQueryVariables,
  APITypes.VerifyDefinitionQuery
>;
export const verifyWord = /* GraphQL */ `query VerifyWord(
  $word: String!
  $expected: String!
  $definition: String!
  $model: String
) {
  verifyWord(
    word: $word
    expected: $expected
    definition: $definition
    model: $model
  )
}
` as GeneratedQuery<
  APITypes.VerifyWordQueryVariables,
  APITypes.VerifyWordQuery
>;
export const verifyShortAnswer = /* GraphQL */ `query VerifyShortAnswer(
  $expected: String!
  $answer: String!
  $prompt: String!
  $model: String
) {
  verifyShortAnswer(
    expected: $expected
    answer: $answer
    prompt: $prompt
    model: $model
  )
}
` as GeneratedQuery<
  APITypes.VerifyShortAnswerQueryVariables,
  APITypes.VerifyShortAnswerQuery
>;
export const transcribe = /* GraphQL */ `query Transcribe($audio: String!, $model: String) {
  transcribe(audio: $audio, model: $model)
}
` as GeneratedQuery<
  APITypes.TranscribeQueryVariables,
  APITypes.TranscribeQuery
>;
export const verifyAudio = /* GraphQL */ `query VerifyAudio(
  $expected: String!
  $audio: String!
  $model: String
  $chatModel: String!
) {
  verifyAudio(
    expected: $expected
    audio: $audio
    model: $model
    chatModel: $chatModel
  )
}
` as GeneratedQuery<
  APITypes.VerifyAudioQueryVariables,
  APITypes.VerifyAudioQuery
>;
export const verifyAudioUrl = /* GraphQL */ `query VerifyAudioUrl(
  $expected: String!
  $audioUrl: String!
  $model: String!
  $chatModel: String!
) {
  verifyAudioUrl(
    expected: $expected
    audioUrl: $audioUrl
    model: $model
    chatModel: $chatModel
  )
}
` as GeneratedQuery<
  APITypes.VerifyAudioUrlQueryVariables,
  APITypes.VerifyAudioUrlQuery
>;
export const transcribeUrl = /* GraphQL */ `query TranscribeUrl($audioUrl: String!, $model: String) {
  transcribeUrl(audioUrl: $audioUrl, model: $model)
}
` as GeneratedQuery<
  APITypes.TranscribeUrlQueryVariables,
  APITypes.TranscribeUrlQuery
>;
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
export const getAssistant = /* GraphQL */ `query GetAssistant($id: ID!) {
  getAssistant(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAssistantQueryVariables,
  APITypes.GetAssistantQuery
>;
export const listAssistants = /* GraphQL */ `query ListAssistants(
  $filter: ModelAssistantFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssistants(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAssistantsQueryVariables,
  APITypes.ListAssistantsQuery
>;
export const syncAssistants = /* GraphQL */ `query SyncAssistants(
  $filter: ModelAssistantFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncAssistants(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncAssistantsQueryVariables,
  APITypes.SyncAssistantsQuery
>;
export const getQuestion = /* GraphQL */ `query GetQuestion($id: ID!) {
  getQuestion(id: $id) {
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
    answerAudio
    generated
    model
    promptHex
    byPromptHex
    thumbnail
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
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetQuestionQueryVariables,
  APITypes.GetQuestionQuery
>;
export const listQuestions = /* GraphQL */ `query ListQuestions(
  $filter: ModelQuestionFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
      answerAudio
      generated
      model
      promptHex
      byPromptHex
      thumbnail
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
}
` as GeneratedQuery<
  APITypes.ListQuestionsQueryVariables,
  APITypes.ListQuestionsQuery
>;
export const syncQuestions = /* GraphQL */ `query SyncQuestions(
  $filter: ModelQuestionFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncQuestions(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
      answerAudio
      generated
      model
      promptHex
      byPromptHex
      thumbnail
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
}
` as GeneratedQuery<
  APITypes.SyncQuestionsQueryVariables,
  APITypes.SyncQuestionsQuery
>;
export const questionsByByPromptHex = /* GraphQL */ `query QuestionsByByPromptHex(
  $byPromptHex: String!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionFilterInput
  $limit: Int
  $nextToken: String
) {
  questionsByByPromptHex(
    byPromptHex: $byPromptHex
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
      answerAudio
      generated
      model
      promptHex
      byPromptHex
      thumbnail
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
}
` as GeneratedQuery<
  APITypes.QuestionsByByPromptHexQueryVariables,
  APITypes.QuestionsByByPromptHexQuery
>;
export const getFile = /* GraphQL */ `query GetFile($id: ID!) {
  getFile(id: $id) {
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
` as GeneratedQuery<APITypes.GetFileQueryVariables, APITypes.GetFileQuery>;
export const listFiles = /* GraphQL */ `query ListFiles(
  $filter: ModelFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.ListFilesQueryVariables, APITypes.ListFilesQuery>;
export const syncFiles = /* GraphQL */ `query SyncFiles(
  $filter: ModelFileFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncFiles(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.SyncFilesQueryVariables, APITypes.SyncFilesQuery>;
export const filesByByHex = /* GraphQL */ `query FilesByByHex(
  $byHex: String!
  $sortDirection: ModelSortDirection
  $filter: ModelFileFilterInput
  $limit: Int
  $nextToken: String
) {
  filesByByHex(
    byHex: $byHex
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.FilesByByHexQueryVariables,
  APITypes.FilesByByHexQuery
>;
export const getChatHistory = /* GraphQL */ `query GetChatHistory($id: ID!) {
  getChatHistory(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetChatHistoryQueryVariables,
  APITypes.GetChatHistoryQuery
>;
export const listChatHistories = /* GraphQL */ `query ListChatHistories(
  $filter: ModelChatHistoryFilterInput
  $limit: Int
  $nextToken: String
) {
  listChatHistories(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatHistoriesQueryVariables,
  APITypes.ListChatHistoriesQuery
>;
export const syncChatHistories = /* GraphQL */ `query SyncChatHistories(
  $filter: ModelChatHistoryFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncChatHistories(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncChatHistoriesQueryVariables,
  APITypes.SyncChatHistoriesQuery
>;
export const getSection = /* GraphQL */ `query GetSection($id: ID!) {
  getSection(id: $id) {
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
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSectionQueryVariables,
  APITypes.GetSectionQuery
>;
export const listSections = /* GraphQL */ `query ListSections(
  $filter: ModelSectionFilterInput
  $limit: Int
  $nextToken: String
) {
  listSections(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      owner
      learner
      description
      status
      code
      assignments {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      backgroundColor
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
}
` as GeneratedQuery<
  APITypes.ListSectionsQueryVariables,
  APITypes.ListSectionsQuery
>;
export const syncSections = /* GraphQL */ `query SyncSections(
  $filter: ModelSectionFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncSections(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
      id
      name
      owner
      learner
      description
      status
      code
      assignments {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      backgroundColor
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
}
` as GeneratedQuery<
  APITypes.SyncSectionsQueryVariables,
  APITypes.SyncSectionsQuery
>;
export const sectionByCode = /* GraphQL */ `query SectionByCode(
  $code: String!
  $sortDirection: ModelSortDirection
  $filter: ModelSectionFilterInput
  $limit: Int
  $nextToken: String
) {
  sectionByCode(
    code: $code
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      owner
      learner
      description
      status
      code
      assignments {
        nextToken
        startedAt
        __typename
      }
      featuredImage
      identityId
      thumbnail
      backgroundColor
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
}
` as GeneratedQuery<
  APITypes.SectionByCodeQueryVariables,
  APITypes.SectionByCodeQuery
>;
export const getAssignment = /* GraphQL */ `query GetAssignment($id: ID!) {
  getAssignment(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAssignmentQueryVariables,
  APITypes.GetAssignmentQuery
>;
export const listAssignments = /* GraphQL */ `query ListAssignments(
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
) {
  listAssignments(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
}
` as GeneratedQuery<
  APITypes.ListAssignmentsQueryVariables,
  APITypes.ListAssignmentsQuery
>;
export const syncAssignments = /* GraphQL */ `query SyncAssignments(
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncAssignments(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
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
}
` as GeneratedQuery<
  APITypes.SyncAssignmentsQueryVariables,
  APITypes.SyncAssignmentsQuery
>;
export const assignmentsBySectionID = /* GraphQL */ `query AssignmentsBySectionID(
  $sectionID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
) {
  assignmentsBySectionID(
    sectionID: $sectionID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
}
` as GeneratedQuery<
  APITypes.AssignmentsBySectionIDQueryVariables,
  APITypes.AssignmentsBySectionIDQuery
>;
export const assignmentsByUnitID = /* GraphQL */ `query AssignmentsByUnitID(
  $unitID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelAssignmentFilterInput
  $limit: Int
  $nextToken: String
) {
  assignmentsByUnitID(
    unitID: $unitID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
}
` as GeneratedQuery<
  APITypes.AssignmentsByUnitIDQueryVariables,
  APITypes.AssignmentsByUnitIDQuery
>;
export const getGrade = /* GraphQL */ `query GetGrade($id: ID!) {
  getGrade(id: $id) {
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
` as GeneratedQuery<APITypes.GetGradeQueryVariables, APITypes.GetGradeQuery>;
export const listGrades = /* GraphQL */ `query ListGrades(
  $filter: ModelGradeFilterInput
  $limit: Int
  $nextToken: String
) {
  listGrades(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
}
` as GeneratedQuery<
  APITypes.ListGradesQueryVariables,
  APITypes.ListGradesQuery
>;
export const syncGrades = /* GraphQL */ `query SyncGrades(
  $filter: ModelGradeFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncGrades(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
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
}
` as GeneratedQuery<
  APITypes.SyncGradesQueryVariables,
  APITypes.SyncGradesQuery
>;
export const gradesByInstructor = /* GraphQL */ `query GradesByInstructor(
  $instructor: String!
  $sortDirection: ModelSortDirection
  $filter: ModelGradeFilterInput
  $limit: Int
  $nextToken: String
) {
  gradesByInstructor(
    instructor: $instructor
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
}
` as GeneratedQuery<
  APITypes.GradesByInstructorQueryVariables,
  APITypes.GradesByInstructorQuery
>;
export const gradesByUnitID = /* GraphQL */ `query GradesByUnitID(
  $unitID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelGradeFilterInput
  $limit: Int
  $nextToken: String
) {
  gradesByUnitID(
    unitID: $unitID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
}
` as GeneratedQuery<
  APITypes.GradesByUnitIDQueryVariables,
  APITypes.GradesByUnitIDQuery
>;
export const getUnit = /* GraphQL */ `query GetUnit($id: ID!) {
  getUnit(id: $id) {
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
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUnitQueryVariables, APITypes.GetUnitQuery>;
export const listUnits = /* GraphQL */ `query ListUnits(
  $filter: ModelUnitFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnits(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
}
` as GeneratedQuery<APITypes.ListUnitsQueryVariables, APITypes.ListUnitsQuery>;
export const syncUnits = /* GraphQL */ `query SyncUnits(
  $filter: ModelUnitFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncUnits(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
}
` as GeneratedQuery<APITypes.SyncUnitsQueryVariables, APITypes.SyncUnitsQuery>;
export const getWord = /* GraphQL */ `query GetWord($id: ID!) {
  getWord(id: $id) {
    id
    phrase
    owner
    identityId
    pronunciation
    definition
    audio
    definitionAudio
    rubyTags
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
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetWordQueryVariables, APITypes.GetWordQuery>;
export const listWords = /* GraphQL */ `query ListWords(
  $filter: ModelWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      definitionAudio
      rubyTags
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
}
` as GeneratedQuery<APITypes.ListWordsQueryVariables, APITypes.ListWordsQuery>;
export const syncWords = /* GraphQL */ `query SyncWords(
  $filter: ModelWordFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncWords(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
      id
      phrase
      owner
      identityId
      pronunciation
      definition
      audio
      definitionAudio
      rubyTags
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
}
` as GeneratedQuery<APITypes.SyncWordsQueryVariables, APITypes.SyncWordsQuery>;
export const getQuestionUnit = /* GraphQL */ `query GetQuestionUnit($id: ID!) {
  getQuestionUnit(id: $id) {
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
      answerAudio
      generated
      model
      promptHex
      byPromptHex
      thumbnail
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
` as GeneratedQuery<
  APITypes.GetQuestionUnitQueryVariables,
  APITypes.GetQuestionUnitQuery
>;
export const listQuestionUnits = /* GraphQL */ `query ListQuestionUnits(
  $filter: ModelQuestionUnitFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestionUnits(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      questionId
      unitId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionUnitsQueryVariables,
  APITypes.ListQuestionUnitsQuery
>;
export const syncQuestionUnits = /* GraphQL */ `query SyncQuestionUnits(
  $filter: ModelQuestionUnitFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncQuestionUnits(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
      id
      questionId
      unitId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncQuestionUnitsQueryVariables,
  APITypes.SyncQuestionUnitsQuery
>;
export const questionUnitsByQuestionId = /* GraphQL */ `query QuestionUnitsByQuestionId(
  $questionId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionUnitFilterInput
  $limit: Int
  $nextToken: String
) {
  questionUnitsByQuestionId(
    questionId: $questionId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      questionId
      unitId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.QuestionUnitsByQuestionIdQueryVariables,
  APITypes.QuestionUnitsByQuestionIdQuery
>;
export const questionUnitsByUnitId = /* GraphQL */ `query QuestionUnitsByUnitId(
  $unitId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionUnitFilterInput
  $limit: Int
  $nextToken: String
) {
  questionUnitsByUnitId(
    unitId: $unitId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      questionId
      unitId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.QuestionUnitsByUnitIdQueryVariables,
  APITypes.QuestionUnitsByUnitIdQuery
>;
export const getQuestionWord = /* GraphQL */ `query GetQuestionWord($id: ID!) {
  getQuestionWord(id: $id) {
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
      answerAudio
      generated
      model
      promptHex
      byPromptHex
      thumbnail
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
      definitionAudio
      rubyTags
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
` as GeneratedQuery<
  APITypes.GetQuestionWordQueryVariables,
  APITypes.GetQuestionWordQuery
>;
export const listQuestionWords = /* GraphQL */ `query ListQuestionWords(
  $filter: ModelQuestionWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestionWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      questionId
      wordId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionWordsQueryVariables,
  APITypes.ListQuestionWordsQuery
>;
export const syncQuestionWords = /* GraphQL */ `query SyncQuestionWords(
  $filter: ModelQuestionWordFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncQuestionWords(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
      id
      questionId
      wordId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncQuestionWordsQueryVariables,
  APITypes.SyncQuestionWordsQuery
>;
export const questionWordsByQuestionId = /* GraphQL */ `query QuestionWordsByQuestionId(
  $questionId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionWordFilterInput
  $limit: Int
  $nextToken: String
) {
  questionWordsByQuestionId(
    questionId: $questionId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      questionId
      wordId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.QuestionWordsByQuestionIdQueryVariables,
  APITypes.QuestionWordsByQuestionIdQuery
>;
export const questionWordsByWordId = /* GraphQL */ `query QuestionWordsByWordId(
  $wordId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionWordFilterInput
  $limit: Int
  $nextToken: String
) {
  questionWordsByWordId(
    wordId: $wordId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      questionId
      wordId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.QuestionWordsByWordIdQueryVariables,
  APITypes.QuestionWordsByWordIdQuery
>;
export const getQuestionFile = /* GraphQL */ `query GetQuestionFile($id: ID!) {
  getQuestionFile(id: $id) {
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
      answerAudio
      generated
      model
      promptHex
      byPromptHex
      thumbnail
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
` as GeneratedQuery<
  APITypes.GetQuestionFileQueryVariables,
  APITypes.GetQuestionFileQuery
>;
export const listQuestionFiles = /* GraphQL */ `query ListQuestionFiles(
  $filter: ModelQuestionFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuestionFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      questionId
      fileId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestionFilesQueryVariables,
  APITypes.ListQuestionFilesQuery
>;
export const syncQuestionFiles = /* GraphQL */ `query SyncQuestionFiles(
  $filter: ModelQuestionFileFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncQuestionFiles(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
      id
      questionId
      fileId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncQuestionFilesQueryVariables,
  APITypes.SyncQuestionFilesQuery
>;
export const questionFilesByQuestionId = /* GraphQL */ `query QuestionFilesByQuestionId(
  $questionId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionFileFilterInput
  $limit: Int
  $nextToken: String
) {
  questionFilesByQuestionId(
    questionId: $questionId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      questionId
      fileId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.QuestionFilesByQuestionIdQueryVariables,
  APITypes.QuestionFilesByQuestionIdQuery
>;
export const questionFilesByFileId = /* GraphQL */ `query QuestionFilesByFileId(
  $fileId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelQuestionFileFilterInput
  $limit: Int
  $nextToken: String
) {
  questionFilesByFileId(
    fileId: $fileId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      questionId
      fileId
      question {
        id
        owner
        identityId
        answer
        hint
        prompt
        audio
        answerAudio
        generated
        model
        promptHex
        byPromptHex
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.QuestionFilesByFileIdQueryVariables,
  APITypes.QuestionFilesByFileIdQuery
>;
export const getUnitFile = /* GraphQL */ `query GetUnitFile($id: ID!) {
  getUnitFile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetUnitFileQueryVariables,
  APITypes.GetUnitFileQuery
>;
export const listUnitFiles = /* GraphQL */ `query ListUnitFiles(
  $filter: ModelUnitFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnitFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUnitFilesQueryVariables,
  APITypes.ListUnitFilesQuery
>;
export const syncUnitFiles = /* GraphQL */ `query SyncUnitFiles(
  $filter: ModelUnitFileFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncUnitFiles(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncUnitFilesQueryVariables,
  APITypes.SyncUnitFilesQuery
>;
export const unitFilesByFileId = /* GraphQL */ `query UnitFilesByFileId(
  $fileId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelUnitFileFilterInput
  $limit: Int
  $nextToken: String
) {
  unitFilesByFileId(
    fileId: $fileId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UnitFilesByFileIdQueryVariables,
  APITypes.UnitFilesByFileIdQuery
>;
export const unitFilesByUnitId = /* GraphQL */ `query UnitFilesByUnitId(
  $unitId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelUnitFileFilterInput
  $limit: Int
  $nextToken: String
) {
  unitFilesByUnitId(
    unitId: $unitId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UnitFilesByUnitIdQueryVariables,
  APITypes.UnitFilesByUnitIdQuery
>;
export const getWordFile = /* GraphQL */ `query GetWordFile($id: ID!) {
  getWordFile(id: $id) {
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
      definitionAudio
      rubyTags
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
` as GeneratedQuery<
  APITypes.GetWordFileQueryVariables,
  APITypes.GetWordFileQuery
>;
export const listWordFiles = /* GraphQL */ `query ListWordFiles(
  $filter: ModelWordFileFilterInput
  $limit: Int
  $nextToken: String
) {
  listWordFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWordFilesQueryVariables,
  APITypes.ListWordFilesQuery
>;
export const syncWordFiles = /* GraphQL */ `query SyncWordFiles(
  $filter: ModelWordFileFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncWordFiles(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncWordFilesQueryVariables,
  APITypes.SyncWordFilesQuery
>;
export const wordFilesByFileId = /* GraphQL */ `query WordFilesByFileId(
  $fileId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelWordFileFilterInput
  $limit: Int
  $nextToken: String
) {
  wordFilesByFileId(
    fileId: $fileId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.WordFilesByFileIdQueryVariables,
  APITypes.WordFilesByFileIdQuery
>;
export const wordFilesByWordId = /* GraphQL */ `query WordFilesByWordId(
  $wordId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelWordFileFilterInput
  $limit: Int
  $nextToken: String
) {
  wordFilesByWordId(
    wordId: $wordId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.WordFilesByWordIdQueryVariables,
  APITypes.WordFilesByWordIdQuery
>;
export const getUnitWord = /* GraphQL */ `query GetUnitWord($id: ID!) {
  getUnitWord(id: $id) {
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
      definitionAudio
      rubyTags
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
` as GeneratedQuery<
  APITypes.GetUnitWordQueryVariables,
  APITypes.GetUnitWordQuery
>;
export const listUnitWords = /* GraphQL */ `query ListUnitWords(
  $filter: ModelUnitWordFilterInput
  $limit: Int
  $nextToken: String
) {
  listUnitWords(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUnitWordsQueryVariables,
  APITypes.ListUnitWordsQuery
>;
export const syncUnitWords = /* GraphQL */ `query SyncUnitWords(
  $filter: ModelUnitWordFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncUnitWords(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SyncUnitWordsQueryVariables,
  APITypes.SyncUnitWordsQuery
>;
export const unitWordsByUnitId = /* GraphQL */ `query UnitWordsByUnitId(
  $unitId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelUnitWordFilterInput
  $limit: Int
  $nextToken: String
) {
  unitWordsByUnitId(
    unitId: $unitId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UnitWordsByUnitIdQueryVariables,
  APITypes.UnitWordsByUnitIdQuery
>;
export const unitWordsByWordId = /* GraphQL */ `query UnitWordsByWordId(
  $wordId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelUnitWordFilterInput
  $limit: Int
  $nextToken: String
) {
  unitWordsByWordId(
    wordId: $wordId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
        featuredImage
        identityId
        thumbnail
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
        definitionAudio
        rubyTags
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UnitWordsByWordIdQueryVariables,
  APITypes.UnitWordsByWordIdQuery
>;
