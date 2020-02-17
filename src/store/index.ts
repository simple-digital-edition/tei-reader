import Vue from 'vue'
import Vuex from 'vuex'

import TEIMetadataParser from '@/util/TEIMetadataParser';
import TEITextParser from '@/util/TEITextParser';
import deepclone from '@/util/deepclone';
import get from '@/util/get';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        content: {
        },
        callbacks: {
        },
        sections: {
        },
        ui: {
            mode: 'small',
            smallMenuOpen: false,
            selectedSection: null,
            sections: {}
        }
    },
    mutations: {
        init(state, config) {
            state.sections = config.sections;
            Object.keys(config.sections).forEach((key, idx) => {
                if (config.sections[key].type === 'MetadataEditor') {
                    state.settings.metadataSection = key;
                }
                Vue.set(state.content, key, {});
                Vue.set(state.content[key], 'doc', null);
                Vue.set(state.content[key], 'nested', {});

                Vue.set(state.ui.sections, key, {});
                if (config.sections[key].type === 'TextReader') {
                    Vue.set(state.ui.sections[key], 'annotations', []);
                    Vue.set(state.ui.sections[key], 'footnote', null);
                }
                if (idx === 0) {
                    state.ui.selectedSection = key;
                }
            });
            if (window.TEIReader && window.TEIReader.callbacks) {
                Vue.set(state.callbacks, 'autoLoad', window.TEIReader.callbacks.autoLoad);
            }
        },

        setTextDoc(state, payload: any) {
            const path = payload.path.split('.');
            if (path.length === 2) {
                Vue.set(state.content[path[0]], path[1], payload.doc);
            } else if(path.length === 4) {
                Vue.set(state.content[path[0]].nested[path[2]][path[3]], 'content', [payload.doc]);
            }
        },

        addNestedDoc(state, payload: any) {
            const path = payload.path.split('.');
            if (path.length === 4) {
                if (!state.content[path[0]].nested[path[2]]) {
                    Vue.set(state.content[path[0]].nested, path[2], {});
                }
                Vue.set(state.content[path[0]].nested[path[2]], path[3], {
                    attrs: {
                        id: path[3],
                    },
                    content: [
                        payload.doc,
                    ],
                    nestedDoc: true,
                    type: path[2],
                });
            }
        },

        selectSection(state, section: string) {
            state.ui.selectedSection = section;
        },

        toggleAnnotation(state, payload: any) {
            const path = payload.path.split('.');
            if (path.length === 4) {
                const annotations = deepclone(state.ui.sections[path[0]].annotations);
                if (annotations.indexOf(payload.path) >= 0) {
                    annotations.splice(annotations.indexOf(payload.path), 1);
                } else {
                    annotations.push(payload.path);
                }
                Vue.set(state.ui.sections[path[0]], 'annotations', annotations);
            }
        },

        toggleFootnote(state, payload: any) {
            const path = payload.path.split('.');
            if (path.length === 4) {
                if (state.ui.sections[path[0]].footnote === payload.path) {
                    Vue.set(state.ui.sections[path[0]], 'footnote', null);
                } else {
                    Vue.set(state.ui.sections[path[0]], 'footnote', payload.path);
                }
            }
        },

        toggleSmallMenu(state) {
            state.ui.smallMenuOpen = !state.ui.smallMenuOpen;
        },

        setMode(state, payload: string) {
            this.state.ui.mode = payload;
        },
    },
    actions: {
        load({ commit, state }, sourceData: string) {
            const domParser = new DOMParser();
            const dom = domParser.parseFromString(sourceData, 'application/xml');
            Vue.set(state, 'content', {});
            Object.keys(state.sections).forEach((key, idx) => {
                Vue.set(state.content, key, {});
                Vue.set(state.content[key], 'doc', null);
                Vue.set(state.content[key], 'nested', {});
            });
            Object.entries(state.sections).forEach(([key, config]) => {
                if (config.type === 'MetadataEditor') {
                    commit('setMetadata', (new TEIMetadataParser(dom, config)).get())
                } else if (config.type === 'TextReader') {
                    const [doc, nestedDocs] = (new TEITextParser(dom, config)).get();
                    commit('setTextDoc', { path: key + '.doc', doc: doc });
                    Object.entries(nestedDocs).forEach(([nestedKey, docs]: any) => {
                        Object.entries(docs).forEach(([docKey, doc]: any) => {
                            commit('addNestedDoc', {path: key + '.nested.' + nestedKey + '.' + docKey, doc: doc.content[0]});
                        });
                    });
                }
            });
        }
    },
    modules: {
    }
})
