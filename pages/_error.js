import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import Head from 'next/head';

function Error({ statusCode }) {
  /**
   * Custom error page for handling both client-side and server-side errors.
   * This page is displayed when an error occurs in the application.
   * 
   * @param {number} statusCode - HTTP status code (404, 500, etc.)
   * @returns {JSX.Element}
   * 
   * @see https://nextjs.org/docs/advanced-features/custom-error-page
   */

  // Determine error message based on status code
  const getErrorMessage = (code) => {
    switch (code) {
      case 404:
        return {
          title: 'Page Not Found',
          description: 'The page you are looking for does not exist or has been moved.',
        };
      case 500:
        return {
          title: 'Internal Server Error',
          description: 'Something went wrong on our end. Please try again later.',
        };
      case 403:
        return {
          title: 'Access Forbidden',
          description: 'You do not have permission to access this resource.',
        };
      case 401:
        return {
          title: 'Unauthorized',
          description: 'Please sign in to access this page.',
        };
      default:
        return {
          title: 'An Error Occurred',
          description: 'An unexpected error has occurred. Please try again later.',
        };
    }
  };

  const errorInfo = getErrorMessage(statusCode);

  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} - ${errorInfo.title}` : 'Error'} | Homework Supply</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            py: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 6,
              borderRadius: 3,
              maxWidth: 600,
              width: '100%',
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 3,
              }}
            />
            
            {statusCode && (
              <Typography
                variant="h1"
                component="div"
                sx={{
                  fontSize: '4rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  mb: 2,
                }}
              >
                {statusCode}
              </Typography>
            )}

            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              {errorInfo.title}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              {errorInfo.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                href="/"
                startIcon={<HomeIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
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
                onClick={() => window.history.back()}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
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
          </Paper>
        </Box>
      </Container>
    </>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
