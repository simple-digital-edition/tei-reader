import { writable, derived } from 'svelte/store';

export const uiConfig = writable(null as UIConfig);
export const currentSectionName = writable('');
export const currentSection = derived([uiConfig, currentSectionName], ([uiConfig, currentSectionName]) => {
    if (uiConfig && uiConfig.sections && currentSectionName) {
        for (let section of uiConfig.sections) {
            if (section.name === currentSectionName) {
                return section;
            }
        }
    }
    return null;
});
export const currentFootnote = writable(null);

export async function loadUIConfig(src: string) {
    const response = await window.fetch(src);
    const config = await response.json()
    uiConfig.set(config);
    if (config.sections.length > 0) {
        currentSectionName.set(config.sections[0].name);
    }
}
