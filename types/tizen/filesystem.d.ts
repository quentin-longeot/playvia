declare namespace tizen {
  namespace filesystem {
    type StorageState = 'MOUNTED' | 'UNMOUNTED' | 'REMOVED';
    type StorageType = 'INTERNAL' | 'EXTERNAL' | 'INTERNAL_USB';

    interface Storage {
      label: string;
      type: StorageType;
      state: StorageState;
    }

    interface File {
      parent: File | null;
      readOnly: boolean;
      isFile: boolean;
      isDirectory: boolean;
      created: Date;
      modified: Date;
      path: string;
      name: string;
      fullPath: string;
      fileSize: number;
      length: number;
      toURI(): string;
      listFiles(
        successCallback: (files: File[]) => void,
        errorCallback?: (error: Error) => void
      ): void;
      openStream(
        mode: 'r' | 'w' | 'rw' | 'a',
        successCallback: (stream: FileStream) => void,
        errorCallback?: (error: Error) => void,
        encoding?: string
      ): void;
      readAsText(
        successCallback: (text: string) => void,
        errorCallback?: (error: Error) => void,
        encoding?: string
      ): void;
      copyTo(
        destinationPath: string,
        overwrite: boolean,
        successCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;
      moveTo(
        destinationPath: string,
        overwrite: boolean,
        successCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;
      createDirectory(dirPath: string): File;
      createFile(filePath: string): File;
      resolve(filePath: string): File;
      deleteDirectory(
        directoryPath: string,
        recursive: boolean,
        successCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;
      deleteFile(
        filePath: string,
        successCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;
    }

    interface FileStream {
      eof: boolean;
      position: number;
      bytesAvailable: number;
      close(): void;
      read(charCount: number): string;
      readBytes(byteCount: number): number[];
      readBase64(byteCount: number): string;
      write(stringData: string): void;
      writeBytes(byteData: number[]): void;
      writeBase64(base64Data: string): void;
    }

    function listStorages(
      successCallback: (storages: Storage[]) => void,
      errorCallback?: (error: Error) => void
    ): void;

    function resolve(
      location: string,
      successCallback: (file: File) => void,
      errorCallback?: (error: Error) => void,
      mode?: 'r' | 'w' | 'rw' | 'a'
    ): void;

    function getStorage(
      label: string,
      successCallback: (storage: Storage) => void,
      errorCallback?: (error: Error) => void
    ): void;
  }
}
