import * as React from 'react';
import { useRouter } from 'next/router';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { CircularProgress, Box } from '@mui/material';
import MyAuth from '../src/components/authenticator';
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

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
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
