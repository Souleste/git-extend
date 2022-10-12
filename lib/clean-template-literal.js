'use babel';

export default {
    clean(str) {
        return str
            .replace(/</g, '&lt;').replace(/>/g, '&gt;') // tags
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;') // quotation / apostrophe
            .replace(/\\/g, '&#92;').replace(/\//g, '&#47;'); // slashes
    }
}
