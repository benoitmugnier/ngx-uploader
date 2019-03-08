import { EventEmitter, Injectable } from '@angular/core';
import { UploadedFile } from '../classes/uploaded-file.class';
var NgUploaderService = (function () {
    function NgUploaderService() {
        this._queue = [];
        this._emitter = new EventEmitter();
        this._previewEmitter = new EventEmitter();
        this._beforeEmitter = new EventEmitter();
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
    ;
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
export { NgUploaderService };
NgUploaderService.decorators = [
    { type: Injectable },
];
/** @nocollapse */
NgUploaderService.ctorParameters = function () { return []; };
export var NgUploaderServiceProvider = {
    provide: NgUploaderService, useClass: NgUploaderService
};
//# sourceMappingURL=ngx-uploader.js.map