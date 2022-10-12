'use babel';

import BranchListView from './branch-list-view';

import * as git from './../git.js';

export default class MergeView {

    constructor() {}

    activate() {
        var repo = git.repo();
        git.branch('current', { repo: repo }).then((response) => {
            if (response.success) {
                var currentBranch = response.branch;

                const modalTemplate = `
                    <header class="gitExtend-mergeModal--header">
                        <h4>Merge ${currentBranch}</h4>
                    </header>
                    <br>
                    <p>Select a branch to merge into <i>${currentBranch}</i></p>
                    <div class="gitExtend-mergeModal--branch-loader loading-spinner-small"></div>
                    <div class="gitExtend-mergeModal--branch-wrapper" hidden></div>
                    <br>
                    <label class="gitExtend-mergeModal--merge-options-label">Merge options: </label>
                    <div class="gitExtend-mergeModal--merge-options-wrapper inset-panel">
                        <label class="gitExtend-mergeModal--merge-option-label">
                            <input class="gitExtend-mergeModal--merge-options-option input-radio" name="gitExtend-mergeModal--merge-option" type="radio" value="--commit" checked />
                            Commit (commit the response)
                        </label>
                        <label class="gitExtend-mergeModal--merge-option-label">
                            <input class="gitExtend-mergeModal--merge-options-option input-radio" name="gitExtend-mergeModal--merge-option" type="radio" value="--no-commit" />
                            No commit (prepare merge commit, but don't commit yet)
                        </label>
                        <label class="gitExtend-mergeModal--merge-option-label">
                            <input class="gitExtend-mergeModal--merge-options-option input-radio" name="gitExtend-mergeModal--merge-option" type="radio" value="--squash" />
                            Squash (merge changes into working tree, but don't create merge commit)
                        </label>
                    </div>
                    <br>
                    <footer class="gitExtend-mergeModal--footer">
                        <button class="gitExtend-mergeModal--merge btn btn-primary" title="Merge ${currentBranch}" disabled>Merge <span class="gitExtend-mergeModal--merge--loader loading-spinner-tiny" hidden></span></button>
                        <button class="gitExtend-mergeModal--cancel btn btn-default" title="Cancel">Cancel</button>
                    </footer>
                `;
                var modal = document.createElement('div');
                    modal.classList = 'gitExtend-mergeModal--modal gitExtend-modal';
                    modal.innerHTML = modalTemplate;

                var cancel = modal.querySelector('.gitExtend-mergeModal--cancel');
                var merge = modal.querySelector('.gitExtend-mergeModal--merge');
                var wrapper = modal.querySelector('.gitExtend-mergeModal--branch-wrapper');
                var loader = modal.querySelector('.gitExtend-mergeModal--branch-loader');

                cancel.addEventListener('click', (e) => {
                    this.destroy();
                });

                merge.addEventListener('click', (e) => {
                    var list = wrapper.querySelector('.gitExtend-branch-list');
                    var selected = list.querySelector('.list-group-item.selected');
                    var branch = selected.getAttribute('data-branch');
                    var commit = modal.querySelector('[name="gitExtend-mergeModal--merge-option"]:checked').value;

                    git.merge('merge', {
                        branch: branch,
                        commit: commit
                    }).then((response) => {
                        setTimeout(() => {
                            this.destroy();
                            if (response.success) {
                                if (/^already up to date/i.test(response.stdout)) {
                                    atom.notifications.addInfo(`<i>${currentBranch}</i> ${response.stdout}`, {
                                        dismissable: true
                                    });
                                } else {
                                    atom.notifications.addSuccess(`<i>${branch}</i> merged successfully.`, {
                                        dismissable: true
                                    });
                                }
                            } else {
                                atom.notifications.addError(`Attempt to merge <i>${branch}</i> into <i>${currentBranch}</i> failed.\n${response.stderr}`, {
                                    dismissable: true
                                });
                            }
                        }, 500);
                    });
                });

                (new BranchListView({
                    repo: repo,
                    id: 'mergeModal'
                })).then((response) => {
                    wrapper.appendChild(response.list);
                    wrapper.hidden = false;
                    loader.hidden = true;
                    merge.disabled = false;
                });

                this.modal = atom.workspace.addModalPanel({
                    item: modal,
                    visible: false,
                    autoFocus: true
                });
                this.modal.show();
            } else {
                atom.notifications.addError(`Unable to determine current branch.`, {
                    dismissable: true
                });
            }
        });
    }

    destroy() {
        this.modal.destroy();
    }

}
