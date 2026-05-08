"use client";
import Editor from "@/components/Editor3";
import PermissionErrorOverlay from "@/components/PermissionErrorOverlay";
import React from "react";
import { useTranslations } from "next-intl";

import MyAuth from "@/components/AmplifyAuthenticator";
import AppSkeleton from "@/components/AppSkeleton";

import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";
import { UnitProvider } from "@/context/unitContext";
import UnitContext from "@/context/unitContext";
import AuthContext from "@/context/authContext";
import { SectionProvider } from "@/context/sectionContext";
import { useParams } from "next/navigation";

function UnitPageContent() {
  const { unit, checkUnitEditPermission } = React.useContext(UnitContext);
  const { user, session } = React.useContext(AuthContext);

  // Don't render the editor until unit data is loaded — prevents
  // saveEditorContent firing before editorStateRef is populated
  if (!unit?.id) return null;

  // Check edit permissions for the unit editor
  const permissionCheck = React.useMemo(() => {
    const userGroups = session?.groups || [];
    return checkUnitEditPermission(unit, user, userGroups);
  }, [unit, user, session?.groups, checkUnitEditPermission]);

  return (
    <>
      <PermissionErrorOverlay
        open={!permissionCheck.hasAccess}
        resourceType="unit"
        message={permissionCheck.reason}
      />
      {permissionCheck.hasAccess && <Editor />}
    </>
  );
}

function UnitPage() {
  /**
   * Unipage is a dynamic route. We supply the id of the unit in the url.
   * The id is used to fetch the unit from the database.
   * The unit is passed to the Editor2 component.
   * The Editor2 component is a wrapper around the draftjs editor.
   */
  const t = useTranslations("pages");

  const { id } = useParams();

  return (
    <FilesProvider>
      <DictionaryProvider>
        <SectionProvider unitId={id}>
          <UnitProvider id={id}>
            <UnitPageContent />
          </UnitProvider>
        </SectionProvider>
      </DictionaryProvider>
    </FilesProvider>
  );
}

function WrappedPage() {
  return (
    <MyAuth>
      <UnitPage />
    </MyAuth>
  );
}

export default WrappedPage;
