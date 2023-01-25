import { TypographyProps } from '@mui/material';
import { useConfirm } from 'material-ui-confirm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RegisterOptions } from 'react-hook-form';

export function forceHtmlRadioOutputToBeBoolean(value: string | null): boolean | null {
  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  } else if (value === null) {
    // Sometimes the radio group can be optional, allow this case
    return null;
  } else {
    throw new Error(`this radio group is supposed to only manage string boolean values ("true", "false"), or can optionally be null.`);
  }
}

export const reactHookFormBooleanRadioGroupRegisterOptions = {
  setValueAs: forceHtmlRadioOutputToBeBoolean,
} as RegisterOptions;

export const formTitleProps: TypographyProps<'h1'> = {
  variant: 'h4',
  sx: {
    mb: 2,
  },
};

// Since Next 13 it's not that easy to prevent leaving page from router hooks...
// Read the below link and give it a try... no sure 100% it can prevent navigation (except if wrapping all NextLink components + router.push)
// https://github.com/vercel/next.js/discussions/41745#discussioncomment-3987025
export function useWarnLeavingDirtyForm(isDirty: boolean) {
  const router = useRouter();
  const askConfirmation = useConfirm();

  useEffect(() => {
    const warningText = 'Vous avez faits des modifications qui ne sont pas enregistrées, êtes-vous sûr de vouloir quitter cette page ?';

    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;

      e.preventDefault();

      return (e.returnValue = warningText);
    };
    const handleBrowseAway = () => {
      if (!isDirty) return;

      if (window.confirm(warningText)) return;

      router.events.emit('routeChangeError');
      throw 'routeChange aborted';
    };

    window.addEventListener('beforeunload', handleWindowClose);
    router.events.on('routeChangeStart', handleBrowseAway);
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
      router.events.off('routeChangeStart', handleBrowseAway);
    };
  }, [isDirty]);
}
