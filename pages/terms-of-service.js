import * as React from 'react';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';

function TermsOfService() {
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
        <Toolbar variant="dense" sx={{ minHeight: '48px' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="home"
            href="/"
          >
            <HomeIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Terms of Service
            </Typography>
          </Box>
        </Toolbar>
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
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          maxWidth: '60rem',
        }}>
          <CardContent>
            <Typography variant="h3" component="h1" gutterBottom>
              Terms of Service
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Last Updated: {new Date().toLocaleDateString()}
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" paragraph>
              By accessing and using Homework Supply, you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by the above, please do not use 
              this service.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              2. Description of Service
            </Typography>
            <Typography variant="body1" paragraph>
              Homework Supply is a Japanese language learning platform that provides educational content, 
              exercises, and assessment tools for students and instructors. The service allows instructors 
              to create learning materials and students to complete assignments and track their progress.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              3. User Accounts
            </Typography>
            <Typography variant="body1" paragraph>
              You are responsible for maintaining the confidentiality of your account and password. You 
              agree to accept responsibility for all activities that occur under your account. You must 
              notify us immediately of any unauthorized use of your account.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              4. User Content
            </Typography>
            <Typography variant="body1" paragraph>
              You retain all rights to the content you create and upload to Homework Supply. By uploading 
              content, you grant us a license to store, display, and distribute your content as necessary 
              to provide the service. You are responsible for ensuring you have the necessary rights to 
              any content you upload.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              5. Acceptable Use
            </Typography>
            <Typography variant="body1" paragraph>
              You agree not to use the service to:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <Typography component="li" variant="body1" paragraph>
                Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, 
                harassing, defamatory, vulgar, obscene, or otherwise objectionable
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Impersonate any person or entity, or falsely state or misrepresent your affiliation with 
                a person or entity
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Interfere with or disrupt the service or servers or networks connected to the service
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Attempt to gain unauthorized access to any portion of the service or any other systems 
                or networks
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              6. Intellectual Property
            </Typography>
            <Typography variant="body1" paragraph>
              The service and its original content (excluding user-generated content), features, and 
              functionality are owned by Homework Supply and are protected by international copyright, 
              trademark, patent, trade secret, and other intellectual property laws.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              7. Privacy
            </Typography>
            <Typography variant="body1" paragraph>
              Your use of the service is also governed by our Privacy Policy. Please review our Privacy 
              Policy to understand our practices regarding the collection and use of your information.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              8. Termination
            </Typography>
            <Typography variant="body1" paragraph>
              We may terminate or suspend your account and access to the service immediately, without 
              prior notice or liability, for any reason, including if you breach the Terms of Service. 
              Upon termination, your right to use the service will immediately cease.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              9. Limitation of Liability
            </Typography>
            <Typography variant="body1" paragraph>
              In no event shall Homework Supply, nor its directors, employees, partners, agents, suppliers, 
              or affiliates, be liable for any indirect, incidental, special, consequential, or punitive 
              damages, including without limitation, loss of profits, data, use, goodwill, or other 
              intangible losses, resulting from your access to or use of or inability to access or use 
              the service.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              10. Disclaimer
            </Typography>
            <Typography variant="body1" paragraph>
              Your use of the service is at your sole risk. The service is provided on an "AS IS" and 
              "AS AVAILABLE" basis. The service is provided without warranties of any kind, whether 
              express or implied, including, but not limited to, implied warranties of merchantability, 
              fitness for a particular purpose, non-infringement, or course of performance.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              11. Changes to Terms
            </Typography>
            <Typography variant="body1" paragraph>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, 
              we will provide at least 30 days' notice prior to any new terms taking effect. What 
              constitutes a material change will be determined at our sole discretion.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              12. Governing Law
            </Typography>
            <Typography variant="body1" paragraph>
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction 
              in which Homework Supply operates, without regard to its conflict of law provisions.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
              13. Contact Us
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions about these Terms, please contact us through the application 
              support channels.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}

export default TermsOfService;
