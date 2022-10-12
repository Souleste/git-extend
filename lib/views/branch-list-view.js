'use babel';

import * as git from './../git.js';
import { clean as cleanTemplate } from './../clean-template-literal';
import { clean as cleanPath } from './../clean-path';

export default class BranchListView {

    branchListView = null;

    constructor(options) {
        var template = document.createElement('div');
            template.classList = 'select-list';
            template.innerHTML = `<ol class="list-unstyled list-group gitExtend-branch-list"></ol>`;

        var itemTemplate = (info) => {
            var item = document.createElement('li');
                item.classList = `list-group-item ${info.current?'selected':''}`;
                item.setAttribute('data-branch', info.branch);
                item.setAttribute('data-commit', info.commit);
                item.innerHTML = `
                    <input type="radio" name="gitExtend-${options.id}-branch-list--option-input" value="${info.branch}" ${info.index == 0 ? 'checked' : ''} hidden />
                    <span class="gitExtend-branch-list--branch ${info.current?'text-success':''}">${info.branch}</span>
                    <span class="gitExtend-branch-list--commit text-info"><i>${info.commit}</i></span>
                    <span class="gitExtend-branch-list--message" title="${cleanTemplate(info.message)}"><i>${cleanTemplate(info.message)}</i></span>
                `;
                item.addEventListener('click', (e) => {
                    var item = e.currentTarget;
                    var list = item.closest('.list-group');
                    var items = list.querySelectorAll('.list-group-item');
                        items.forEach((item) => item.classList.remove('selected'));

                    item.classList.add('selected');
                });

            return item;
        };

        return new Promise((resolve) => {
            git.branch('all', {
                repo: options.repo
            }).then((response) => {
                if (response.success) {
                    var branches = response.branches;
                    var branchList = template.querySelector('.gitExtend-branch-list');

                    if (branches.local.length) {
                        var item = document.createElement('li');
                            item.setAttribute('data-type', 'local');
                            item.classList = 'gitExtend-branch-list--item-divider';
                            item.innerHTML = 'Local:';

                        branchList.appendChild(item);

                        branches.local.forEach((local) => branchList.appendChild(itemTemplate(local)));
                    }

                    if (branches.remote.length) {
                        var item = document.createElement('li');
                            item.setAttribute('data-type', 'remote');
                            item.classList = 'gitExtend-branch-list--item-divider';
                            item.innerHTML = 'Remote:';

                        branchList.appendChild(item);

                        branches.remote.forEach((remote) => branchList.appendChild(itemTemplate(remote)));
                    }

                    resolve({
                        list: template
                    });
                } else {
                    // error noti
                }
            });
        });
    }

}
