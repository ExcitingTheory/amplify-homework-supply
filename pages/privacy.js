import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import MainToolbar from '../src/components/MainToolbar';

/**
 * Privacy Policy page that displays the privacy policy information.
 * This page is accessible to all users and does not require authentication.
 */
function PrivacyPolicy() {
  const { t } = useTranslation('pages');
  
  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('privacy.title')}
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Box
        sx={{
          marginTop: '5rem',
          marginBottom: '3rem',
          padding: '1rem',
          minHeight: 'calc(100vh - 5rem)',
          overflow: 'auto',
        }}
      >
        <Container maxWidth="md">
          <Card sx={{
            padding: '3rem 2rem',
            margin: '1rem auto',
            height: 'fit-content',
          }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 3 }}>
              {t('privacy.title')}
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              {t('privacy.lastUpdated')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.introduction.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.introduction.content')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.informationWeCollect.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.informationWeCollect.intro')}
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.informationWeCollect.accountInfo')}</strong> {t('privacy.informationWeCollect.accountInfoText')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.informationWeCollect.learningData')}</strong> {t('privacy.informationWeCollect.learningDataText')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.informationWeCollect.userContent')}</strong> {t('privacy.informationWeCollect.userContentText')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.informationWeCollect.usageInfo')}</strong> {t('privacy.informationWeCollect.usageInfoText')}
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.howWeUseInfo.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.howWeUseInfo.intro')}
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.howWeUseInfo.item1')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.howWeUseInfo.item2')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.howWeUseInfo.item3')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.howWeUseInfo.item4')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.howWeUseInfo.item5')}
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.dataStorage.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.dataStorage.intro')}
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.dataStorage.item1')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.dataStorage.item2')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.dataStorage.item3')}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              {t('privacy.dataStorage.outro')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.dataSharing.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.dataSharing.intro')}
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.dataSharing.instructors')}</strong> {t('privacy.dataSharing.instructorsText')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.dataSharing.classmates')}</strong> {t('privacy.dataSharing.classmatesText')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.dataSharing.aiProcessing')}</strong> {t('privacy.dataSharing.aiProcessingText')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>{t('privacy.dataSharing.legal')}</strong> {t('privacy.dataSharing.legalText')}
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.yourRights.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.yourRights.intro')}
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.yourRights.item1')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.yourRights.item2')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.yourRights.item3')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.yourRights.item4')}
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                {t('privacy.yourRights.item5')}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              {t('privacy.yourRights.outro')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.cookies.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.cookies.content')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.childrensPrivacy.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.childrensPrivacy.content')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.policyChanges.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.policyChanges.content')}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              {t('privacy.contactUs.heading')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('privacy.contactUs.content')}
            </Typography>
          </Card>
        </Container>
      </Box>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages'])),
    },
  };
}

export default PrivacyPolicy;
