import { DataStore } from 'aws-amplify/datastore';
import { useRouter } from 'next/router'
import LanguageEditor from '../../src/components/Editor3'
import React from "react";

import MyAuth from "../../src/components/authenticator";

import { FilesProvider } from '../../src/context/fileContext'
import { DictionaryProvider } from '../../src/context/dictionaryContext' 
import { UnitProvider } from '../../src/context/unitContext'
import { SectionProvider } from '../../src/context/sectionContext';

function UnitPage() {
  /**
   * Unipage is a dynamic route. We supply the id of the unit in the url. 
   * The id is used to fetch the unit from the database.
   * The unit is passed to the Editor2 component. 
   * The Editor2 component is a wrapper around the draftjs editor.
   */

  const router = useRouter()
  if (router.isFallback) {
    return (
      <div>
        <h1>Loading&hellip;</h1>
      </div>
    )
  }

  const { id } = router.query

    return (
      <FilesProvider>
      <DictionaryProvider>
      <SectionProvider unitId={id}>
      <UnitProvider id={id}>
        <LanguageEditor />
      </UnitProvider>
      </SectionProvider>
      </DictionaryProvider>
      </FilesProvider> 
    )
  
}


function WrappedPage() {
  return (
    <MyAuth>
      <UnitPage />
    </MyAuth>
  )
}

export default WrappedPage

