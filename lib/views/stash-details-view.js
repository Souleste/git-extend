'use babel';

import * as git from './../git.js';
import { clean as cleanTemplate } from './../clean-template-literal';

export default class StashDetailsView {

    constructor() {}

    activate(stash) {
        if (stash) {
            const template = `
                <header class="gitExtend-stashDetailsModal--header">
                    <h4>Stash Details <i><code class="text-info">stash@{${stash.index}} ${stash.commit}</code></i></h4>
                </header>
                <br>
                <div class="gitExtend-stashDetailsModal--author-wrapper">
                    <span class="icon icon-person"></span>
                    <span class="gitExtend-stashDetailsModal--author-text">${stash.author.name} ${cleanTemplate(stash.author.email)}</span>
                </div>
                <br>
                <div class="gitExtend-stashDetailsModal--message-wrapper">
                    <p class="gitExtend-stashDetailsModal--message-message">${cleanTemplate(stash.message)}</p>
                </div>
                <div class="gitExtend-stashDetailsModal--files-list--loader loading-spinner-small" hidden></div>
                <div class="gitExtend-stashDetailsModal--files-wrapper" hidden>
                    <label class="gitExtend-stashDetailsModal--files-label">Files: </label>
                    <ul class="gitExtend-stashDetailsModal--files-list list-unstyled inset-panel"></ul>
                </div>
                <br>
                <footer class="gitExtend-stashDetailsModal--footer">
                    <button class="gitExtend-stashDetailsModal--apply btn btn-primary" title="Apply stashed changes" disabled>Apply <span class="gitExtend-stashDetailsModal--apply--loader loading-spinner-tiny" hidden></span></button>
                    <button class="gitExtend-stashDetailsModal--drop btn btn-error" title="Delete stash" disabled>Delete <span class="gitExtend-stashDetailsModal--drop--loader loading-spinner-tiny" hidden></span></button>
                    <button class="gitExtend-stashDetailsModal--cancel btn btn-default" title="Cancel">Cancel</button>
                </footer>
            `;
            var modal = document.createElement('div');
                modal.classList = 'gitExtend-stashDetailsModal--modal gitExtend-modal';
                modal.innerHTML = template;

            var cancel = modal.querySelector('.gitExtend-stashDetailsModal--cancel');
            var apply = modal.querySelector('.gitExtend-stashDetailsModal--apply');
            var drop = modal.querySelector('.gitExtend-stashDetailsModal--drop');

            cancel.addEventListener('click', (e) => {
                this.destroy();
            });

            apply.addEventListener('click', (e) => {
                var loader = apply.querySelector('.gitExtend-stashDetailsModal--apply--loader');
                    loader.hidden = false;

                cancel.disabled = true;
                drop.disabled = true;

                git.stash('apply', {
                    index: stash.index
                }).then((response) => {
                    setTimeout(() => {
                        this.destroy();
                        if (response.success) {
                            atom.notifications.addSuccess(`<i>stash@{${stash.index}} ${stash.commit}</i> has been applied.`, {
                                dismissable: true
                            });
                        } else {
                            atom.notifications.addError(`Attempt to apply <i>stash@{${stash.index}} ${stash.commit}</i> failed.\n${response.stderr}`, {
                                dismissable: true
                            });
                        }
                    }, 500);
                });
            });

            drop.addEventListener('click', (e) => {
                var loader = drop.querySelector('.gitExtend-stashDetailsModal--drop--loader');
                    loader.hidden = false;

                cancel.disabled = true;
                drop.disabled = true;

                git.stash('drop', {
                    index: stash.index
                }).then((response) => {
                    setTimeout(() => {
                        this.destroy();
                        if (response.success) {
                            atom.notifications.addSuccess(`<i>stash@{${stash.index}} ${stash.commit}<i> has been deleted.`, {
                                dismissable: true
                            });
                        } else {
                            atom.notifications.addError(`Attempt to delete <i>stash@{${stash.index}} ${stash.commit}</i> failed.\n${response.stderr}`, {
                                dismissable: true
                            });
                        }
                    }, 500);
                });
            });

            git.stash('show', {
                index: stash.index
            }).then((response) => {
                var loader = modal.querySelector('.gitExtend-stashDetailsModal--files-list--loader');
                    loader.hidden = false;
                var fileListWrapper = modal.querySelector('.gitExtend-stashDetailsModal--files-wrapper');
                var fileList = modal.querySelector('.gitExtend-stashDetailsModal--files-list');

                if (response.success) {
                    var files = response.files;
                    if (files.length) {
                        files.forEach((path) => {
                            var fileItem = document.createElement('li');
                                fileItem.classList.add('gitExtend-stashDetailsModal--files-list--item');
                                fileItem.innerHTML = `<span class="gitExtend-stashListModal--files-list--item-name">${path}</span>`;

                            fileList.appendChild(fileItem);
                        });
                    }
                } else {
                    this.destroy();
                    atom.notifications.addError(`Attempt to get stashed changes for <i>stash@{${stash.index}} ${stash.commit}</i> failed.\n${response.stderr}`, {
                        dismissable: true
                    });
                }

                setTimeout(() => {
                    loader.hidden = true;
                    fileListWrapper.hidden = false;

                    apply.disabled = false;
                    drop.disabled = false;
                }, 500);
            });

            this.modal = atom.workspace.addModalPanel({
                item: modal,
                visible: false,
                autoFocus: true
            });
            this.modal.show();
        }
    }

    destroy() {
        this.modal.destroy();
    }

}
