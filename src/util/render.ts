import { SerialisedNode } from '@/interfaces';

function getNodeSchema(name: string, schema: any) {
    for (let idx = 0; idx < schema.length; idx++) {
        if (schema[idx].name === name) {
            return schema[idx];
        }
    }
    return null;
}

export function renderHTML(node: SerialisedNode, schema: any, section: string) {
    let textElements = [] as string[];
    if (node) {
        const nodeSchema = getNodeSchema(node.type, schema);
        if (nodeSchema) {
            if (nodeSchema.name === 'text') {
                if (node.marks) {
                    textElements.push('<span class="');
                    node.marks.forEach((mark, idx) => {
                        if (idx > 0) {
                            textElements.push(' mark-' + mark.type);
                        } else {
                            textElements.push('mark-' + mark.type);
                        }
                    });
                    textElements.push('"');
                    node.marks.forEach((mark) => {
                        if (mark.attrs) {
                            Object.entries(mark.attrs).forEach(([key, value]) => {
                                textElements.push(' data-' + key + '="' + value + '"');
                            });
                        }
                    });
                    textElements.push('>');
                }
            } else if (nodeSchema.reference) {
                textElements.push('<a class="node-' + node.type + '"');
                if (node.attrs) {
                    Object.entries(node.attrs).forEach(([key, value]) => {
                        textElements.push(' data-' + key + '="' + value + '"');
                    });
                }
                if (node.attrs && nodeSchema.reference && nodeSchema.reference.external && node.attrs[nodeSchema.reference.external]) {
                    textElements.push(' href="' + node.attrs[nodeSchema.reference.external] + '" target="_blank"');
                }
                if (node.attrs && nodeSchema.reference && nodeSchema.reference.attr && node.attrs[nodeSchema.reference.attr]) {
                    textElements.push(' data-reference-path="' + section + '.nested.' + nodeSchema.reference.type + '.' + node.attrs[nodeSchema.reference.attr] + '"');
                    textElements.push(' data-reference-mode="' + nodeSchema.reference.display + '"');
                }
                textElements.push('>');
            } else if (nodeSchema.type === 'inline') {
                textElements.push('<span class="node-' + node.type + '"');
                if (node.attrs) {
                    Object.entries(node.attrs).forEach(([key, value]) => {
                        textElements.push(' data-' + key + '="' + value + '"');
                    });
                }
                textElements.push('>');
            } else {
                textElements.push('<div class="node-' + node.type + '"');
                if (node.attrs) {
                    Object.entries(node.attrs).forEach(([key, value]) => {
                        textElements.push(' data-' + key + '="' + value + '"');
                    });
                }
                if (nodeSchema.navigation) {
                    textElements.push(' data-navigation-attr="' + nodeSchema.navigation.attr.toLowerCase() + '"');
                }
                textElements.push('>');
            }
            if (node.text) {
                textElements.push(node.text);
            }
            if (node.content) {
                for (let idx = 0; idx < node.content.length; idx++) {
                    const tmpElements = renderHTML(node.content[idx], schema, section);
                    textElements = textElements.concat(tmpElements);
                }
            }
            if (nodeSchema.name === 'text') {
                if (node.marks) {
                    textElements.push('</span>');
                }
            } else if (nodeSchema.reference) {
                textElements.push('</a>');
            } else if (nodeSchema.type === 'inline') {
                textElements.push('</span>');
            } else {
                textElements.push('</div>');
            }
        } else if (node.type === 'doc') {
            if (node.content) {
                for (let idx = 0; idx < node.content.length; idx++) {
                    const tmpElements = renderHTML(node.content[idx], schema, section);
                    textElements = textElements.concat(tmpElements);
                }
            }
        }
    }
    return textElements;
}
