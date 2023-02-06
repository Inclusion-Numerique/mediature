'use client';

import { Link, Typography } from '@mui/material';
import NextLink from 'next/link';

import { linkRegistry } from '@mediature/main/src/utils/routes/registry';

export function OverviewPage() {
  const sampleAuthorityId = '5c03994c-fc16-47e0-bd02-d218a370a111';
  const sampleAuthoritySlug = 'seine-saint-denis';

  return (
    <div>
      <h1>Tableau de bord</h1>
      <Typography color="textSecondary" variant="body2">
        <Link component={NextLink} href={linkRegistry.get('authorityList', undefined)} variant="subtitle2" underline="none" sx={{ m: 2 }}>
          Liste des collectivités
        </Link>
        <Link
          component={NextLink}
          href={linkRegistry.get('addAgentToAuthority', { authorityId: sampleAuthorityId })}
          variant="subtitle2"
          underline="none"
          sx={{ m: 2 }}
        >
          Ajouter un agent
        </Link>
        <Link
          component={NextLink}
          href={linkRegistry.get('authorityAgentList', { authorityId: sampleAuthorityId })}
          variant="subtitle2"
          underline="none"
          sx={{ m: 2 }}
        >
          Liste des agents
        </Link>
        <Link
          component={NextLink}
          href={linkRegistry.get('caseList', { authorityId: sampleAuthorityId })}
          variant="subtitle2"
          underline="none"
          sx={{ m: 2 }}
        >
          Liste des dossiers
        </Link>
        <Link
          component={NextLink}
          href={linkRegistry.get('unassignedCaseList', { authorityId: sampleAuthorityId })}
          variant="subtitle2"
          underline="none"
          sx={{ m: 2 }}
        >
          Liste des dossiers non-assignés
        </Link>
        <Link
          component={NextLink}
          href={linkRegistry.get('requestToAuthority', { authority: sampleAuthoritySlug })}
          variant="subtitle2"
          underline="none"
          sx={{ m: 2 }}
        >
          Faire une demande
        </Link>
      </Typography>
      <h2>...</h2>
    </div>
  );
}
