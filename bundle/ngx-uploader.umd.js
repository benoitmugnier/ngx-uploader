(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core'], factory) :
	(factory((global['ngx-uploader'] = global['ngx-uploader'] || {}),global.vendor._angular_core));
}(this, (function (exports,_angular_core) { 'use strict';

var UploadedFile = (function () {
    function UploadedFile(id, originalName, size, xhr) {
        this.xhr = xhr;
        this.id = id;
        this.originalName = originalName;
        this.size = size;
        this.progress = {
            loaded: 0,
            total: 0,
            percent: 0,
            speed: 0,
            speedHumanized: null
        };
        this.done = false;
        this.error = false;
        this.abort = false;
        this.startTime = new Date().getTime();
        this.endTime = 0;
        this.speedAverage = 0;
        this.speedAverageHumanized = null;
    }
    UploadedFile.prototype.abortUpload = function () {
        if (this.xhr) {
            this.xhr.abort();
        }
    };
    UploadedFile.prototype.setProgress = function (progress) {
        this.progress = progress;
    };
    UploadedFile.prototype.setError = function () {
        this.error = true;
        this.done = true;
    };
    UploadedFile.prototype.setAbort = function () {
        this.abort = true;
        this.done = true;
    };
    UploadedFile.prototype.onFinished = function (status, statusText, response) {
        this.endTime = new Date().getTime();
        this.speedAverage = this.size / (this.endTime - this.startTime) * 1000;
        this.speedAverage = parseInt(this.speedAverage, 10);
        this.speedAverageHumanized = this.humanizeBytes(this.speedAverage);
        this.status = status;
        this.statusText = statusText;
        this.response = response;
        this.done = true;
    };
    UploadedFile.prototype.humanizeBytes = function (bytes) {
        if (bytes === 0) {
            return '0 Byte';
        }
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i] + '/s';
    };
    return UploadedFile;
}());

var NgUploaderService = (function () {
    function NgUploaderService() {
        this._queue = [];
        this._emitter = new _angular_core.EventEmitter();
        this._previewEmitter = new _angular_core.EventEmitter();
        this._beforeEmitter = new _angular_core.EventEmitter();
    }
    NgUploaderService.prototype.setOptions = function (opts) {
        this.opts = opts;
    };
    NgUploaderService.prototype.uploadFilesInQueue = function () {
        var _this = this;
        this._queue.forEach(function (file) {
            if (file.uploading) {
                return;
            }
            _this.uploadFile(file);
        });
    };
    
    NgUploaderService.prototype.uploadFile = function (file) {
        var _this = this;
        var xhr = new XMLHttpRequest();
        var payload;
        if (this.opts.plainJson) {
            payload = JSON.stringify(this.opts.data);
        }
        else if (this.opts.multipart) {
            var form_1 = new FormData();
            Object.keys(this.opts.data).forEach(function (k) {
                form_1.append(k, _this.opts.data[k]);
            });
            form_1.append(this.opts.fieldName ? this.opts.fieldName : '', file, file.name);
            payload = form_1;
        }
        else {
            payload = file;
        }
        var uploadingFile = new UploadedFile(this.generateRandomIndex(), file.name, file.size, xhr);
        var queueIndex = this._queue.indexOf(file);
        var time = new Date().getTime();
        var load = 0;
        var speed = 0;
        var speedHumanized = null;
        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                if (_this.opts.calculateSpeed) {
                    var diff = new Date().getTime() - time;
                    time += diff;
                    load = e.loaded - load;
                    speed = load / diff * 1000;
                    speed = parseInt(speed, 10);
                    speedHumanized = _this.humanizeBytes(speed);
                }
                var percent = Math.round(e.loaded / e.total * 100);
                if (speed === 0) {
                    uploadingFile.setProgress({
                        total: e.total,
                        loaded: e.loaded,
                        percent: percent
                    });
                }
                else {
                    uploadingFile.setProgress({
                        total: e.total,
                        loaded: e.loaded,
                        percent: percent,
                        speed: speed,
                        speedHumanized: speedHumanized
                    });
                }
                _this._emitter.emit(uploadingFile);
            }
        };
        xhr.upload.onabort = function () {
            uploadingFile.setAbort();
            _this._emitter.emit(uploadingFile);
        };
        xhr.upload.onerror = function () {
            uploadingFile.setError();
            _this._emitter.emit(uploadingFile);
        };
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                uploadingFile.onFinished(xhr.status, xhr.statusText, xhr.response);
                _this.removeFileFromQueue(queueIndex);
                _this._emitter.emit(uploadingFile);
            }
        };
        xhr.open(this.opts.method, this.opts.url, true);
        xhr.withCredentials = this.opts.withCredentials;
        if (this.opts.filenameHeader) {
            xhr.setRequestHeader(this.opts.filenameHeader, file.name);
        }
        if (this.opts.customHeaders) {
            Object.keys(this.opts.customHeaders).forEach(function (key) {
                xhr.setRequestHeader(key, _this.opts.customHeaders[key]);
            });
        }
        if (this.opts.authToken) {
            xhr.setRequestHeader('Authorization', this.opts.authTokenPrefix + " " + this.opts.authToken);
        }
        this._beforeEmitter.emit(uploadingFile);
        if (!uploadingFile.abort) {
            xhr.send(payload);
        }
        else {
            this.removeFileFromQueue(queueIndex);
        }
    };
    NgUploaderService.prototype.addFilesToQueue = function (files) {
        var _this = this;
        this.clearQueue();
        [].forEach.call(files, function (file) {
            if (!_this.inQueue(file)) {
                _this._queue.push(file);
            }
        });
        if (this.opts.previewUrl) {
            [].forEach.call(files, function (file) { return _this.createFileUrl(file); });
        }
        if (this.opts.autoUpload) {
            this.uploadFilesInQueue();
        }
    };
    NgUploaderService.prototype.createFileUrl = function (file) {
        var _this = this;
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            _this._previewEmitter.emit(reader.result);
        });
        reader.readAsDataURL(file);
    };
    NgUploaderService.prototype.removeFileFromQueue = function (i) {
        this._queue.splice(i, 1);
    };
    NgUploaderService.prototype.clearQueue = function () {
        this._queue = [];
    };
    NgUploaderService.prototype.getQueueSize = function () {
        return this._queue.length;
    };
    NgUploaderService.prototype.inQueue = function (file) {
        var fileInQueue = this._queue.filter(function (f) { return f === file; });
        return fileInQueue.length ? true : false;
    };
    NgUploaderService.prototype.generateRandomIndex = function () {
        return Math.random().toString(36).substring(7);
    };
    NgUploaderService.prototype.humanizeBytes = function (bytes) {
        if (bytes === 0) {
            return '0 Byte';
        }
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i] + '/s';
    };
    return NgUploaderService;
}());
NgUploaderService.decorators = [
    { type: _angular_core.Injectable } ];
/** @nocollapse */
NgUploaderService.ctorParameters = function () { return []; };
var NgUploaderServiceProvider = {
    provide: NgUploaderService, useClass: NgUploaderService
};

var NgUploaderOptions = (function () {
    function NgUploaderOptions(obj) {
        function use(source, defaultValue) {
            return obj && source !== undefined ? source : defaultValue;
        }
        this.url = use(obj.url, '');
        this.cors = use(obj.cors, true);
        this.withCredentials = use(obj.withCredentials, false);
        this.multiple = use(obj.multiple, true);
        this.maxUploads = use(obj.maxUploads, 10);
        this.data = use(obj.data, {});
        this.autoUpload = use(obj.autoUpload, true);
        this.multipart = use(obj.multipart, true);
        this.method = use(obj.method, 'POST');
        this.customHeaders = use(obj.customHeaders, {});
        this.encodeHeaders = use(obj.encodeHeaders, false);
        this.filenameHeader = use(obj.filenameHeader, undefined);
        this.authTokenPrefix = use(obj.authTokenPrefix, 'Bearer');
        this.authToken = use(obj.authToken, undefined);
        this.fieldName = use(obj.fieldName, 'file');
        this.fieldReset = use(obj.fieldReset, true);
        this.previewUrl = use(obj.previewUrl, false);
        this.calculateSpeed = use(obj.calculateSpeed, true);
        this.filterExtensions = use(obj.filterExtensions, false);
        this.allowedExtensions = use(obj.allowedExtensions, []);
        this.maxSize = use(obj.maxSize, undefined);
        this.plainJson = use(obj.plainJson, false);
    }
    return NgUploaderOptions;
}());

var UploadRejected = (function () {
    function UploadRejected() {
    }
    Object.defineProperty(UploadRejected, "EXTENSION_NOT_ALLOWED", {
        get: function () { return 'ExtensionNotAllowed'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UploadRejected, "MAX_SIZE_EXCEEDED", {
        get: function () { return 'MaxSizeExceeded'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UploadRejected, "MAX_UPLOADS_EXCEEDED", {
        get: function () { return 'MaxUploadsExceeded'; },
        enumerable: true,
        configurable: true
    });
    return UploadRejected;
}());

var NgFileDropDirective = (function () {
    function NgFileDropDirective(el, uploader) {
        this.el = el;
        this.uploader = uploader;
        this.onUpload = new _angular_core.EventEmitter();
        this.onPreviewData = new _angular_core.EventEmitter();
        this.onFileOver = new _angular_core.EventEmitter();
        this.onUploadRejected = new _angular_core.EventEmitter();
        this.beforeUpload = new _angular_core.EventEmitter();
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
            if (_this.events instanceof _angular_core.EventEmitter) {
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
NgFileDropDirective.decorators = [
    { type: _angular_core.Directive, args: [{
                selector: '[ngFileDrop]',
                providers: [
                    NgUploaderService
                ]
            } ] } ];
/** @nocollapse */
NgFileDropDirective.ctorParameters = function () { return [
    { type: _angular_core.ElementRef, decorators: [{ type: _angular_core.Inject, args: [_angular_core.ElementRef ] } ] },
    { type: NgUploaderService, decorators: [{ type: _angular_core.Inject, args: [NgUploaderService ] } ] } ]; };
NgFileDropDirective.propDecorators = {
    'options': [{ type: _angular_core.Input } ],
    'events': [{ type: _angular_core.Input } ],
    'onUpload': [{ type: _angular_core.Output } ],
    'onPreviewData': [{ type: _angular_core.Output } ],
    'onFileOver': [{ type: _angular_core.Output } ],
    'onUploadRejected': [{ type: _angular_core.Output } ],
    'beforeUpload': [{ type: _angular_core.Output } ],
    'onDrop': [{ type: _angular_core.HostListener, args: ['drop', ['$event'] ] } ],
    'onDragOver': [{ type: _angular_core.HostListener, args: ['dragover', ['$event'] ] } ],
    'onDragLeave': [{ type: _angular_core.HostListener, args: ['dragleave', ['$event'] ] } ],
};

var NgFileSelectDirective = (function () {
    function NgFileSelectDirective(el, uploader) {
        this.el = el;
        this.uploader = uploader;
        this.onUpload = new _angular_core.EventEmitter();
        this.onPreviewData = new _angular_core.EventEmitter();
        this.onUploadRejected = new _angular_core.EventEmitter();
        this.beforeUpload = new _angular_core.EventEmitter();
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
        if (this.events instanceof _angular_core.EventEmitter) {
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
NgFileSelectDirective.decorators = [
    { type: _angular_core.Directive, args: [{
                selector: '[ngFileSelect]',
                providers: [
                    NgUploaderService
                ],
            } ] } ];
/** @nocollapse */
NgFileSelectDirective.ctorParameters = function () { return [
    { type: _angular_core.ElementRef, decorators: [{ type: _angular_core.Inject, args: [_angular_core.ElementRef ] } ] },
    { type: NgUploaderService, decorators: [{ type: _angular_core.Inject, args: [NgUploaderService ] } ] } ]; };
NgFileSelectDirective.propDecorators = {
    'options': [{ type: _angular_core.Input } ],
    'events': [{ type: _angular_core.Input } ],
    'onUpload': [{ type: _angular_core.Output } ],
    'onPreviewData': [{ type: _angular_core.Output } ],
    'onUploadRejected': [{ type: _angular_core.Output } ],
    'beforeUpload': [{ type: _angular_core.Output } ],
    'onChange': [{ type: _angular_core.HostListener, args: ['change' ] } ],
};

var NgUploaderModule = (function () {
    function NgUploaderModule() {
    }
    return NgUploaderModule;
}());
NgUploaderModule.decorators = [
    { type: _angular_core.NgModule, args: [{
                declarations: [
                    NgFileDropDirective,
                    NgFileSelectDirective
                ],
                exports: [
                    NgFileDropDirective,
                    NgFileSelectDirective
                ]
            } ] } ];
/** @nocollapse */
NgUploaderModule.ctorParameters = function () { return []; };

var UPLOAD_DIRECTIVES = [
    NgFileSelectDirective,
    NgFileDropDirective
];

exports.UPLOAD_DIRECTIVES = UPLOAD_DIRECTIVES;
exports.NgUploaderOptions = NgUploaderOptions;
exports.UploadedFile = UploadedFile;
exports.UploadRejected = UploadRejected;
exports.NgUploaderModule = NgUploaderModule;
exports.NgFileDropDirective = NgFileDropDirective;
exports.NgFileSelectDirective = NgFileSelectDirective;
exports.NgUploaderService = NgUploaderService;
exports.NgUploaderServiceProvider = NgUploaderServiceProvider;

Object.defineProperty(exports, '__esModule', { value: true });

})));
