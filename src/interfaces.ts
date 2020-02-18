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
}
export interface Config {
    sections: ConfigSections;
}

export interface ConfigSections {
    [x:string]: any;
}

export interface MutationSetTextDoc {
    path: string;
    doc: any;
}

export interface MutationToggleAnnotation {
    path: string;
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
