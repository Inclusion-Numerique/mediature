'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FocusTrap from '@mui/material/Unstable_TrapFocus';
import { EventEmitter } from 'eventemitter3';
import NextLink from 'next/link';
import { PropsWithChildren, useEffect, useState } from 'react';

import { UserInterfaceAuthoritySchemaType } from '@mediature/main/src/models/entities/ui';
import { logout } from '@mediature/main/src/utils/auth';
import { linkRegistry } from '@mediature/main/src/utils/routes/registry';
import { Avatar } from '@mediature/ui/src/Avatar';
import { menuPaperProps } from '@mediature/ui/src/utils/menu';

export interface HeaderAuthoritySwitchItemProps {
  authorities: UserInterfaceAuthoritySchemaType[];
  currentAuthority?: UserInterfaceAuthoritySchemaType;
  eventEmitter: EventEmitter;
}

export function HeaderAuthoritySwitchItem(props: PropsWithChildren<HeaderAuthoritySwitchItemProps>) {
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
        {!!props.currentAuthority ? (
          <>
            {/* TODO: logo? */}
            {/* <Grid item>
              <Avatar fullName={`${props.currentAuthority.name}`} />
            </Grid> */}
            <Grid item>{props.currentAuthority.name}</Grid>
          </>
        ) : (
          <Grid item>Sélectionner une collectivité</Grid>
        )}
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
          {props.authorities.map((authority) => {
            return (
              <MenuItem
                key={authority.id}
                component={NextLink}
                href={linkRegistry.get('authority', {
                  authorityId: authority.id,
                })}
                selected={authority.id === props.currentAuthority?.id}
              >
                {authority.name}
              </MenuItem>
            );
          })}
        </Menu>
      </FocusTrap>
    </Box>
  );
}
