'use client';
import * as React from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Box from '@mui/material/Box';
import AppSkeleton from "@/components/AppSkeleton";
import MyAuth from "@/components/AmplifyAuthenticator";
import { useRouter } from "next/navigation";

function ProfileRedirect() {
  const router = useRouter();

  React.useEffect(() => {
    async function redirect() {
      try {
        const userAttributes = await fetchUserAttributes();
        const username = userAttributes?.sub || '';
        if (username) {
          router.replace(`/profile/${username}`);
        }
      } catch (err) {
        console.warn('[Profile] Could not fetch user for redirect:', err);
      }
    }
    redirect();
  }, [router]);

  return <AppSkeleton variant="redirect" />;
}

export default function WrappedPage() {
  return (
    <MyAuth>
      <ProfileRedirect />
    </MyAuth>
  )
}
