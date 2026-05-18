import { Suspense } from "react";
import WorkbookClient from "./WorkbookClient";

interface WorkbookPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function WorkbookPage({ params }: WorkbookPageProps) {
  await params;

  return (
    <Suspense>
      <WorkbookClient />
    </Suspense>
  );
}
