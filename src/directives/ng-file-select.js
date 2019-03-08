import { Directive, ElementRef, EventEmitter, Input, Output, HostListener, Inject } from '@angular/core';
import { NgUploaderService } from '../services/ngx-uploader';
import { NgUploaderOptions, UploadRejected } from '../classes/index';
var NgFileSelectDirective = (function () {
    function NgFileSelectDirective(el, uploader) {
        this.el = el;
        this.uploader = uploader;
        this.onUpload = new EventEmitter();
        this.onPreviewData = new EventEmitter();
        this.onUploadRejected = new EventEmitter();
        this.beforeUpload = new EventEmitter();
        this.files = [];
    }
    NgFileSelectDirective.prototype.ngOnChanges = function (changes) {
        var _this = this;
        if (!this.options || !changes) {
            return;
        }
        if (this.options.allowedExtensions) {
            this.options.allowedExtensions = this.options.allowedExtensions.map(function (ext) { return ext.toLowerCase(); });
        }
        this.uploader.setOptions(new NgUploaderOptions(this.options));
        this.uploader._emitter.subscribe(function (data) {
            _this.onUpload.emit(data);
            if (data.done && _this.files && _this.files.length) {
                _this.files = [].filter.call(_this.files, function (f) { return f.name !== data.originalName; });
            }
            if (data.done && _this.uploader.opts.fieldReset) {
                _this.el.nativeElement.value = '';
            }
        });
        this.uploader._previewEmitter.subscribe(function (data) {
            _this.onPreviewData.emit(data);
        });
        this.uploader._beforeEmitter.subscribe(function (uploadingFile) {
            _this.beforeUpload.emit(uploadingFile);
        });
        if (this.events instanceof EventEmitter) {
            this.events.subscribe(function (data) {
                if (data === 'startUpload') {
                    _this.uploader.uploadFilesInQueue();
                }
            });
        }
    };
    NgFileSelectDirective.prototype.onChange = function () {
        var _this = this;
        this.files = this.el.nativeElement.files;
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
    return NgFileSelectDirective;
}());
export { NgFileSelectDirective };
NgFileSelectDirective.decorators = [
    { type: Directive, args: [{
                selector: '[ngFileSelect]',
                providers: [
                    NgUploaderService
                ],
            },] },
];
/** @nocollapse */
NgFileSelectDirective.ctorParameters = function () { return [
    { type: ElementRef, decorators: [{ type: Inject, args: [ElementRef,] },] },
    { type: NgUploaderService, decorators: [{ type: Inject, args: [NgUploaderService,] },] },
]; };
NgFileSelectDirective.propDecorators = {
    'options': [{ type: Input },],
    'events': [{ type: Input },],
    'onUpload': [{ type: Output },],
    'onPreviewData': [{ type: Output },],
    'onUploadRejected': [{ type: Output },],
    'beforeUpload': [{ type: Output },],
    'onChange': [{ type: HostListener, args: ['change',] },],
};
//# sourceMappingURL=ng-file-select.js.map