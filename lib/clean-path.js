'use babel';

export default {
    clean(path) {
        return path.replace(/[\\\/]+/g, '\\\\').trim();
    }
}
