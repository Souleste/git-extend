'use babel';

import * as childProcess from 'child_process';

import { clean as cleanPath } from './clean-path';

export default {
    execute(command, message = '') {
        if (atom.devMode) console.log(command);
        return new Promise((resolve) => {
            childProcess.exec(command, (error, stdout, stderr) => {
                if (atom.devMode) {
                    if (error) console.log(error);
                    else console.log(stdout, (message != '' ? '\n'+message : ''));
                }

                var result = {
                    success: !error,
                    stdout: stdout,
                    stderr: stderr
                };
                if (error) result.error = error;

                resolve(result);
            });
        });
    },

    repo(path = '') {
        var path = cleanPath(path != '' ? path : atom.workspace.getActiveTextEditor().getPath()).toString();
        return atom.project.getRepositories().filter((o) => o).map((o) => cleanPath(o.repo.workingDirectory)).find((o) => {
            var rex = new RegExp('^'+o.replace(/\\\\/g, '\\\\\\\\'));
            return rex.test(path);
        });
    },

    stash(command, options = {}) {
        if (atom.devMode) console.log(`Stash ${command}!`, options);

        var repo = cleanPath(options.repo ? options.repo : this.repo());
        var commands = {
            'commit': `git -C "${repo}" stash push -m "${options.message}" ${options.untracked?'-u':''}`,
            'list': `git -C "${repo}" stash list --pretty="%ncommit: %h%nauthorname: %an%nauthoremail: <%ae>%ndate: %ai%nrelative: %ar%nmessage: %gs"`,
            'show': `git -C "${repo}" stash show stash@{${options.index}} --name-only`,
            'apply': `git -C "${repo}" stash apply stash@{${options.index}}`,
            'drop': `git -C "${repo}" stash drop stash@{${options.index}}`,
            'drop': `git -C "${repo}" stash drop stash@{${options.index}}`
        };

        return new Promise((resolve, reject) => {
            this.execute(commands[command]).then((response) => {
                if (response.success) {
                    switch(command) {
                        case 'commit': break;
                        case 'list':
                            stashes = response.stdout != '' ? response.stdout.match(/^(commit.*\n(?:.*\n?(?!commit))*)/gmi).map((stash, i) => {
                                var groups = stash.match(/^commit: (.*)\n^authorname: (.*)\n^authoremail: (.*)\n^date: (.*)\n^relative: (.*)\n^message: (.*)/mi).slice(1);

                                return {
                                    index: i,
                                    commit: groups[0],
                                    author: {
                                        name: groups[1],
                                        email: groups[2]
                                    },
                                    date: {
                                        iso: groups[3],
                                        relative: groups[4]
                                    },
                                    message: groups[5]
                                };
                            }) : [];

                            response.stashes = stashes;
                            break;
                        case 'show':
                            var files = response.stdout != '' ? response.stdout.match(/^(.*)\n?/gm) : [];

                            response.files = files;
                            break;
                        case 'apply': break;
                        case 'drop':
                        case 'delete':
                            break;
                    }
                } else reject();

                resolve(response);
                if (atom.devMode) console.log(`Finished stash ${command}`);
            });
        });
    },

    merge(command, options = {}) {
        if (atom.devMode) console.log(`Merge ${command}!`, options);

        var repo = cleanPath(options.repo ? options.repo : this.repo());
        var commands = {
            'merge': `git -C "${repo}" merge "${options.branch}" ${options.commit?options.commit:''} -m "" --log`,
        };

        return new Promise((resolve, reject) => {
            if (command == 'merge' && !['commit', 'no-commit', 'squash'].includes(options.commit))
                reject();

            this.execute(commands[command]).then((response) => {
                if (response.success) {
                    switch(command) {
                        case 'merge': break;
                    }
                } else reject();

                resolve(response);
                if (atom.devMode) console.log(`Finished merge ${command}`);
            });
        });
    },

    branch(command, options = {}) {
        if (atom.devMode) console.log(`Branch ${command}!`, options);

        var repo = cleanPath(options.repo ? options.repo : this.repo());
        var commands = {
            'current': `git -C "${repo}" branch --show-current`,
            'all': `git -C "${repo}" branch -a --format="branch: %(refname:short) current: %(HEAD) commit: %(objectname:short) authorname: %(authorname) authoremail: %(authoremail) dateiso: %(creatordate:iso) daterelative: %(creatordate:relative) message: %(subject)"`
        };

        return new Promise((resolve, reject) => {
            this.execute(commands[command]).then((response) => {
                if (response.success) {
                    switch(command) {
                        case 'current':
                            response.branch = response.stdout.trim();
                        break;
                        case 'all':
                            var branches = response.stdout != '' ? response.stdout.match(/^(branch:.*)/gmi).map((branch, i) => {
                                var groups = branch.match(/^branch: (.*) current: (.*) commit: (.*) authorname: (.*) authoremail: (.*) dateiso: (.*) daterelative: (.*) message: (.*)/mi).slice(1);

                                return {
                                    index: i,
                                    branch: groups[0],
                                    current: groups[1].trim() == '*',
                                    commit: groups[2],
                                    author: {
                                        name: groups[3],
                                        email: groups[4]
                                    },
                                    date: {
                                        iso: groups[5],
                                        relative: groups[6]
                                    },
                                    message: groups[7]
                                };
                            }) : [];

                            response.branches = {
                                local: branches.filter((branch) => /^(?!origin)/.test(branch.branch)),
                                remote: branches.filter((branch) => /^origin/.test(branch.branch))
                            };
                            break;
                    }
                } else reject();

                resolve(response);
                if (atom.devMode) console.log(`Finished branch ${command}`);
            });
        });
    },

    checkout(command, options = {}) {
        if (atom.devMode) console.log(`Checkout ${command}!`, options);

        var repo = cleanPath(options.repo ? options.repo : this.repo());
        var commands = {
            'index': `git -C "${repo}" checkout-index -f -- "${options.path}"`,
            'tag': `git -C "${repo}" checkout ${options.tag} -- "${options.path}"`,
            'commit': `git -C "${repo}" checkout ${options.commit} -- "${options.path}"`,
            'branch': `git -C "${repo}" checkout "${options.branch}" -- "${options.path}"`
        };

        return new Promise((resolve, reject) => {
            this.execute(commands[command]).then((response) => {
                if (response.success) {
                    switch(command) {
                        case 'index': break;
                        case 'tag': break;
                        case 'commit': break;
                        case 'branch': break;
                    }
                } else reject();

                resolve(response);
                if (atom.devMode) console.log(`Finished checkout ${command}`);
            });
        });
    },

    tag(command, options = {}) {
        if (atom.devMode) console.log(`Tag ${command}!`, options);

        var repo = cleanPath(options.repo ? options.repo : this.repo());
        var commands = {
            'tag': `git -C ${repo} tag --list --format="tag: %(refname:short) commit: %(objectname:short) authorname: %(taggername) authoremail: %(taggeremail) dateiso: %(taggerdate:iso) daterelative: %(taggerdate:relative) message: %(subject)"`
        };

        return new Promise((resolve, reject) => {
            this.execute(commands[command]).then((response) => {
                if (response.success) {
                    switch(command) {
                        case 'tag':
                            var tags = response.stdout != '' ? response.stdout.match(/^(tag:.*)/gmi).map((tag, i) => {
                                var groups = tag.match(/^tag: (.*) commit: (.*) authorname: (.*) authoremail: (.*) dateiso: (.*) daterelative: (.*) message: (.*)/mi).slice(1);

                                return {
                                    index: i,
                                    tag: groups[0],
                                    commit: groups[1],
                                    author: {
                                        name: groups[2],
                                        email: groups[3]
                                    },
                                    date: {
                                        iso: groups[4],
                                        relative: groups[5]
                                    },
                                    message: groups[6]
                                };
                            }) : [];

                            response.tags = tags;
                            break;
                    }
                } else reject();

                resolve(response);
                if (atom.devMode) console.log(`Finished tag ${command}`);
            });
        });
    },

    log(command, options = {}) {
        if (atom.devMode) console.log(`Tag ${command}!`, options);

        var repo = cleanPath(options.repo ? options.repo : this.repo());
        var commands = {
            'log': `git -C ${repo} log --pretty="commit: %h%nauthorname: %an%nauthoremail: %ae%ndateiso: %ai%ndaterelative: %ar%nmessage: %s" -- "${options.path}"`
        };

        return new Promise((resolve, reject) => {
            this.execute(commands[command]).then((response) => {
                if (response.success) {
                    switch(command) {
                        case 'log':
                            var commits = response.stdout != '' ? response.stdout.match(/^(commit.*\n(?:.*\n?(?!commit))*)/gmi).map((commit) => {
                                var groups = commit.match(/^commit: (.*)\n^authorname: (.*)\n^authoremail: (.*)\n^dateiso: (.*)\n^daterelative: (.*)\n^message: (.*)/mi).slice(1);

                                return {
                                    commit: groups[0],
                                    author: {
                                        name: groups[1],
                                        email: groups[2]
                                    },
                                    date: {
                                        iso: groups[3],
                                        relative: groups[4]
                                    },
                                    message: groups[5]
                                };
                            }) : [];

                            response.commits = commits;
                            break;
                    }
                } else reject();

                resolve(response);
                if (atom.devMode) console.log(`Finished tag ${command}`);
            });
        });
    }
}
