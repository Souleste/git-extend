'use babel';

import * as git from './../git.js';

export default class StashCommitView {

    constructor() {}

    activate() {
        const template = `
            <header class="gitExtend-stashCommitModal--header">
                <h4>Stash Changes</h4>
            </header>
            <br>
            <div class="gitExtend-stashCommitModal--message-wrapper">
                <label class="gitExtend-stashCommitModal--message-label" title="Enter stash commit message">Message (optional): </label>
                <atom-text-editor class="gitExtend-stashCommitModal--message-input" mini></atom-text-editor>
            </div>
            <label class="gitExtend-stashCommitModal--options-label">Options: </label>
            <div class="gitExtend-stashCommitModal--options-wrapper inset-panel">
                <label class="gitExtend-stashCommitModal--options--untracked-label">
                    <input class="gitExtend-stashCommitModal--options--untracked-input input-checkbox" type="checkbox" />
                    Include untracked files
                </label>
            </div>
            <br>
            <footer class="gitExtend-stashCommitModal--footer">
                <button class="gitExtend-stashCommitModal--commit btn btn-primary" title="Commit stash">Commit <span class="gitExtend-stashCommitModal--commit--loader loading-spinner-tiny" hidden></span></button>
                <button class="gitExtend-stashCommitModal--cancel btn btn-default" title="Cancel">Cancel</button>
            </footer>
        `;

        var modal = document.createElement('div');
            modal.classList = 'gitExtend-stashCommitModal--modal gitExtend-modal';
            modal.innerHTML = template;

        var cancel = modal.querySelector('.gitExtend-stashCommitModal--cancel');
        var commit = modal.querySelector('.gitExtend-stashCommitModal--commit');

        cancel.addEventListener('click', (e) => {
            this.destroy();
        });

        commit.addEventListener('click', (e) => {
            cancel.disabled = true;

            var loader = commit.querySelector('.gitExtend-stashCommitModal--commit--loader');
                loader.hidden = false;

            git.stash('commit', {
                message: modal.querySelector('.gitExtend-stashCommitModal--message-input').getModel().getText(),
                untracked: modal.querySelector('.gitExtend-stashCommitModal--options--untracked-input').checked
            }).then((response) => {
                if (response.success) {
                    setTimeout(() => {
                        this.destroy();
                        if (/no local changes to save/i.test(response.stdout)) {
                            atom.notifications.addInfo(response.stdout, {
                                dismissable: true
                            });
                        } else {
                            atom.notifications.addSuccess(response.stdout, {
                                dismissable: true
                            });
                        }
                    }, 500);
                } else {
                    this.destroy();
                    git.branch('current').then((response) => {
                        var branch = response.stdout.trim();
                        atom.notifications.addError(`Attempt to save stash on <i>${branch}</i> failed.\n${response.stderr}`, {
                            dismissable: true
                        });
                    });
                }
            });
        });

        this.modal = atom.workspace.addModalPanel({
            item: modal,
            visible: false,
            autoFocus: true
        });
        this.modal.show();
    }

    destroy() {
        this.modal.destroy();
    }

}
