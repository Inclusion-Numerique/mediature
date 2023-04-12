import List from '@mui/material/List';
import { UppyFile } from '@uppy/core';

import { FileListItem } from '@mediature/main/src/components/FileListItem';
import { UiAttachmentSchemaType } from '@mediature/main/src/models/entities/attachment';

export interface FileListProps {
  files: UiAttachmentSchemaType[];
  onRemove: (file: UiAttachmentSchemaType) => Promise<void>;
  readonly?: boolean;
}

export function FileList(props: FileListProps) {
  return (
    <>
      <List dense={true}>
        {props.files.map((file) => {
          const remove = async () => {
            await props.onRemove(file);
          };

          return <FileListItem key={file.id} file={file} onRemove={remove} readonly={props.readonly} />;
        })}
      </List>
    </>
  );
}
