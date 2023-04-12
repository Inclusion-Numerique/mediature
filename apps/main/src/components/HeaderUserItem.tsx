'use client';

import DashboardIcon from '@mui/icons-material/Dashboard';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FocusTrap from '@mui/material/Unstable_TrapFocus';
import { EventEmitter } from 'eventemitter3';
import NextLink from 'next/link';
import { PropsWithChildren, useEffect, useState } from 'react';

import { useLiveChat } from '@mediature/main/src/components/live-chat/useLiveChat';
import { TokenUserSchemaType } from '@mediature/main/src/models/entities/user';
import { logout } from '@mediature/main/src/utils/auth';
import { linkRegistry } from '@mediature/main/src/utils/routes/registry';
import { Avatar } from '@mediature/ui/src/Avatar';
import { menuPaperProps } from '@mediature/ui/src/utils/menu';

export interface HeaderUserItemProps {
  user: TokenUserSchemaType;
  eventEmitter: EventEmitter;
  showDashboardMenuItem?: boolean;
}

export function HeaderUserItem(props: PropsWithChildren<HeaderUserItemProps>) {
  const { showLiveChat } = useLiveChat();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    props.eventEmitter.on('click', (event) => {
      if (open) {
        handleClose();
      } else {
        handleClick(event);
      }
    });

    return function cleanup() {
      props.eventEmitter.removeAllListeners();
    };
  }, [props.eventEmitter, open]);

  return (
    <Box aria-label="options" aria-controls={open ? 'account-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
      <Grid container direction="row" alignItems="center" spacing={1}>
        <Grid item>
          <Avatar fullName={`${props.user.firstname} ${props.user.lastname}`} />
        </Grid>
        <Grid item>
          {props.user.firstname} {props.user.lastname}
        </Grid>
      </Grid>
      <FocusTrap open={open}>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          disableEnforceFocus={true} // Required otherwise on responsive navbar clicking when the menu is open throws an error ("Maximum call stack size exceeded" on the "FocusTrap"). I did not find a way to fix this :/ ... not sure about the accessibility impact so we added manually a `<FocusTrap>` (https://mui.com/material-ui/react-modal/#focus-trap)?
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{ ...menuPaperProps }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{ zIndex: 2000 }} // Needed to be displayed over the navbar on mobile devices
        >
          {props.showDashboardMenuItem === true && (
            <MenuItem component={NextLink} href={linkRegistry.get('dashboard', undefined)}>
              <ListItemIcon>
                <DashboardIcon fontSize="small" />
              </ListItemIcon>
              Tableau de bord
            </MenuItem>
          )}
          <MenuItem component={NextLink} href={linkRegistry.get('accountSettings', undefined)}>
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            Mon compte
          </MenuItem>
          <MenuItem onClick={showLiveChat}>
            <ListItemIcon>
              <HelpOutlineIcon fontSize="small" />
            </ListItemIcon>
            Obtenir de l&apos;aide
          </MenuItem>
          <MenuItem onClick={logout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Se déconnecter
          </MenuItem>
        </Menu>
      </FocusTrap>
    </Box>
  );
}
