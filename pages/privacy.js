import * as React from 'react';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import MainToolbar from '../src/components/MainToolbar';

function PrivacyPolicy() {
  /**
   * Privacy Policy page that displays the privacy policy information.
   * This page is accessible to all users and does not require authentication.
   */

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
              Privacy Policy
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
              Privacy Policy
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Last updated: {new Date().toLocaleDateString()}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              1. Introduction
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to Homework Supply. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we handle your personal data when you use our Japanese 
              language learning platform.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              2. Information We Collect
            </Typography>
            <Typography variant="body1" paragraph>
              We collect and process the following types of information:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                <strong>Account Information:</strong> Email address, username, and password when you create an account
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>Learning Data:</strong> Your assignments, grades, unit progress, and submissions
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>User Content:</strong> Audio recordings, text responses, and other materials you create or upload
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>Usage Information:</strong> How you interact with our platform, including pages visited and features used
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              3. How We Use Your Information
            </Typography>
            <Typography variant="body1" paragraph>
              We use your information to:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                Provide and maintain our educational services
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Track your learning progress and provide personalized feedback
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Enable instructors to grade assignments and monitor student progress
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Improve and optimize our platform and educational content
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Communicate with you about your account and our services
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              4. Data Storage and Security
            </Typography>
            <Typography variant="body1" paragraph>
              Your data is stored securely using Amazon Web Services (AWS) infrastructure, including:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                AWS Cognito for authentication and user management
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                AWS DynamoDB for database storage with encryption at rest
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                AWS S3 for file storage with appropriate access controls
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              5. Data Sharing
            </Typography>
            <Typography variant="body1" paragraph>
              We do not sell your personal information. We may share your data only in the following circumstances:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                <strong>With Instructors:</strong> Your assignments, grades, and learning progress are visible to your instructors
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>With Classmates:</strong> Published content may be visible to other students in your section
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>AI Processing:</strong> We use OpenAI services to process audio transcriptions, generate feedback, 
                and provide AI-assisted learning features
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights and users
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              6. Your Rights
            </Typography>
            <Typography variant="body1" paragraph>
              You have the right to:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                Access your personal data
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Correct inaccurate or incomplete data
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Request deletion of your data
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Export your data
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Opt out of certain data processing activities
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              You can manage many of these settings through your profile page.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              7. Cookies and Tracking
            </Typography>
            <Typography variant="body1" paragraph>
              We use local storage and session storage to maintain your login state and cache data for offline 
              functionality. We do not use third-party tracking cookies for advertising purposes.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              8. Children's Privacy
            </Typography>
            <Typography variant="body1" paragraph>
              Our service is intended for educational use. If you are under 18, please ensure you have your parent 
              or guardian's permission before using our platform. We do not knowingly collect personal information 
              from children without appropriate consent.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              9. Changes to This Policy
            </Typography>
            <Typography variant="body1" paragraph>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the 
              new privacy policy on this page and updating the "Last updated" date.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              10. Contact Us
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions about this privacy policy or our privacy practices, please contact us through 
              your instructor or the platform administrator.
            </Typography>
          </Card>
        </Container>
      </Box>
    </>
  );
}

export default PrivacyPolicy;
