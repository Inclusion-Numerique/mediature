'use client';

import { DevTool } from '@hookform/devtools';
import { zodResolver } from '@hookform/resolvers/zod';
import SaveIcon from '@mui/icons-material/Save';
import { Button, MenuItem, Select, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { trpc } from '@mediature/main/client/trpcClient';
import { CreateAuthorityPrefillSchemaType, CreateAuthoritySchema, CreateAuthoritySchemaType } from '@mediature/main/models/actions/authority';
import { AuthorityTypeSchema } from '@mediature/main/models/entities/authority';

export function CreateAuthorityForm({ prefill }: { prefill?: CreateAuthorityPrefillSchemaType }) {
  const createAuthority = trpc.createAuthority.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CreateAuthoritySchemaType>({
    resolver: zodResolver(CreateAuthoritySchema),
    defaultValues: prefill,
  });

  const onSubmit = async (input: CreateAuthoritySchemaType) => {
    await createAuthority.mutateAsync(input);

    // TODO: success message? And/or redirect?
  };

  return (
    <>
      {/* <DevTool control={control} /> */}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* TODO: 2 columns, set logo on the right */}
        <input type="hidden" {...register('logoAttachmentId')} value="d58ac4a3-7672-403c-ad04-112f5927e2be"></input>
        <TextField
          select
          label="Type de collectivité"
          defaultValue={control._defaultValues.type || ''}
          inputProps={register('type')}
          error={!!errors.type}
          helperText={errors.type?.message}
          fullWidth
        >
          {Object.keys(AuthorityTypeSchema.Values).map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem> // TODO: should use i18n for proper display (instead of hard values)
          ))}
        </TextField>
        <TextField type="name" label="Nom" {...register('name')} error={!!errors.name} helperText={errors?.name?.message} fullWidth />
        <TextField
          type="slug"
          label="Identifiant technique (slug)"
          {...register('slug')}
          error={!!errors.slug}
          helperText={errors?.slug?.message}
          fullWidth
        />
        <Button type="submit" size="large" sx={{ mt: 3 }} variant="contained" startIcon={<SaveIcon />} fullWidth>
          Sauvegarder
        </Button>
      </form>
    </>
  );
}