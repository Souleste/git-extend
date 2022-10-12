'use babel';

import StashCommitView from './views/stash-commit-view';
import StashListView from './views/stash-list-view';
import MergeView from './views/merge-view';
import CheckoutView from './views/checkout-view';

import { CompositeDisposable } from 'atom';

import * as childProcess from 'child_process';

import { clean as cleanTemplate } from './clean-template-literal';
import { clean as cleanPath } from './clean-path';

export default {

    subscriptions: null,

    activate(state) {
        this.stashCommitView = new StashCommitView();
        this.stashListView = new StashListView();
        this.mergeView = new MergeView();
        this.checkoutView = new CheckoutView();

        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'git-extend:toggle-stash-commit-modal': () => this.stashCommitView.activate(),
            'git-extend:toggle-stash-list-modal': () => this.stashListView.activate(),
            'git-extend:toggle-merge-modal': () => this.mergeView.activate(),
            'git-extend:toggle-checkout-modal': () => this.checkoutView.activate()
        }));
    },

    disable() {
        this.subscriptions.dispose();
        
        his.stashCommitView.destroy();
        this.stashListView.destroy();
        this.mergeView.destroy();
        this.checkoutView.destroy();
    }

}
