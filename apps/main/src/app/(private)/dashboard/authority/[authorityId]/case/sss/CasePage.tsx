'use client';

import { useColors } from '@codegouvfr/react-dsfr/useColors';
import { zodResolver } from '@hookform/resolvers/zod';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SaveIcon from '@mui/icons-material/Save';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useMemo, useRef, useState } from 'react';
import { createContext, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AddNoteForm } from '@mediature/main/src/app/(private)/dashboard/authority/[authorityId]/case/sss/AddNoteForm';
import { trpc } from '@mediature/main/src/client/trpcClient';
import { BaseForm } from '@mediature/main/src/components/BaseForm';
import { CloseCaseCard } from '@mediature/main/src/components/CloseCaseCard';
import { NoteCard } from '@mediature/main/src/components/NoteCard';
import { UpdateCaseSchema, UpdateCaseSchemaType } from '@mediature/main/src/models/actions/case';
import { CasePlatformSchema, CaseStatusSchema } from '@mediature/main/src/models/entities/case';
import { isReminderSoon } from '@mediature/main/src/utils/business/reminder';
import { centeredAlertContainerGridProps, centeredContainerGridProps, ulComponentResetStyles } from '@mediature/main/src/utils/grid';
import { CaseStatusChip } from '@mediature/ui/src/CaseStatusChip';
import { ErrorAlert } from '@mediature/ui/src/ErrorAlert';
import { LoadingArea } from '@mediature/ui/src/LoadingArea';

export const CasePageContext = createContext({
  ContextualNoteCard: NoteCard,
  ContextualAddNoteForm: AddNoteForm,
});

export interface CasePageProps {
  params: {
    authorityId: string;
    caseId: string;
  };
}

export function CasePage({ params: { authorityId, caseId } }: CasePageProps) {
  const { t } = useTranslation('common');
  const { ContextualNoteCard, ContextualAddNoteForm } = useContext(CasePageContext);

  const { data, error, isInitialLoading, isLoading, refetch } = trpc.getCase.useQuery({
    id: caseId,
  });

  const caseWrapper = data?.caseWrapper;

  const updateCase = trpc.updateCase.useMutation();

  const form = useForm<UpdateCaseSchemaType>({
    resolver: zodResolver(UpdateCaseSchema),
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    control,
    reset,
  } = form;

  useMemo(() => {
    if (isDirty) {
      return;
    }

    reset({
      caseId: caseWrapper?.case.id,
      initiatedFrom: caseWrapper?.case.initiatedFrom,
      close: !!caseWrapper?.case.closedAt,
      status: caseWrapper?.case.status,
      units: caseWrapper?.case.units,
      termReminderAt: caseWrapper?.case.termReminderAt,
      finalConclusion: caseWrapper?.case.finalConclusion,
      nextRequirements: caseWrapper?.case.nextRequirements,
    });
  }, [caseWrapper, isDirty, reset]);

  const theme = useColors();
  const reminderAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [reminderMinimumDate, setReminderMinimumDate] = useState<Date>(new Date());
  const [reminderPickerOpen, setReminderPickerOpen] = useState<boolean>(false);

  const [addNoteModalOpen, setAddNoteModalOpen] = useState<boolean>(false);
  const handeOpenAddNoteModal = () => {
    setAddNoteModalOpen(true);
  };
  const handleCloseAddNoteModal = () => {
    setAddNoteModalOpen(false);
  };

  if (error) {
    return (
      <Grid container {...centeredAlertContainerGridProps}>
        <ErrorAlert errors={[error]} refetchs={[refetch]} />
      </Grid>
    );
  } else if (isInitialLoading) {
    return <LoadingArea ariaLabelTarget="page" />;
  } else if (!caseWrapper) {
    // TODO: in case of error... do the right thing, "notFound() / error500..."
    // Error: <head> cannot appear as a child of <div>
    // notFound();
    return <span role="alert">Not found TODO</span>;
  }

  const targetedCase = caseWrapper.case;
  const citizen = caseWrapper.citizen;
  const notes = caseWrapper.notes;

  const updateCaseAction = async (input: UpdateCaseSchemaType) => {
    await updateCase.mutateAsync(input);

    // TODO: success message?
  };

  const onSubmit = async (input: UpdateCaseSchemaType) => {
    await updateCaseAction(input);
  };

  const onClick = () => {};

  return (
    <>
      <Grid container {...centeredContainerGridProps} spacing={2}>
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography component="b" variant="h4">
            {citizen.firstname} {citizen.lastname}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: '50%', mx: 2, my: 'auto' }} />
          <Typography component="b" variant="subtitle1">
            Dossier n°{targetedCase.humanId}
          </Typography>
          <DatePicker
            open={reminderPickerOpen}
            label="Date de la demande"
            value={targetedCase.termReminderAt}
            minDate={reminderMinimumDate}
            onChange={() => {}}
            onClose={() => {
              setReminderPickerOpen(false);
            }}
            onAccept={async (newDate) => {
              setValue('termReminderAt', newDate, {
                shouldDirty: false, // To keeping simple the isDirty for the manual part
              });

              try {
                await updateCaseAction({
                  termReminderAt: control._formValues.termReminderAt,
                  status: control._formValues.status,
                  // Do not update values that need a form submit
                  initiatedFrom: control._defaultValues.initiatedFrom || targetedCase.initiatedFrom,
                  caseId: control._defaultValues.caseId || targetedCase.id,
                  units: control._defaultValues.units || targetedCase.units,
                  close: control._defaultValues.close || !!targetedCase.closedAt,
                  finalConclusion: control._defaultValues.finalConclusion || targetedCase.finalConclusion,
                  nextRequirements: control._defaultValues.nextRequirements || targetedCase.nextRequirements,
                });
              } catch (err) {
                setValue('termReminderAt', control._defaultValues.termReminderAt || targetedCase.termReminderAt);
                // TODO: manage error

                throw err;
              }
            }}
            componentsProps={{
              actionBar: {
                actions: ['clear'],
              },
            }}
            PopperProps={{ anchorEl: reminderAnchorRef.current }}
            renderInput={(params) => {
              // TODO: aria labels from params?
              return (
                <Button
                  onClick={() => {
                    setReminderPickerOpen(!reminderPickerOpen);
                  }}
                  ref={reminderAnchorRef}
                  size="large"
                  variant="text"
                  color={targetedCase.termReminderAt && isReminderSoon(targetedCase.termReminderAt) ? 'error' : 'primary'}
                  startIcon={<AccessTimeIcon />}
                  sx={{ ml: 'auto' }}
                >
                  {targetedCase.termReminderAt ? (
                    <span>Échéance : {t('date.short', { date: targetedCase.termReminderAt })}</span>
                  ) : (
                    <span>Définir une échéance</span>
                  )}
                </Button>
              );
            }}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography component="span" variant="subtitle1">
            Avancement du dossier :
            <br />
            <TextField
              select
              aria-label="avancement du dossier"
              hiddenLabel={true}
              defaultValue={control._defaultValues.status || ''}
              inputProps={register('status')}
              onChange={async (event) => {
                try {
                  await updateCaseAction({
                    termReminderAt: control._formValues.termReminderAt,
                    status: control._formValues.status,
                    // Do not update values that need a form submit
                    initiatedFrom: control._defaultValues.initiatedFrom || targetedCase.initiatedFrom,
                    caseId: control._defaultValues.caseId || targetedCase.id,
                    units: control._defaultValues.units || targetedCase.units,
                    close: control._defaultValues.close || !!targetedCase.closedAt,
                    finalConclusion: control._defaultValues.finalConclusion || targetedCase.finalConclusion,
                    nextRequirements: control._defaultValues.nextRequirements || targetedCase.nextRequirements,
                  });
                } catch (err) {
                  setValue('status', control._defaultValues.status || targetedCase.status);
                  // TODO: manage error

                  throw err;
                }
              }}
              error={!!errors.status}
              helperText={errors.status?.message}
              margin="dense"
              fullWidth
            >
              {Object.values(CaseStatusSchema.Values).map((status) => (
                <MenuItem key={status} value={status}>
                  <CaseStatusChip status={status} />
                </MenuItem>
              ))}
            </TextField>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Divider variant="fullWidth" sx={{ p: 0 }} />
        </Grid>
        <Grid item xs={12}>
          <Grid container direction="column">
            <BaseForm handleSubmit={handleSubmit} onSubmit={onSubmit} control={control} ariaLabel="modifier un dossier">
              <Grid
                item
                xs={12}
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000,
                  background: theme.decisions.background.default.grey.default,
                  pb: 2,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs="auto" minWidth="33%">
                    <Button onClick={onClick} size="large" variant="contained" fullWidth startIcon={<MailOutlineIcon />}>
                      Messagerie
                    </Button>
                  </Grid>
                  {isDirty ? (
                    <Grid item xs>
                      <Button type="submit" size="large" variant="contained" color="warning" fullWidth startIcon={<SaveIcon />}>
                        Enregistrer les modifications en cours
                      </Button>
                    </Grid>
                  ) : (
                    <>
                      <Grid item xs>
                        <Button onClick={onClick} size="large" variant="contained" fullWidth startIcon={<DownloadIcon />}>
                          Télécharger le dossier
                        </Button>
                      </Grid>
                      <Grid item xs>
                        <Button onClick={onClick} size="large" variant="contained" fullWidth startIcon={<TransferWithinAStationIcon />}>
                          Transférer le dossier
                        </Button>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={12} sx={{ pt: 0 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Tooltip title={t('date.longWithTime', { date: targetedCase.createdAt })}>
                              <div>
                                <DatePicker
                                  label="Date de la demande"
                                  readOnly
                                  value={targetedCase.createdAt}
                                  onChange={(newValue) => {}}
                                  renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                              </div>
                            </Tooltip>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              label="Mode de saisine"
                              defaultValue={control._defaultValues.initiatedFrom || ''}
                              inputProps={register('initiatedFrom')}
                              error={!!errors.initiatedFrom}
                              helperText={errors.initiatedFrom?.message}
                              margin="dense"
                              fullWidth
                              sx={{ m: 0 }}
                            >
                              {Object.values(CasePlatformSchema.Values).map((initiatedFrom) => (
                                <MenuItem key={initiatedFrom} value={initiatedFrom}>
                                  {t(`model.case.platform.enum.${initiatedFrom}`)}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography component="span" variant="h6">
                          Coordonnées
                        </Typography>
                      </Grid>
                      {/* TODO: address+phone */}
                      <Grid item xs={12}>
                        <TextField
                          inputProps={{
                            readOnly: true,
                          }}
                          type="email"
                          label="Email"
                          value={citizen.email}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Divider variant="fullWidth" sx={{ p: 0 }} />
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container direction={'column'} spacing={2}>
                      <Grid item xs={12}>
                        <Typography component="span" variant="h6">
                          Demande
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          inputProps={{
                            readOnly: true,
                          }}
                          label="Motif de la demande"
                          value={targetedCase.description}
                          multiline
                          minRows={3}
                          maxRows={10}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography component="span" variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Premier recours à l&apos;amiable effectué ?
                        </Typography>
                        <br />
                        {/* TODO: bool */}
                        <Chip label={targetedCase.alreadyRequestedInThePast.toString()} />
                      </Grid>
                      {targetedCase.alreadyRequestedInThePast && (
                        <Grid item xs={12}>
                          <Typography component="span" variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Suite au premier recours, réponse de l&apos;administration reçue ?
                          </Typography>
                          <br />
                          {/* TODO: bool */}
                          <Chip label={targetedCase.gotAnswerFromPreviousRequest?.toString()} />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Divider variant="fullWidth" sx={{ p: 0 }} />
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container direction={'column'} spacing={2}>
                      <Grid item xs={12}>
                        <Typography component="span" variant="h6">
                          Compétences
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField type="email" label="Email" fullWidth />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Administration compétente"
                          {...register('units')}
                          error={!!errors.units}
                          helperText={errors?.units?.message}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Divider variant="fullWidth" sx={{ p: 0 }} />
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container direction={'column'} spacing={2}>
                      <Grid item xs={12}>
                        <Grid container spacing={1} justifyContent="space-between" alignItems="center">
                          <Grid item xs="auto">
                            <Typography component="span" variant="h6">
                              Notes
                            </Typography>
                          </Grid>
                          <Grid item xs="auto">
                            <Button onClick={handeOpenAddNoteModal} size="large" variant="contained" startIcon={<AddCircleOutlineIcon />}>
                              Ajouter une note
                            </Button>
                            <Dialog open={addNoteModalOpen} onClose={handleCloseAddNoteModal} fullWidth maxWidth="lg">
                              <DialogTitle>
                                <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                                  <Grid item xs="auto">
                                    Édition de note
                                  </Grid>
                                  <Grid item xs="auto">
                                    <IconButton onClick={handleCloseAddNoteModal} size="small">
                                      <CloseIcon />
                                    </IconButton>
                                  </Grid>
                                </Grid>
                              </DialogTitle>
                              <DialogContent>
                                <ContextualAddNoteForm prefill={{ caseId: targetedCase.id }} onSuccess={handleCloseAddNoteModal} />
                              </DialogContent>
                            </Dialog>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Grid container component="ul" spacing={2} sx={ulComponentResetStyles}>
                          {notes &&
                            notes.map((note) => (
                              <Grid key={note.id} item component="li" xs={12} sm={6} md={4}>
                                <ContextualNoteCard note={note} />
                              </Grid>
                            ))}
                        </Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Divider variant="fullWidth" sx={{ p: 0 }} />
              </Grid>
              {/* TODO: attachments */}
              <Grid item xs={12}>
                <Divider variant="fullWidth" sx={{ p: 0 }} />
              </Grid>
              <Grid item xs={12}>
                <CloseCaseCard
                  case={targetedCase}
                  wrapperForm={form}
                  closeAction={async (value: boolean) => {
                    setValue('close', value);

                    await updateCaseAction({
                      termReminderAt: control._formValues.termReminderAt,
                      status: control._formValues.status,
                      initiatedFrom: control._formValues.initiatedFrom,
                      caseId: control._formValues.caseId,
                      units: control._formValues.units,
                      close: control._formValues.close,
                      finalConclusion: control._formValues.finalConclusion,
                      nextRequirements: control._formValues.nextRequirements,
                    });
                  }}
                />
              </Grid>
            </BaseForm>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
