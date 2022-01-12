import { writable, derived } from 'svelte/store';
import { TEIParser, createConfigurableNode, createConfigurableMark } from 'tei-util';
import { generateHTML } from '@tiptap/html';
import { Document } from '@tiptap/extension-document';
import { Text } from '@tiptap/extension-text';
import type { TEIConfig, TEIDocument, TEITextDocumentCollection, TEITextNode } from 'tei-util/dist/types';

import { uiConfig } from './ui';

export const metadata = writable({});
export const sourceSchema = writable(null as TEIConfig)
export const sourceDocument = writable(null as TEIDocument);

function createAttributes(schema: TEIConfig, names: string[], extraAttrs: string[]) {
    const attrs = {};
    for (let attrName of extraAttrs) {
        attrs[attrName] = {
            default: null,
        };
    }
    if (names) {
        for (let attr of schema.attributes) {
            if (names.filter((name) => { return name === attr.name; }).length > 0) {
                attrs[attr.name] = {
                    default: attr.default,
                };
            }
        }
    }
    return attrs;
}

export async function loadTEI(teiSchemaSrc: string, teiSrc: string) {
    const schemaResponse = await window.fetch(teiSchemaSrc);
    const teiResponse = await window.fetch(teiSrc);
    const schema = await schemaResponse.json();
    const parser = new TEIParser(schema);
    sourceSchema.set(schema);
    const teiDocument = parser.parse(await teiResponse.text());
    sourceDocument.set(teiDocument);
}

export const document = derived([sourceDocument, sourceSchema, uiConfig], ([teiDocument, schema, uiConfig]) => {
    if (teiDocument && schema && uiConfig) {
        const extensions = [
            Document,
            Text,
        ] as any[];
        for (let element of schema.elements) {
            if (element.name === 'doc') {
                continue;
            }
            if (!element.type || element.type === 'block') {
                const extraAttrs = [];
                for (let uiSection of uiConfig.sections) {
                    if (uiSection.type === 'text' && uiSection.headings) {
                        for (let heading of uiSection.headings) {
                            if (heading.name === element.name) {
                                if (extraAttrs.indexOf('_tr-heading-id') < 0) {
                                    extraAttrs.push('_tr-heading-id');
                                }
                                break
                            }
                        }
                    }
                }
                extensions.push(createConfigurableNode({
                    name: element.name,
                    group: element.group,
                    content: element.content,
                    defining: element.defining,
                    attributes: createAttributes(schema, element.attrs, extraAttrs),
                }));
            } else if (element.type === 'nested') {
                // Nothing needed for this
            } else if (element.type === 'text') {
                // Nothing needed for this
            } else if (element.type === 'mark') {
                extensions.push(createConfigurableMark({
                    name: element.name,
                    attributes: createAttributes(schema, element.attrs, []),
                }))
            } else {
                console.error('Unknown element type ' + element.type);
            }
        }
        const doc = {};
        for (let uiSection of uiConfig.sections) {
            const section = schema.sections.filter((section) => { return section.name === uiSection.name; })[0];
            if (section) {
                const sect = {};
                if (section.type === 'text') {
                    if ((uiSection as UIConfigTextSection).headings) {
                        sect.headings = extractHeadings((teiDocument[section.name] as TEITextDocumentCollection).main, (uiSection as UIConfigTextSection).headings);
                    } else {
                        sect.headings = [];
                    }
                    sect.main = generateHTML((teiDocument[section.name] as TEITextDocumentCollection).main, extensions);
                    sect.nested = {};
                    if ((teiDocument[section.name] as TEITextDocumentCollection).nested) {
                        for (let [nestedKey, nestedDocs] of Object.entries((teiDocument[section.name] as TEITextDocumentCollection).nested)) {
                            sect.nested[nestedKey] = {};
                            for (let [nestedDocKey, nestedDoc] of Object.entries(nestedDocs)) {
                                sect.nested[nestedKey][nestedDocKey] = generateHTML(nestedDoc.doc, extensions);
                            }
                        }
                    }
                }
                doc[section.name] = sect;
            }
        }
        return doc;
    }
    return null;
});

const uniqueId = function() {
    let idCounter = 0;
    return function() {
        idCounter++;
        return idCounter.toString();
    }
}();

function extractHeadings(node: TEITextNode, schema: UIConfigHeading[]) {
    let headings = [];
    for (let heading of schema) {
        if (heading.name === node.type) {
            const headingEntry = {
                id: uniqueId(),
                label: node.attrs[heading.titleAttr],
                level: '',
            };
            if (heading.levelAttr) {
                headingEntry.level = node.attrs[heading.levelAttr];
            }
            headings.push(headingEntry);

            node.attrs['_tr-heading-id'] = headingEntry.id;
        }
    }
    for (let child of node.content) {
        headings = headings.concat(extractHeadings(child, schema));
    }
    return headings;
}
