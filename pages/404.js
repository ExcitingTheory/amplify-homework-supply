import * as React from 'react';
import { Box, Typography, Button, AppBar, Card, CardContent } from '@mui/material';
import MainToolbar from '../src/components/MainToolbar';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/router';

/**
 * Custom 404 page
 * 
 * This page is displayed when a user navigates to a route that doesn't exist.
 * It follows the Material UI theme and design patterns used throughout the app.
 */
export default function Custom404() {
  const router = useRouter();

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
              Homework Supply
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          paddingTop: '6rem', // Account for fixed AppBar
        }}
      >
        <Card
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '600px',
            width: '100%',
            padding: '3rem',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 120,
              color: 'primary.main',
              marginBottom: 2,
            }}
          />
          
          <CardContent>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '3rem', sm: '4rem' },
                fontWeight: 700,
                color: 'primary.main',
                marginBottom: 1,
              }}
            >
              404
            </Typography>
            
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 600,
                marginBottom: 2,
                color: 'text.primary',
              }}
            >
              Page Not Found
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                marginBottom: 4,
                lineHeight: 1.6,
              }}
            >
              The page you're looking for doesn't exist or has been moved.
              Please check the URL or return to the home page.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<HomeIcon />}
                onClick={() => router.push('/')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                Go to Home
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => router.back()}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(85, 108, 214, 0.04)',
                  },
                }}
              >
                Go Back
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
