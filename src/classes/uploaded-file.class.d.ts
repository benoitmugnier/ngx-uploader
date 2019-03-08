export declare class UploadedFile {
    xhr: XMLHttpRequest | undefined;
    id: string;
    status: number;
    statusText: string;
    progress: Object;
    originalName: string;
    size: number;
    response: string;
    done: boolean;
    error: boolean;
    abort: boolean;
    startTime: number;
    endTime: number;
    speedAverage: number;
    speedAverageHumanized: string | null;
    constructor(id: string, originalName: string, size: number, xhr?: XMLHttpRequest);
    abortUpload(): void;
    setProgress(progress: Object): void;
    setError(): void;
    setAbort(): void;
    onFinished(status: number, statusText: string, response: string): void;
    humanizeBytes(bytes: number): string;
}
