export interface StringKeyValueDict {
    [x:string]: string;
}

export interface NumberKeyValueDict {
    [x:string]: number;
}

export interface AnyKeyValueDict {
    [x: string]: any;
}

export interface State {
    ui: StateUI;
    sections: StateSections;
    content: StateContent;
    callbacks: StateCallbacks;
}

export interface StateUI {
    mode: string;
    smallMenuOpen: boolean;
    selectedSection: string | null;
    sections: StateUISections;
    closeLabel: string | null;
}

export interface StateSections {
    [x: string]: any;
}

export interface StateContent {
    [x: string]: any;
}

export interface StateUISections {
    [x: string]: any;
}

export interface StateCallbacks {
    autoLoad?: (callback: (data: any) => {}) => {};
    close?: () => {};
}
export interface Config {
    sections: ConfigSections;
    ui: ConfigUI;
}

export interface ConfigSections {
    [x:string]: any;
}

export interface ConfigUI {
    closeLabel?: string;
}

export interface ConfigMetadataNodeSchema {

}

export interface MutationSetTextDoc {
    path: string;
    doc: any;
}

export interface MutationToggleAnnotation {
    path: string;
}

export interface MutationSetMetadata {
    path: string;
    metadata: MetadataNodeSet;
}

export interface MetadataNodeSet {
    [x: string]: MetadataNode;
}

export interface MetadataNode {
    [x: string]: MetadataNode;
}

export interface SerialisedNode {
    type: string;
    attrs?: SerialisedAttrs;
    content?: SerialisedNode[];
    marks?: SerialisedNodeMark[];
    text?: string;
    nestedDoc?: boolean;
}

export interface SerialisedAttrs {
    id?: string;
    [x: string]: string | boolean | number | undefined;
}

export interface SerialisedNodeMark {
    type: string;
    attrs?: SerialisedAttrs;
}

export interface NestedDocSet {
    [x: string]: NestedDocs;
}

export interface NestedDocs {
    [x: string]: SerialisedNode;
}

export interface TEITextParserConfig {
    label: string;
    type: 'Text';
    parser: ParseParserSchema;
    schema: ParseNodeSchema[];
}

export interface ParseNodeSchema {
    name: string;
    type: 'block' | 'inline' | 'nested' | 'mark';
    parser?: ParseParserSchema;
    parsers?: ParseParserSchema[];
    attrs?: ParseAttributesSchema;
}

export interface ParseAttributesSchema {
    [x: string]: ParseAttributeSchema;
}

export interface ParseAttributeSchema {
    parser?: ParseParserSchema;
    parsers?: ParseParserSchema[];
}

export interface ParseParserSchema {
    selector: string;
    type?: string;
    value?: string;
    text?: string;
}
