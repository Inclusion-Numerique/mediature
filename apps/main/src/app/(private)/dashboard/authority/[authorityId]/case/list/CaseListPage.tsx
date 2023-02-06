'use client';

import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, IconButton, InputAdornment, Link, TextField, Typography } from '@mui/material';
import debounce from 'lodash.debounce';
import NextLink from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { trpc } from '@mediature/main/src/client/trpcClient';
import { centeredAlertContainerGridProps, centeredContainerGridProps, ulComponentResetStyles } from '@mediature/main/src/utils/grid';
import { linkRegistry } from '@mediature/main/src/utils/routes/registry';
import { CaseCard } from '@mediature/ui/src/CaseCard';
import { ErrorAlert } from '@mediature/ui/src/ErrorAlert';
import { LoadingArea } from '@mediature/ui/src/LoadingArea';

export interface CaseListPageProps {
  params: { authorityId: string };
}

export function CaseListPage({ params: { authorityId } }: CaseListPageProps) {
  const queryRef = React.createRef<HTMLInputElement>();
  const [searchQueryManipulated, setSearchQueryManipulated] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const { data, error, isInitialLoading, isLoading, refetch } = trpc.listCases.useQuery({
    orderBy: {},
    filterBy: {
      authorityIds: [authorityId],
      query: searchQuery,
    },
  });

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQueryManipulated(true);
    setSearchQuery(event.target.value);
  };

  const debounedHandleClearQuery = useMemo(() => debounce(handleSearchQueryChange, 500), []);
  useEffect(() => {
    return () => {
      debounedHandleClearQuery.cancel();
    };
  }, [debounedHandleClearQuery]);

  const casesWrappers = data?.casesWrappers || [];
  const openCasesWrappers = casesWrappers.filter((caseWrapper) => {
    return !caseWrapper.case.closedAt;
  });
  const closeCasesWrappers = casesWrappers.filter((caseWrapper) => {
    return !!caseWrapper.case.closedAt;
  });

  if (error) {
    return (
      <Grid container {...centeredAlertContainerGridProps}>
        <ErrorAlert errors={[error]} refetchs={[refetch]} />
      </Grid>
    );
  } else if (isInitialLoading && !searchQueryManipulated) {
    return <LoadingArea ariaLabelTarget="page" />;
  }

  const handleClearQuery = () => {
    setSearchQuery(null);

    // We did not bind the TextField to "searchQuery" to allow delaying requests
    if (queryRef.current) {
      queryRef.current.value = '';
    }
  };

  return (
    <>
      <Grid container {...centeredContainerGridProps}>
        <Grid item xs={12} sx={{ pb: 3 }}>
          <Typography component="h1" variant="h5">
            {/* TODO: manage multiple ones when main agent */}
            Mes dossiers
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ mb: 3 }}>
          <TextField
            type="text"
            name="search"
            label="Rechercher..."
            inputRef={queryRef}
            onChange={debounedHandleClearQuery}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery && searchQuery !== '' && (
                    <IconButton aria-label="effacer la recherche" onClick={handleClearQuery}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        {!isLoading ? (
          <>
            <Grid item xs={12} sx={{ py: 3 }}>
              <Typography component="h2" variant="h6">
                Dossiers ouverts
              </Typography>
            </Grid>
            <Grid container component="ul" spacing={3} sx={ulComponentResetStyles}>
              {openCasesWrappers.map((caseWrapper) => (
                <Grid key={caseWrapper.case.id} item component="li" xs={12} sm={6}>
                  <Link
                    component={NextLink}
                    href={linkRegistry.get('case', { authorityId: authorityId, caseId: caseWrapper.case.id })}
                    variant="subtitle2"
                    underline="none"
                  >
                    <CaseCard
                      case={caseWrapper.case}
                      citizen={caseWrapper.citizen}
                      assignAction={async (agentId: string) => {
                        // TODO: bind to API
                      }}
                    />
                  </Link>
                </Grid>
              ))}
            </Grid>
            <Grid item xs={12} sx={{ py: 3 }}>
              <Typography component="h2" variant="h6">
                Dossiers clôturés
              </Typography>
            </Grid>
            <Grid container component="ul" spacing={3} sx={ulComponentResetStyles}>
              {closeCasesWrappers.map((caseWrapper) => (
                <Grid key={caseWrapper.case.id} item component="li" xs={12} sm={6}>
                  <CaseCard
                    case={caseWrapper.case}
                    citizen={caseWrapper.citizen}
                    assignAction={async (agentId: string) => {
                      // TODO: bind to API
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <LoadingArea ariaLabelTarget="liste des dossiers" />
        )}
      </Grid>
    </>
  );
}
