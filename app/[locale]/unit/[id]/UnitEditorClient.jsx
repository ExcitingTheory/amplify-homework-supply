"use client";
import Editor from "@/components/Editor3";
import PermissionErrorOverlay from "@/components/PermissionErrorOverlay";
import React from "react";
import { useTranslations } from "next-intl";

import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";
import { UnitProvider } from "@/context/unitContext";
import UnitContext from "@/context/unitContext";
import AuthContext from "@/context/authContext";
import { SectionProvider } from "@/context/sectionContext";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";
import { useParams } from "next/navigation";

function UnitPageContent() {
  const { unit, checkUnitEditPermission } = React.useContext(UnitContext);
  const { user, session } = React.useContext(AuthContext);

  // Check edit permissions for the unit editor
  // Must be called unconditionally (rules of hooks)
  const permissionCheck = React.useMemo(() => {
    if (!unit?.id) return { hasAccess: false, reason: null };
    const userGroups = session?.groups || [];
    return checkUnitEditPermission(unit, user, userGroups);
  }, [unit, user, session?.groups, checkUnitEditPermission]);

  // Don't render the editor until unit data is loaded — prevents
  // saveEditorContent firing before editorStateRef is populated
  if (!unit?.id) return null;

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
          <CollaborativeChatWrapper />
        </SectionProvider>
      </DictionaryProvider>
    </FilesProvider>
  );
}

function WrappedPage() {
  return <UnitPage />;
}

export default WrappedPage;
