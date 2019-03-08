import { ElementRef, EventEmitter, OnChanges, OnInit, SimpleChange } from '@angular/core';
import { NgUploaderService } from '../services/ngx-uploader';
import { NgUploaderOptions, UploadedFile, UploadRejected } from '../classes/index';
export declare class NgFileDropDirective implements OnChanges, OnInit {
    el: ElementRef;
    uploader: NgUploaderService;
    options: NgUploaderOptions;
    events: EventEmitter<any>;
    onUpload: EventEmitter<any>;
    onPreviewData: EventEmitter<any>;
    onFileOver: EventEmitter<any>;
    onUploadRejected: EventEmitter<UploadRejected>;
    beforeUpload: EventEmitter<UploadedFile>;
    files: File[];
    constructor(el: ElementRef, uploader: NgUploaderService);
    ngOnInit(): void;
    ngOnChanges(changes: {
        [propName: string]: SimpleChange;
    }): void;
    initEvents(): void;
    onDrop(e: Event | any): void;
    onDragOver(e: any): void;
    onDragLeave(e: any): void;
    private stopEvent(e);
}
