import * as React from 'react';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import { useTranslation } from 'next-i18next';

export default function Copyright() {
  const { t } = useTranslation('components');
  
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {t('copyright.text')}{' '}
      <MuiLink color="inherit" href="https://mui.com/">
        {t('copyright.website')}
      </MuiLink>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}
