'use client';

import { Grid, Typography } from '@mui/material';

import { ResetPasswordForm } from '@mediature/main/app/(visitor-only)/auth/password/reset/ResetPasswordForm';
import { formTitleProps } from '@mediature/main/utils/form';
import { centeredFormContainerGridProps } from '@mediature/main/utils/grid';

export default function ResetPasswordPage() {
  return (
    <Grid container {...centeredFormContainerGridProps}>
      <Typography component="h1" {...formTitleProps}>
        Redéfinir votre mot de passe
      </Typography>
      <ResetPasswordForm />
    </Grid>
  );
}
