'use client';

import { useCallback, useState } from 'react';
import { Upload, X, File as FileIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, validateFile, storageName } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  existingUrls?: string[];
  onRemoveExisting?: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept,
  multiple = false,
  maxSizeMB = 10,
  onFilesSelected,
  existingUrls = [],
  onRemoveExisting,
  disabled,
  className,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    (files: File[]) => {
      setError(null);
      const valid: File[] = [];

      for (const file of files) {
        const result = validateFile(file, { maxSizeMB });
        if (!result.valid) {
          setError(result.error ?? 'Invalid file');
          return;
        }
        valid.push(file);
      }

      const next = multiple ? [...pendingFiles, ...valid] : valid.slice(0, 1);
      setPendingFiles(next);
      onFilesSelected(next);
    },
    [maxSizeMB, multiple, onFilesSelected, pendingFiles],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeLocal = (idx: number) => {
    const next = pendingFiles.filter((_, i) => i !== idx);
    setPendingFiles(next);
    onFilesSelected(next);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/60',
          disabled && 'pointer-events-none opacity-50',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Max {maxSizeMB} MB{accept ? ` · ${accept}` : ''}
        </p>
        <input
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={handleInput}
          disabled={disabled}
        />
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Existing file list */}
      {existingUrls.length > 0 && (
        <ul className="space-y-1">
          {existingUrls.map((url) => (
            <li key={url} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
              <span className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {storageName(url)}
              </span>
              {onRemoveExisting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveExisting(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* New pending files */}
      {pendingFiles.length > 0 && (
        <ul className="space-y-1">
          {pendingFiles.map((file, idx) => (
            <li key={idx} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
              <span className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                {file.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeLocal(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
