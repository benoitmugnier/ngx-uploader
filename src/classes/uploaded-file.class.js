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
export { UploadedFile };
//# sourceMappingURL=uploaded-file.class.js.map