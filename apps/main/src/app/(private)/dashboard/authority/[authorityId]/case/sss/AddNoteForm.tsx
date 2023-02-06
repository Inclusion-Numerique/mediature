'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Grid, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useForm } from 'react-hook-form';

import { trpc } from '@mediature/main/src/client/trpcClient';
import { BaseForm } from '@mediature/main/src/components/BaseForm';
import { AddNoteToCasePrefillSchemaType, AddNoteToCaseSchema, AddNoteToCaseSchemaType } from '@mediature/main/src/models/actions/case';
import { EditorWrapper } from '@mediature/ui/src/Editor/EditorWrapper';

export interface AddNoteFormProps {
  prefill?: AddNoteToCasePrefillSchemaType;
  onSuccess?: () => void;
}

export function AddNoteForm(props: AddNoteFormProps) {
  const addNoteToCase = trpc.addNoteToCase.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<AddNoteToCaseSchemaType>({
    resolver: zodResolver(AddNoteToCaseSchema),
    defaultValues: {
      date: new Date(),
      ...props.prefill,
    },
  });

  const onSubmit = async (input: AddNoteToCaseSchemaType) => {
    await addNoteToCase.mutateAsync(input);

    if (props.onSuccess) {
      props.onSuccess();
    }
  };

  return (
    <BaseForm handleSubmit={handleSubmit} onSubmit={onSubmit} preventParentFormTrigger control={control} ariaLabel="ajouter une note au dossier">
      <Grid item xs={12} sm={6} md={4}>
        <DateTimePicker
          label="Date de la note"
          value={watch('date') || null}
          onChange={(newDate) => {
            setValue('date', newDate || new Date());
          }}
          renderInput={(params) => <TextField {...params} error={!!errors.date} helperText={errors?.date?.message} fullWidth />}
        />
      </Grid>
      <Grid item xs={12}>
        <EditorWrapper
          initialEditorState={control._defaultValues.content}
          onChange={(content: string) => {
            setValue('content', content, {
              shouldValidate: false,
            });
          }}
          error={errors?.content?.message}
        />
      </Grid>
      <Grid item xs={12}>
        <Button type="submit" size="large" variant="contained" fullWidth>
          Ajouter cette note
        </Button>
      </Grid>
    </BaseForm>
  );
}
