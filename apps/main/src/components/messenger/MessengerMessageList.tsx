import { useColors } from '@codegouvfr/react-dsfr/useColors';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { MessageSchemaType } from '@mediature/main/src/models/entities/messenger';
import { Avatar } from '@mediature/ui/src/Avatar';
import { inlineEditorStateToText } from '@mediature/ui/src/utils/lexical';

export interface MessengerMessageListProps {
  messages: MessageSchemaType[];
  selectedMessage?: MessageSchemaType | null;
  onMessageClick?: (message: MessageSchemaType) => void;
}

export function MessengerMessageList({ messages, selectedMessage, onMessageClick }: MessengerMessageListProps) {
  const { t } = useTranslation('common');

  const theme = useColors();

  return (
    <List>
      {messages.map((message) => {
        const selected = message.id === selectedMessage?.id;

        return (
          <Box component="li" key={message.id} sx={{ p: 0 }}>
            <ListItem component="div" sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => {
                  onMessageClick && onMessageClick(message);
                }}
                sx={{
                  ...(selected
                    ? {
                        bgcolor: theme.decisions.background.contrast.blueFrance.default,
                        '&:hover': {
                          bgcolor: theme.decisions.background.contrast.blueFrance.hover,
                        },
                        '&:active': {
                          bgcolor: theme.decisions.background.contrast.blueFrance.active,
                        },
                      }
                    : {}),
                  px: 2,
                  py: 3,
                }}
              >
                <ListItemAvatar sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Avatar fullName={message.from.name || message.from.email} size={40} />
                </ListItemAvatar>
                <Box
                  sx={{
                    width: '100%',
                    overflow: 'hidden',
                    pl: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="subtitle2">{message.from.name || message.from.email}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textColor: 'text.tertiary',
                      }}
                    >
                      {t('date.relative', { date: message.createdAt })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                      }}
                    >
                      {message.subject}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textColor: 'text.tertiary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {inlineEditorStateToText(message.content)}
                    </Typography>
                  </Box>
                </Box>
              </ListItemButton>
            </ListItem>
            <Divider variant="fullWidth" sx={{ p: 0 }} />
          </Box>
        );
      })}
    </List>
  );
}
