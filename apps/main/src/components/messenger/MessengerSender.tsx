'use client';

import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { EventEmitter } from 'eventemitter3';
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { trpc } from '@mediature/main/src/client/trpcClient';
import { SendMessageForm } from '@mediature/main/src/components/messenger/SendMessageForm';
import { ContactInputSchemaType } from '@mediature/main/src/models/entities/messenger';
import { centeredAlertContainerGridProps } from '@mediature/main/src/utils/grid';
import { ErrorAlert } from '@mediature/ui/src/ErrorAlert';
import { LoadingArea } from '@mediature/ui/src/LoadingArea';

export const MessengerSenderContext = createContext({
  ContextualSendMessageForm: SendMessageForm,
});

export interface MessengerSenderProps {
  caseId: string;
  eventEmitter: EventEmitter;
  prefillRecipients?: ContactInputSchemaType[];
  prefillSubject?: string;
}

export function MessengerSender(props: MessengerSenderProps) {
  const { t } = useTranslation('common');
  const { ContextualSendMessageForm } = useContext(MessengerSenderContext);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const handeOpenModal = () => {
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const { data, error, isLoading, refetch } = trpc.getMessageRecipientsSuggestions.useQuery({
    caseId: props.caseId,
  });

  const recipientsSuggestions = data?.recipientsSuggestions || [];

  useEffect(() => {
    props.eventEmitter.on('click', (event) => {
      if (modalOpen) {
        handleCloseModal();
      } else {
        handeOpenModal();
      }
    });

    return function cleanup() {
      props.eventEmitter.removeAllListeners();
    };
  }, [props.eventEmitter, modalOpen]);

  return (
    <>
      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="lg">
        <DialogTitle>
          <Grid container spacing={2} justifyContent="space-between" alignItems="center">
            <Grid item xs="auto">
              Nouveau message
            </Grid>
            <Grid item xs="auto">
              <IconButton aria-label="fermer" onClick={handleCloseModal} size="small">
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <LoadingArea ariaLabelTarget="messagerie du dossier" />
          ) : (
            <>
              {!!error ? (
                <Grid container {...centeredAlertContainerGridProps}>
                  <ErrorAlert errors={[error]} refetchs={[refetch]} />
                </Grid>
              ) : (
                <ContextualSendMessageForm
                  recipientsSuggestions={recipientsSuggestions}
                  prefill={{
                    caseId: props.caseId,
                    to: props.prefillRecipients,
                    subject: props.prefillSubject,
                  }}
                  onSuccess={() => {
                    handleCloseModal();
                  }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
