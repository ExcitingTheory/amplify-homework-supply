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
` as GeneratedSubscription<
  APITypes.OnDeleteWordSubscriptionVariables,
  APITypes.OnDeleteWordSubscription
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
` as GeneratedSubscription<
  APITypes.OnDeleteQuestionFileSubscriptionVariables,
  APITypes.OnDeleteQuestionFileSubscription
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
` as GeneratedSubscription<
  APITypes.OnDeleteUnitWordSubscriptionVariables,
  APITypes.OnDeleteUnitWordSubscription
>;
