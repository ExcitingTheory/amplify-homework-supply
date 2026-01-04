import * as React from 'react';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import theme from '../src/theme';
import createEmotionCache from '../src/createEmotionCache';
import amplifyconfig from '../src/amplifyconfiguration.json';

import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';
import { Amplify, AWSCloudWatchProvider, Logger } from "aws-amplify";
import { AuthModeStrategyType } from 'aws-amplify/datastore';

// Configure Amplify BEFORE importing components that use DataStore
Amplify.configure({
  ...amplifyconfig,
  DataStore: {
    authModeStrategyType: AuthModeStrategyType.MULTI_AUTH,
  },
})

// Schema version - increment this when you run amplify push with schema changes
const SCHEMA_VERSION = '1.0.1';

// Clear DataStore only when schema version changes (dynamic import to avoid premature DataStore initialization)
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem('datastore_schema_version');
  
  if (storedVersion !== SCHEMA_VERSION) {
    console.log(`Schema version mismatch. Stored: ${storedVersion}, Current: ${SCHEMA_VERSION}. Clearing DataStore...`);
    
    // Set a flag to prevent infinite reload loops
    const isClearing = sessionStorage.getItem('datastore_clearing');
    
    if (!isClearing) {
      sessionStorage.setItem('datastore_clearing', 'true');
      
      import('aws-amplify/datastore').then(({ DataStore }) => {
        DataStore.clear()
          .then(() => {
            localStorage.setItem('datastore_schema_version', SCHEMA_VERSION);
            sessionStorage.removeItem('datastore_clearing');
            console.log('DataStore cleared and version updated. Reloading...');
            // Reload the page to reinitialize all DataStore contexts
            window.location.reload();
          })
          .catch(err => {
            console.log('Error clearing DataStore:', err);
            sessionStorage.removeItem('datastore_clearing');
          });
      });
    }
  }
}

// Client-side cache, shared for the whole session of the user in the browser.

const clientSideEmotionCache = createEmotionCache();


// investigate:
// remote console logging to capture errors in production
// const logger = new Logger('CloudWatchLogger');
// const AmazonCloudWatchLogsProvider = new AWSCloudWatchProvider({
//   logGroupName: 'amplify-homework-supply-logs',
//   logStreamName: `frontend-${new Date().toISOString().split('T')[0]}`, // Daily log streams
//   region: amplifyconfig.aws_project_region,
//   level: 'ERROR', // Log only errors
//   logger: logger,
// });
// Amplify.addPluggable(new AmazonCloudWatchLogsProvider());


export default function MyApp(props) {
  /**
   * MyApp is the root component of the application.
   * It is used to initialize the emotion cache and theme, and it wraps the application in the ThemeProvider.
   * It also wraps the application in the CacheProvider to allow for server-side rendering.
   * 
   * @param {object} props
   * @param {React.ComponentType} props.Component
   * @param {object} props.emotionCache
   * @param {object} props.pageProps
   * @returns {JSX.Element}
   * 
   * @see https://mui.com/styles/advanced/#server-side-rendering
   * @see https://mui.com/guides/server-rendering/#the-client-side
   * @see https://mui.com/guides/server-rendering/#the-cache-provider
   * @see https://mui.com/guides/server-rendering/#the-emotion-cache
   * @see https://mui.com/guides/server-rendering/#the-theme-provider
   * @see https://mui.com/guides/server-rendering/#the-app-component
   * @see https://mui.com/guides/server-rendering/#the-document-component
   * @see https://mui.com/guides/server-rendering/#the-404-page
   * @see https://mui.com/guides/server-rendering/#the-500-page
   * @see https://mui.com/guides/server-rendering/#the-terms-of-service-page
   * @see https://mui.com/guides/server-rendering/#the-privacy-policy-page
   * 
   * TODO: Add a custom 404 page
   * TODO: Add a custom Terms of Service page
   * TODO: Add a custom Privacy Policy page
   * TODO: Add a generic error page
   * 
   */
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  // Start DataStore once at app level
  useEffect(() => {
    let isStarted = false;
    
    const startDataStore = async () => {
      if (typeof window !== 'undefined' && !isStarted) {
        try {
          const { DataStore } = await import('aws-amplify/datastore');
          await DataStore.start();
          isStarted = true;
        } catch (error) {
          console.error('[_app] Error starting DataStore:', error);
        }
      }
    };

    startDataStore();
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
