'use babel';

import BranchListView from './branch-list-view';

import * as git from './../git.js';
import { clean as cleanTemplate } from './../clean-template-literal';
import { clean as cleanPath } from './../clean-path';

const toArray = require("to-array");

export default class CheckoutView {

    constructor() {}

    activate() {
        var selected = document.querySelector('[is="tree-view-file"].file.selected');
        var path = cleanPath(selected.querySelector('span[data-path]').getAttribute('data-path'));

        const modalTemplate = `
            <header class="gitExtend-checkoutModal--header">
                <h4>Replace File</h4>
                <code>${path.replace(/\\\\/g, '\\')}</code>
            </header>
            <br>
            <p>* This will discard all changes for the selected resource</p>
            <div class="gitExtend-checkoutModal--select-wrapper">
                <label class="gitExtend-checkoutModal--select-label">Replace With: </label>
                <select class="gitExtend-checkoutModal--select input-select">
                    <option value="index">Index</option>
                    <option value="commit">Commit</option>
                    <option value="tag">Tag</option>
                    <option value="branch">Branch</option>
                </select>
            </div>
            <br>
            <div class="gitExtend-checkoutModal--option-panel-loader loading-spinner-small" hidden></div>
            <div class="gitExtend-checkoutModal--option-panel inset-panel" data-option="index">
                <p>Replace file with staged revision</p>
            </div>
            <div class="gitExtend-checkoutModal--option-panel" data-option="commit" hidden>
                <div class="inset-panel">
                    <div class="row gitExtend-checkoutModal--option-panel--commit-list-header select-list-header">
                        <div class="col-2">Commit</div>
                        <div class="col-5">Message</div>
                        <div class="col-2">Author</div>
                        <div class="col-3">Date</div>
                    </div>
                    <div class="gitExtend-checkoutModal--option-panel--commit-wrapper select-list">
                        <ol class="gitExtend-checkoutModal--option-panel--commit-list list-unstyled list-group"></ol>
                    </div>
                </div>
            </div>
            <div class="gitExtend-checkoutModal--option-panel inset-panel" data-option="tag" hidden>
                <div class="inset-panel">
                    <div class="row gitExtend-checkoutModal--option-panel--tag-list-header select-list-header">
                        <div class="col-2">Tag</div>
                        <div class="col-2">Commit</div>
                        <div class="col-4">Message</div>
                        <div class="col-2">Author</div>
                        <div class="col-2">Date</div>
                    </div>
                    <div class="gitExtend-checkoutModal--option-panel--tag-wrapper select-list">
                        <ol class="gitExtend-checkoutModal--option-panel--tag-list list-unstyled list-group"></ol>
                    </div>
                </div>
            </div>
            <div class="gitExtend-checkoutModal--option-panel inset-panel" data-option="branch" hidden></div>
            <br>
            <footer class="gitExtend-checkoutModal--footer">
                <button class="gitExtend-checkoutModal--checkout btn btn-primary" title="checkout">Replace <span class="gitExtend-checkoutModal--checkout--loader loading-spinner-tiny" hidden></span></button>
                <button class="gitExtend-checkoutModal--cancel btn btn-default" title="Cancel">Cancel</button>
            </footer>
        `;
        var modal = document.createElement('div');
            modal.classList = 'gitExtend-checkoutModal--modal gitExtend-modal';
            modal.innerHTML = modalTemplate;

        var cancel = modal.querySelector('.gitExtend-checkoutModal--cancel');
        var checkout = modal.querySelector('.gitExtend-checkoutModal--checkout');
        var select = modal.querySelector('.gitExtend-checkoutModal--select');

        cancel.addEventListener('click', (e) => {
            this.destroy();
        });

        checkout.addEventListener('click', (e) => {
            cancel.disabled = true;

            var repo = git.repo(path);
            var loader = checkout.querySelector('.gitExtend-checkoutModal--checkout--loader');
                loader.hidden = false;

            var options = {
                repo: repo,
                path: path
            };

            if (select.value == 'index');
            else if (select.value == 'tag') options.tag = modal.querySelector('[name="gitExtend-checkoutModal--option-panel--tag-list--option-input"]:checked').value;
            else if (select.value == 'commit') options.commit = modal.querySelector('[name="gitExtend-checkoutModal--option-panel--commit-list--option-input"]:checked').value;
            else if (select.value == 'branch') options.branch = modal.querySelector('[name="gitExtend-checkoutModal-branch-list--option-input"]:checked').value;

            git.checkout(select.value, options).then((response) => {
                this.destroy();
                if (response.success) {
                    atom.notifications.addSuccess(`<i>${path}</i> replaced successfully.`, {
                        dismissable: true
                    });
                } else {
                    atom.notifications.addError(`Attempt to replace <i>${path}</i> failed.\n${response.stderr}`, {
                        dismissable: true
                    });
                }
            });
        });

        select.addEventListener('change', (e) => {
            var repo = git.repo(path);
            var value = e.currentTarget.value;
            var loader = modal.querySelector('.gitExtend-checkoutModal--option-panel-loader');
            var panels = toArray(modal.querySelectorAll('.gitExtend-checkoutModal--option-panel'));
                panels.forEach((panel) => panel.hidden = true);
            var panel = modal.querySelector('.gitExtend-checkoutModal--option-panel[data-option="'+value+'"]');

            checkout.disabled = true;
            select.disabled = true;

            switch(value) {
                case 'index':
                    panel.hidden = false;
                    select.disabled = false;
                    checkout.disabled = false;
                    break;
                case 'tag':
                    loader.hidden = false;

                    var list = panel.querySelector('.gitExtend-checkoutModal--option-panel--tag-list');
                        list.innerHTML = '';

                    git.tag('tag', { repo: repo }).then((response) => {
                        if (response.success) {
                            if (response.tags.length) {
                                response.tags.forEach((tag, i) => {
                                    var item = document.createElement('li');
                                        item.classList = `gitExtend-checkoutModal--option-panel--tag-list--option list-group-item ${i == 0 ? 'selected' : ''}`;
                                        item.innerHTML = `
                                            <label class="row">
                                                <input type="radio" name="gitExtend-checkoutModal--option-panel--tag-list--option-input" value="${tag.commit}" ${i == 0 ? 'checked' : ''} hidden />
                                                <div class="col-2">${tag.tag}</div>
                                                <div class="col-2 text-info">${tag.commit}</div>
                                                <div class="col-4" title="${cleanTemplate(tag.message)}">${cleanTemplate(tag.message)}</div>
                                                <div class="col-2" title="${tag.author.name} ${cleanTemplate('<'+tag.author.email+'>')}">${tag.author.name}</div>
                                                <div class="col-2" title="${tag.date.iso}">${tag.date.relative}</div>
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
                                    item.innerHTML = `<div class="empty-message">No tags were found for this branch.</div>`;

                                list.appendChild(item);
                            }

                            setTimeout(() => {
                                panel.hidden = false;
                                loader.hidden = true;
                                select.disabled = false;
                                if (response.tags.length) checkout.disabled = false;
                            }, 500);
                        } else {
                            atom.notifications.addError(`Unable to read tags for ${repo}.`, {
                                dismissable: true
                            });
                        }
                    });
                    break;
                case 'commit':
                    loader.hidden = false;

                    var list = panel.querySelector('.gitExtend-checkoutModal--option-panel--commit-list');
                        list.innerHTML = '';

                    git.log('log', {
                        repo: repo,
                        path: path
                    }).then((response) => {
                        if (response.success) {
                            if (response.commits.length) {
                                response.commits.forEach((commit, i) => {
                                    var item = document.createElement('li');
                                        item.classList = `gitExtend-checkoutModal--option-panel--commit-list--option list-group-item ${i == 0 ? 'selected' : ''}`;
                                        item.innerHTML = `
                                            <label class="row">
                                                <input type="radio" name="gitExtend-checkoutModal--option-panel--commit-list--option-input" value="${commit.commit}" ${i == 0 ? 'checked' : ''} hidden />
                                                <div class="col-2 text-info">${commit.commit}</div>
                                                <div class="col-5" title="${cleanTemplate(commit.message)}">${cleanTemplate(commit.message)}</div>
                                                <div class="col-2" title="${commit.author.name} ${cleanTemplate('<'+commit.author.email+'>')}">${commit.author.name}</div>
                                                <div class="col-3" title="${commit.date.iso}">${commit.date.relative}</div>
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
                                    item.innerHTML = `<div class="empty-message">No commits were found for the selected resource.</div>`;

                                list.appendChild(item);
                            }

                            setTimeout(() => {
                                panel.hidden = false;
                                loader.hidden = true;
                                select.disabled = false;
                                if (response.commits.length) checkout.disabled = false;
                            }, 500);
                        } else {
                            atom.notifications.addError(`Unable to read commits for ${repo}.`, {
                                dismissable: true
                            });
                        }
                    });
                    break;
                case 'branch':
                    loader.hidden = false;
                    panel.innerHTML = '';

                    (new BranchListView({
                        repo: repo,
                        id: 'mergeModal'
                    })).then((response) => {
                        panel.appendChild(response.list);
                        panel.hidden = false;
                        loader.hidden = true;
                        select.disabled = false;
                        if (toArray(response.list.querySelectorAll('.list-group-item')).length) checkout.disabled = false;
                    });
                    break;
            }
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
