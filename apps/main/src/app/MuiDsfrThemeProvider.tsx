'use client';

import { createMuiDsfrThemeProvider } from '@codegouvfr/react-dsfr/mui';
import { frFR as coreFrFR } from '@mui/material/locale';
// import { DataGrid, frFR as dataGridFrFR } from '@mui/x-data-grid';
import { frFR as datePickerFrFR } from '@mui/x-date-pickers';

export const { MuiDsfrThemeProvider } = createMuiDsfrThemeProvider({
  augmentMuiTheme: ({ nonAugmentedMuiTheme, frColorTheme }) => {
    return {
      ...nonAugmentedMuiTheme,
      components: {
        ...nonAugmentedMuiTheme.components,
        // Bring i18n for components like DatePicker
        ...datePickerFrFR.components,
        // ...dataGridFrFR.components,
        ...coreFrFR.components,
      },
    };
  },
});