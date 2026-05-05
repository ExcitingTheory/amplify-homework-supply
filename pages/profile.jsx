import * as React from 'react';
import { useRouter } from 'next/router';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Box from '@mui/material/Box';
import AppSkeleton from '../src/components/AppSkeleton';
import MyAuth from '../src/components/AmplifyAuthenticator';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config';

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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components'], nextI18nextConfig)),
    },
  }
}
