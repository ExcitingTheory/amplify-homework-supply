import * as React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { appWithTranslation } from 'next-i18next';
import nextI18NextConfig from '../next-i18next.config.js';
import theme from '../src/theme';
import createEmotionCache from '../src/createEmotionCache';
import outputs from '../amplify_outputs.json';

import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';
import { Amplify } from 'aws-amplify';
import { DebugPanelProvider } from '../src/components/DebugPanel';

// Configure Amplify Gen 2
Amplify.configure(outputs);

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

function MyApp(props) {
  /**
   * MyApp is the root component of the application.
   * It is used to initialize the emotion cache and theme, and it wraps the application in the ThemeProvider.
   * It also wraps the application in the CacheProvider to allow for server-side rendering.
   * Wrapped with appWithTranslation for i18n support.
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
   * TODO: Add a generic error page
   * 
   */
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <DebugPanelProvider>
          <Component {...pageProps} />
        </DebugPanelProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};

// Wrap with appWithTranslation to enable i18n
export default appWithTranslation(MyApp, nextI18NextConfig);
