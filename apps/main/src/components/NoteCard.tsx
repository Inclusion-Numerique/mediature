'use client';

import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useConfirm } from 'material-ui-confirm';
import { useState } from 'react';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trpc } from '@mediature/main/src/client/trpcClient';
import { CaseNoteSchemaType } from '@mediature/main/src/models/entities/case';
import { menuPaperProps } from '@mediature/ui/src/utils/menu';

import { UpdateNoteForm } from '../app/(private)/dashboard/authority/[authorityId]/case/sss/UpdateNoteForm';

export const NodeCardContext = createContext({
  ContextualUpdateNoteForm: UpdateNoteForm,
});

export interface NoteCardProps {
  note: CaseNoteSchemaType;
}

export function NoteCard(props: NoteCardProps) {
  const { t } = useTranslation('common');
  const { ContextualUpdateNoteForm } = useContext(NodeCardContext);

  const removeNoteFromCase = trpc.removeNoteFromCase.useMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const handeOpenModal = () => {
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const [menuAnchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const askRemovalConfirmation = useConfirm();

  const removeAction = async () => {
    try {
      await askRemovalConfirmation({
        description: <>Êtes-vous sûr de vouloir supprimer de cette note ?</>,
      });
    } catch (e) {
      return;
    }

    await removeNoteFromCase.mutateAsync({
      noteId: props.note.id,
    });

    handleCloseMenu();
    handleCloseModal();

    // TODO: success message?
  };

  return (
    <>
      <Card variant="outlined">
        <CardActionArea onClick={handeOpenModal}>
          <CardContent>
            <Grid container spacing={2} sx={{ justifyContent: 'space-between' }}>
              <Grid item xs="auto">
                Note
              </Grid>
              <Grid item xs="auto">
                {t('date.short', { date: props.note.date })}
              </Grid>
            </Grid>
          </CardContent>
        </CardActionArea>
      </Card>
      <Menu
        anchorEl={menuAnchorEl}
        id="note-menu"
        open={menuOpen}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
        PaperProps={{ ...menuPaperProps }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={removeAction}>
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" />
          </ListItemIcon>
          Supprimer
        </MenuItem>
      </Menu>
      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="lg">
        <DialogTitle>
          <Grid container spacing={2} justifyContent="space-between" alignItems="center">
            <Grid item xs="auto">
              Édition de note
            </Grid>
            <Grid item xs="auto">
              <Tooltip title="Options de la note">
                <IconButton
                  onClick={handleOpenMenu}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-label="options"
                  aria-controls={modalOpen ? 'note-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={modalOpen ? 'true' : undefined}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleCloseModal} size="small" sx={{ ml: 1 }}>
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <ContextualUpdateNoteForm note={props.note} />
        </DialogContent>
      </Dialog>
    </>
  );
}
