import XPathEvaluator from './XPathEvaluator';
import { SerialisedNode, NestedDocSet, SerialisedAttrs, ParseAttributesSchema, ParseParserSchema, TEITextParserConfig,
    ParseNodeSchema, SerialisedNodeMark } from '@/interfaces';

export default class TEITextParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private config: TEITextParserConfig;
    private doc: SerialisedNode | null = null;
    private nestedDocs: NestedDocSet = {} as NestedDocSet;

    constructor(dom: XMLDocument, config: TEITextParserConfig) {
        this.dom = dom;
        this.xpath = new XPathEvaluator(this.dom);
        this.config = config;
    }

    public get(): [SerialisedNode, NestedDocSet] {
        if (!this.doc) {
            this.doc = {
                type: 'doc',
                content: [],
            };
            this.nestedDocs = {};
            if (this.config.parser && this.config.parser.selector) {
                const node = this.xpath.firstNode(this.dom.documentElement, this.config.parser.selector) as Element;
                if (node) {
                    for(let idx = 0; idx < node.children.length; idx++) {
                        const tmp = this.parseContentNode(node.children[idx], this.config);
                        if (tmp && !tmp.nestedDoc && this.doc.content) {
                            this.doc.content.push(tmp);
                        } else if (tmp && tmp.nestedDoc) {
                            this.addNestedDoc(tmp);
                        }
                    }
                }
            }
        }
        return [this.doc, this.nestedDocs];
    }

    private parseContentAttributes(node: Element, attrs: ParseAttributesSchema) {
        // Parse attributes for nodes or marks. Attributes can have a type which is boolean, number, static, or string (default).
        const result = {} as SerialisedAttrs;
        Object.entries(attrs).forEach(([key, schema]) => {
            let parsers = [] as ParseParserSchema[];
            if (schema.parser) {
                parsers.push(schema.parser);
            } else if (schema.parsers) {
                parsers = schema.parsers;
            }
            for (let idx = 0; idx < parsers.length; idx++) {
                const parser = parsers[idx];
                if (parser.type === 'boolean') {
                    result[key] = this.xpath.booleanValue(node, parser.selector);
                } else if (parser.type === 'number') {
                    try {
                        result[key] = this.xpath.numberValue(node, parser.selector);
                    } catch(e) {
                        // eslint-disable-next-line
                        console.log(e);
                    }
                } else if (parser.type === 'static') {
                    if (this.xpath.booleanValue(node, parser.selector)) {
                        result[key] = parser.value;
                    }
                } else {
                    try {
                        const value = this.xpath.stringValue(node, parser.selector);
                        if (value) {
                            result[key] = value;
                        }
                    } catch(e) {
                        // eslint-disable-next-line
                        console.log(e);
                    }
                }
            }
        });
        return result;
    }

    private parseContentMarks(node: Element, schema: ParseNodeSchema[]) {
        // Parse the marks of a text node
        const result = [] as SerialisedNodeMark[];
        schema.forEach((entry: ParseNodeSchema) => {
            if (entry.type === 'mark') {
                let parsers = [] as ParseParserSchema[];
                if (entry.parser) {
                    parsers.push(entry.parser);
                } else if (entry.parsers) {
                    parsers = entry.parsers;
                }
                for (let idx = 0; idx < parsers.length; idx++) {
                    if (this.xpath.booleanValue(node, parsers[idx].selector)) {
                        const mark = {
                            type: entry.name
                        } as SerialisedNodeMark;
                        if (entry.attrs) {
                            mark.attrs = this.parseContentAttributes(node, entry.attrs);
                        }
                        result.push(mark);
                    }
                }
            }
        });
        return result;
    }

    private parseContentNode(node: Element, section: TEITextParserConfig) {
        // Parse a single content node
        const entries = Object.entries(section.schema);
        for (let idx = 0; idx < entries.length; idx++) {
            //let key = entries[idx][0];
            const nodeSchema = entries[idx][1] as ParseNodeSchema;
            let parsers = [] as ParseParserSchema[];
            if (nodeSchema.parser) {
                parsers.push(nodeSchema.parser);
            } else if (nodeSchema.parsers) {
                parsers = parsers.concat(nodeSchema.parsers);
            }
            for (let idx2 = 0; idx2 < parsers.length; idx2++) {
                const parser = parsers[idx2];
                if (this.xpath.firstNode(node, 'self::' + parser.selector) !== null) {
                    // The first schema node where the parser selector matches is chosen as the result
                    const result = {
                        type: nodeSchema.name
                    } as SerialisedNode;
                    if (nodeSchema.attrs) {
                        result.attrs = this.parseContentAttributes(node, nodeSchema.attrs);
                    }
                    if (nodeSchema.type === 'nested') {
                        result.nestedDoc = true;
                    }
                    if (nodeSchema.type === 'inline') {
                        // Inline nodes are either loaded as text nodes with marks or as complex text nodes
                        if (nodeSchema.name === 'text') {
                            if (parser.text) {
                                result.text = this.xpath.stringValue(node, parser.text);
                            }
                            result.marks = this.parseContentMarks(node, section.schema);
                            if (node.children.length === 1) {
                                const temp = this.parseContentNode(node.children[0], section);
                                if (temp && temp.text && temp.text !== '') {
                                    result.text = temp.text;
                                }
                                if (temp && temp.marks) {
                                    result.marks = result.marks.concat(temp.marks);
                                }
                            }
                        } else {
                            if (node.children.length === 0) {
                                // Inline nodes without children need a virtual text node added if they have text
                                if (parser.text && this.xpath.stringValue(node, parser.text)) {
                                    result.content = [
                                        {
                                            type: 'text',
                                            text: this.xpath.stringValue(node, parser.text),
                                            marks: this.parseContentMarks(node, section.schema)
                                        }
                                    ];
                                }
                            } else {
                                const content = [];
                                for (let idx3 = 0; idx3 < node.children.length; idx3++) {
                                    const child = this.parseContentNode(node.children[idx3], section);
                                    if (child) {
                                        content.push(child);
                                    }
                                }
                                result.content = content;
                            }
                        }
                    } else {
                        const content = [];
                        for (let idx3 = 0; idx3 < node.children.length; idx3++) {
                            const child = this.parseContentNode(node.children[idx3], section);
                            if (child && !child.nestedDoc) {
                                content.push(child);
                            } else if (child && child.nestedDoc) {
                                this.addNestedDoc(child);
                            }
                        }
                        result.content = content;
                    }
                    return result;
                }
            }
        }
        return null;
    }

    private addNestedDoc(nestedParent: SerialisedNode) {
        if (nestedParent.attrs && nestedParent.attrs.id) {
            if (!this.nestedDocs[nestedParent.type]) {
                this.nestedDocs[nestedParent.type] = {};
            }
            this.nestedDocs[nestedParent.type][nestedParent.attrs.id] = nestedParent;
            const nestedDoc = {
                type: 'doc',
                content: nestedParent.content,
            }
            nestedParent.content = [nestedDoc];
        }
    }
}
