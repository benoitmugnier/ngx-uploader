import { Directive, ElementRef, EventEmitter, Input, Output, HostListener, Inject } from '@angular/core';
import { NgUploaderService } from '../services/ngx-uploader';
import { NgUploaderOptions, UploadRejected } from '../classes/index';
var NgFileDropDirective = (function () {
    function NgFileDropDirective(el, uploader) {
        this.el = el;
        this.uploader = uploader;
        this.onUpload = new EventEmitter();
        this.onPreviewData = new EventEmitter();
        this.onFileOver = new EventEmitter();
        this.onUploadRejected = new EventEmitter();
        this.beforeUpload = new EventEmitter();
        this.files = [];
    }
    NgFileDropDirective.prototype.ngOnInit = function () {
        var _this = this;
        this.uploader._emitter.subscribe(function (data) {
            _this.onUpload.emit(data);
            if (data.done && _this.files && _this.files.length) {
                _this.files = [].filter.call(_this.files, function (f) { return f.name !== data.originalName; });
            }
        });
        this.uploader._previewEmitter.subscribe(function (data) {
            _this.onPreviewData.emit(data);
        });
        this.uploader._beforeEmitter.subscribe(function (uploadingFile) {
            _this.beforeUpload.emit(uploadingFile);
        });
        setTimeout(function () {
            if (_this.events instanceof EventEmitter) {
                _this.events.subscribe(function (data) {
                    if (data === 'startUpload') {
                        _this.uploader.uploadFilesInQueue();
                    }
                });
            }
        });
        this.initEvents();
    };
    NgFileDropDirective.prototype.ngOnChanges = function (changes) {
        if (!this.options || !changes) {
            return;
        }
        if (this.options.allowedExtensions) {
            this.options.allowedExtensions = this.options.allowedExtensions.map(function (ext) { return ext.toLowerCase(); });
        }
        this.options = new NgUploaderOptions(this.options);
        this.uploader.setOptions(this.options);
    };
    NgFileDropDirective.prototype.initEvents = function () {
        if (typeof this.el.nativeElement.addEventListener === 'undefined') {
            return;
        }
        this.el.nativeElement.addEventListener('drop', this.stopEvent, false);
        this.el.nativeElement.addEventListener('dragenter', this.stopEvent, false);
        this.el.nativeElement.addEventListener('dragover', this.stopEvent, false);
    };
    NgFileDropDirective.prototype.onDrop = function (e) {
        var _this = this;
        this.onFileOver.emit(false);
        this.files = Array.from(e.dataTransfer.files);
        if (!this.files || !this.files.length) {
            return;
        }
        if (this.options.filterExtensions && this.options.allowedExtensions && this.files && this.files.length) {
            this.files = [].filter.call(this.files, function (f) {
                var allowedExtensions = _this.options.allowedExtensions || [];
                if (allowedExtensions.indexOf(f.type.toLowerCase()) !== -1) {
                    return true;
                }
                var ext = f.name.split('.').pop();
                if (ext && allowedExtensions.indexOf(ext.toLowerCase()) !== -1) {
                    return true;
                }
                _this.onUploadRejected.emit({ file: f, reason: UploadRejected.EXTENSION_NOT_ALLOWED });
                return false;
            });
        }
        var maxSize = typeof this.options.maxSize !== 'undefined' ? this.options.maxSize : null;
        if (maxSize !== null && maxSize > 0) {
            this.files = [].filter.call(this.files, function (f) {
                if (maxSize) {
                    if (f.size <= maxSize) {
                        return true;
                    }
                }
                _this.onUploadRejected.emit({ file: f, reason: UploadRejected.MAX_SIZE_EXCEEDED });
                return false;
            });
        }
        var maxUploads = typeof this.options.maxUploads !== 'undefined' ? this.options.maxUploads : null;
        if (maxUploads !== null && (maxUploads > 0 && this.files.length > maxUploads)) {
            this.onUploadRejected.emit({ file: this.files.pop(), reason: UploadRejected.MAX_UPLOADS_EXCEEDED });
            this.files = [];
        }
        if (this.files && this.files.length) {
            this.uploader.addFilesToQueue(this.files);
        }
    };
    NgFileDropDirective.prototype.onDragOver = function (e) {
        if (!e) {
            return;
        }
        this.onFileOver.emit(true);
    };
    NgFileDropDirective.prototype.onDragLeave = function (e) {
        if (!e) {
            return;
        }
        this.onFileOver.emit(false);
    };
    NgFileDropDirective.prototype.stopEvent = function (e) {
        e.stopPropagation();
        e.preventDefault();
    };
    return NgFileDropDirective;
}());
export { NgFileDropDirective };
NgFileDropDirective.decorators = [
    { type: Directive, args: [{
                selector: '[ngFileDrop]',
                providers: [
                    NgUploaderService
                ]
            },] },
];
/** @nocollapse */
NgFileDropDirective.ctorParameters = function () { return [
    { type: ElementRef, decorators: [{ type: Inject, args: [ElementRef,] },] },
    { type: NgUploaderService, decorators: [{ type: Inject, args: [NgUploaderService,] },] },
]; };
NgFileDropDirective.propDecorators = {
    'options': [{ type: Input },],
    'events': [{ type: Input },],
    'onUpload': [{ type: Output },],
    'onPreviewData': [{ type: Output },],
    'onFileOver': [{ type: Output },],
    'onUploadRejected': [{ type: Output },],
    'beforeUpload': [{ type: Output },],
    'onDrop': [{ type: HostListener, args: ['drop', ['$event'],] },],
    'onDragOver': [{ type: HostListener, args: ['dragover', ['$event'],] },],
    'onDragLeave': [{ type: HostListener, args: ['dragleave', ['$event'],] },],
};
//# sourceMappingURL=ng-file-drop.js.map