import { ready } from './status';
import { uiConfig, currentSectionName, currentSection, currentFootnote, loadUIConfig } from './ui';
import { document, metadata, loadTEI } from './tei';

export {
    ready,

    uiConfig,
    currentSectionName,
    currentSection,
    currentFootnote,

    document,
    metadata,
};

export async function load(uiConfig: string, teiSchema: string, teiFile: string) {
    await Promise.all([
        loadUIConfig(uiConfig),
        loadTEI(teiSchema, teiFile),
    ]);
    ready.set(true);
}
