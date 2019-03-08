import { NgModule } from '@angular/core';
import { NgFileDropDirective } from './../directives/ng-file-drop';
import { NgFileSelectDirective } from './../directives/ng-file-select';
var NgUploaderModule = (function () {
    function NgUploaderModule() {
    }
    return NgUploaderModule;
}());
export { NgUploaderModule };
NgUploaderModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    NgFileDropDirective,
                    NgFileSelectDirective
                ],
                exports: [
                    NgFileDropDirective,
                    NgFileSelectDirective
                ]
            },] },
];
/** @nocollapse */
NgUploaderModule.ctorParameters = function () { return []; };
//# sourceMappingURL=ngx-uploader.module.js.map