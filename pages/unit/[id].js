import { useRouter } from 'next/router'
import LanguageEditor from '../../src/components/Editor3'
import React from "react";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
  const { t } = useTranslation('pages');

  const router = useRouter()
  if (router.isFallback) {
    return (
      <div>
        <h1>{t('unitDetail.loading')}</h1>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages'])),
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export default WrappedPage

