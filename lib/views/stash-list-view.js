'use babel';

import StashDetailsView from './stash-details-view';

import * as git from './../git.js';
import { clean as cleanTemplate } from './../clean-template-literal';

export default class StashListView {

    constructor() {
        this.stashDetailsView = new StashDetailsView();
    }

    activate() {
        var repo = git.repo();
        git.branch('current', { repo: repo }).then((response) => {
            if (response.success) {
                var branch = response.branch;

                const template = `
                    <header class="gitExtend-stashListModal--header">
                        <h4>Stashes</h4>
                        <p>Viewing stashed changes on ${branch}</p>
                    </header>
                    <div class="gitExtend-stashListModal--stash-list--loader-wrapper">
                        <div class="gitExtend-stashListModal--stash-list--loader loading-spinner-small"></div>
                        <div class="gitExtend-stashListModal--stash-list--loader-message">Loading stashed changes...</div>
                    </div>
                    <div class="gitExtend-stashListModal--stash-list-wrapper inset-panel" hidden>
                        <div class="row gitExtend-stashListModal--stash-list-header select-list-header">
                            <div class="col-1">Index</div>
                            <div class="col-2">Commit</div>
                            <div class="col-5">Message</div>
                            <div class="col-2">Author</div>
                            <div class="col-2">Date</div>
                        </div>
                        <div class="gitExtend-stashListModal--stash-list-select select-list">
                            <ol class="gitExtend-stashListModal--stash-list list-unstyled list-group"></ol>
                        </div>
                    </div>
                    <br>
                    <footer class="gitExtend-stashListModal--footer">
                        <button class="gitExtend-stashListModal--apply btn btn-primary" title="Apply stashed changes">Apply <span class="gitExtend-stashListModal--apply--loader loading-spinner-tiny" hidden></span></button>
                        <button class="gitExtend-stashListModal--details btn btn-primary" title="View stash details">Details</button>
                        <button class="gitExtend-stashListModal--cancel btn btn-default" title="Cancel">Cancel</button>
                    </footer>
                `;
                var modal = document.createElement('div');
                    modal.classList = 'gitExtend-stashListModal--modal gitExtend-modal';
                    modal.innerHTML = template;

                var getStash = (modal) => {
                    var selected = modal.querySelector('.gitExtend-stashListModal--stash-list--option');

                    if (selected) {
                        return {
                            index: selected.querySelector('[name^="stash"][name$="[index]"]').value,
                            commit: selected.querySelector('[name^="stash"][name$="[commit]"]').value,
                            author: {
                                name: selected.querySelector('[name^="stash"][name$="[authorname]"]').value,
                                email: selected.querySelector('[name^="stash"][name$="[authoremail]"]').value,
                            },
                            message: selected.querySelector('[name^="stash"][name$="[message]"]').value,
                            date: {
                                iso: selected.querySelector('[name^="stash"][name$="[dateiso]"]').value,
                                relative: selected.querySelector('[name^="stash"][name$="[daterelative]"]').value,
                            },
                        }
                    } else return {};
                };

                var cancel = modal.querySelector('.gitExtend-stashListModal--cancel');
                var details = modal.querySelector('.gitExtend-stashListModal--details');
                var apply = modal.querySelector('.gitExtend-stashListModal--apply');

                apply.addEventListener('click', (e) => {
                    var loader = modal.querySelector('.gitExtend-stashListModal--apply--loader');
                        loader.hidden = false;

                    var stash = getStash(modal);
                    if (stash) {
                        git.stash('apply', stash).then((response) => {
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
                    }
                });

                details.addEventListener('click', (e) => {
                    var stash = getStash(modal);

                    if (stash) this.stashDetailsView.activate(stash);
                });

                cancel.addEventListener('click', (e) => {
                    this.destroy();
                });

                git.stash('list').then((response) => {
                    var loader = modal.querySelector('.gitExtend-stashListModal--stash-list--loader-wrapper');
                    var wrapper = modal.querySelector('.gitExtend-stashListModal--stash-list-wrapper');
                    var list = wrapper.querySelector('.gitExtend-stashListModal--stash-list');

                    if (response.success) {
                        var stashes = response.stashes;

                        if (stashes.length) {
                            stashes.forEach((stash, i) => {
                                var item = document.createElement('li');
                                    item.classList = `gitExtend-stashListModal--stash-list--option list-group-item ${i == 0 ? 'selected' : ''}`;
                                    item.innerHTML = `
                                        <label class="row">
                                            <input type="hidden" name="stash[${stash.commit}][index]" value="${stash.index}" />
                                            <input type="hidden" name="stash[${stash.commit}][commit]" value="${stash.commit}" />
                                            <input type="hidden" name="stash[${stash.commit}][message]" value="${stash.message}" />
                                            <input type="hidden" name="stash[${stash.commit}][authorname]" value="${stash.author.name}" />
                                            <input type="hidden" name="stash[${stash.commit}][authoremail]" value="${stash.author.email}" />
                                            <input type="hidden" name="stash[${stash.commit}][dateiso]" value="${stash.date.iso}" />
                                            <input type="hidden" name="stash[${stash.commit}][daterelative]" value="${stash.date.relative}" />
                                            <div class="col-1">${stash.index}</div>
                                            <div class="col-2 text-info">${stash.commit}</div>
                                            <div class="col-5" title="${cleanTemplate(stash.message)}">${cleanTemplate(stash.message)}</div>
                                            <div class="col-2" title="${cleanTemplate(stash.author.email)}">${stash.author.name}</div>
                                            <div class="col-2" title="${stash.date.iso}">${stash.date.relative}</div>
                                        </label>
                                    `;
                                    item.addEventListener('click', (e) => {
                                        var item = e.currentTarget;
                                        var list = item.closest('.list-group');
                                        var items = list.querySelectorAll('.list-group-item');
                                            items.forEach((item) => item.classList.remove('selected'));

                                        item.classList.add('selected');
                                    });

                                list.appendChild(item);
                            });
                        } else {
                            var item = document.createElement('li');
                                item.classList = 'list-group-item';
                                item.innerHTML = `<div class="empty-message">No stashes were found for this branch.</div>`;

                            list.appendChild(item);
                        }

                        setTimeout(() => {
                            loader.hidden = true;
                            wrapper.hidden = false;
                        }, 500);
                    } else {
                        this.destroy();
                        atom.notifications.addError(`Attempt to get stash list on <i>${branch}</i> failed.\n${response.stderr}`, {
                            dismissable: true
                        });
                    }
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
