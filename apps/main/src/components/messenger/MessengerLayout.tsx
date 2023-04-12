import Box, { BoxProps } from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import * as React from 'react';

export const Root = (props: BoxProps) => (
  <Box
    {...props}
    sx={[
      {
        bgcolor: 'background.bodyEmail',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'minmax(160px, 300px) minmax(450px, 1fr)',
          md: 'minmax(200px, 500px) minmax(500px, 1fr)',
        },
        gridTemplateRows: '64px 1fr',
      },
      ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
    ]}
  />
);

export const SidePanel = (props: BoxProps) => (
  <Box
    component="nav"
    className="Navigation"
    {...props}
    sx={[
      {
        // position: 'sticky',
        // top: '1rem',
        bgcolor: 'background.componentBg',
        display: {
          xs: 'none',
          md: 'initial',
        },
      },
      ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
    ]}
  />
);

export const Main = (props: BoxProps) => <Box {...props} sx={[{ pl: 2 }, ...(Array.isArray(props.sx) ? props.sx : [props.sx])]} />;

export const SideDrawer = ({ onClose, ...props }: BoxProps & { onClose: React.MouseEventHandler<HTMLDivElement> }) => (
  <Box {...props} sx={[{ position: 'fixed', zIndex: 1200, width: '100%', height: '100%' }, ...(Array.isArray(props.sx) ? props.sx : [props.sx])]}>
    <Box
      role="button"
      onClick={onClose}
      sx={{
        position: 'absolute',
        inset: 0,
        // bgcolor: (theme) => `rgba(${theme.vars.palette.neutral.darkChannel} / 0.8)`,
      }}
    />
    <Paper
      sx={{
        minWidth: 256,
        width: 'max-content',
        height: '100%',
        p: 2,
        boxShadow: 'lg',
        bgcolor: 'background.componentBg',
      }}
    >
      {props.children}
    </Paper>
  </Box>
);
