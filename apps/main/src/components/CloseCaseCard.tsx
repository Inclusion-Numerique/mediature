'use client';

import { useColors } from '@codegouvfr/react-dsfr/useColors';
import { Button, Card, CardContent, Collapse, Grid, TextField, Tooltip, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useConfirm } from 'material-ui-confirm';
import { PropsWithChildren, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { UpdateCaseSchemaType } from '@mediature/main/src/models/actions/case';
import { CaseSchemaType } from '@mediature/main/src/models/entities/case';

export interface CloseCaseCardProps {
  case: CaseSchemaType;
  wrapperForm: UseFormReturn<UpdateCaseSchemaType>;
  closeAction: (value: boolean) => Promise<void>;
}

export function CloseCaseCard(props: PropsWithChildren<CloseCaseCardProps>) {
  const [closeAreaExpanded, setCloseAreaExpanded] = useState<boolean>(!!props.case.closedAt);

  const askCloseCaseConfirmation = useConfirm();
  const askReopenCaseConfirmation = useConfirm();

  const {
    register,
    formState: { errors },
  } = props.wrapperForm;

  const theme = useColors();

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: theme.decisions.background.alt.yellowMoutarde.default,
      }}
    >
      <CardContent>
        <Grid container direction={'column'} spacing={2}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography component="span" variant="h6">
              Clôture du dossier
            </Typography>
            {!closeAreaExpanded && (
              <Button onClick={() => setCloseAreaExpanded(true)} size="large" variant="contained" sx={{ ml: 'auto' }}>
                Renseigner une conclusion
              </Button>
            )}
            {!!props.case.closedAt && (
              <Button
                onClick={async () => {
                  try {
                    await askReopenCaseConfirmation({
                      description: (
                        <>
                          Êtes-vous vous sûr de vouloir réouvrir le dossier ?
                          <br />
                          <br />
                          <Typography component="span" sx={{ fontStyle: 'italic' }}>
                            Dans le cas d&apos;une simple modification de texte vous pouvez manipuler le dossier même s&apos;il est fermé.
                          </Typography>
                        </>
                      ),
                    });
                  } catch (e) {
                    return;
                  }

                  await props.closeAction(true);
                }}
                color="error"
                size="large"
                variant="text"
                sx={{ ml: 'auto' }}
              >
                Réouvrir le dossier
              </Button>
            )}
          </Grid>
          <Grid item xs={12}>
            <Collapse in={closeAreaExpanded}>
              <Grid container direction="column" spacing={2}>
                {!!props.case.closedAt && (
                  <Grid item xs={12}>
                    <Tooltip title={format(props.case.closedAt, 'PPPPpppp')}>
                      <div>
                        <DatePicker
                          label="Date de clôture"
                          readOnly
                          value={props.case.closedAt}
                          onChange={(newValue) => {}}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </div>
                    </Tooltip>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    label="Raisons de la décision (note interne)"
                    {...register('finalConclusion')}
                    error={!!errors.finalConclusion}
                    helperText={errors?.finalConclusion?.message}
                    multiline
                    minRows={5}
                    maxRows={10}
                    fullWidth
                  />
                </Grid>
                {!props.case.closedAt && (
                  <Grid item xs={12}>
                    <Button
                      onClick={async () => {
                        try {
                          await askCloseCaseConfirmation({
                            description: (
                              <>
                                Êtes-vous sûr de vouloir clôturer ce dossier ?
                                <br />
                                <br />
                                <Typography component="span" sx={{ fontStyle: 'italic' }}>
                                  Le requérant sera notifié de la fermerture du dossier.
                                </Typography>
                              </>
                            ),
                          });
                        } catch (e) {
                          return;
                        }

                        await props.closeAction(true);
                      }}
                      size="large"
                      variant="contained"
                      fullWidth
                    >
                      Clôturer le dossier
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Collapse>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}