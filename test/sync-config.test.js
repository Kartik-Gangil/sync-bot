import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTargetFilePath } from '../src/file-sync.js';

test('maps configured source files to target files', () => {
    const config = {
        mappings: [
            { source: 'Readme.md', target: 'page.jsx' }
        ]
    };

    assert.equal(
        resolveTargetFilePath('Readme.md', config),
        'page.jsx'
    );
});

test('falls back to the original path when no mapping exists', () => {
    const config = { mappings: [] };

    assert.equal(
        resolveTargetFilePath('docs/guide.md', config),
        'docs/guide.md'
    );
});
