/// <reference types="svelte" />

type UIConfig = {
    sections: UIConfigSection[];
};

type UIConfigSection = UIConfigTextSection | UIConfigNestedListSection | UIConfigMetadataSection;

type UIConfigTextSection = {
    name: string;
    type: 'text';
    label: string;
    links?: UIConfigLink[];
    footnotes?: UIConfigFootnote[];
    headings?: UIConfigHeading[];
};

type UIConfigLink = {
    name: string;
    attr: string;
};

type UIConfigFootnote = {
    name: string;
    targetName: string;
    attr: string;
};

type UIConfigHeading = {
    name: string;
    titleAttr: string;
    levelAttr?: string;
};

type UIConfigNestedListSection = {
    name: string;
    type: 'nestedList';
    label: string;
    sectionName: string;
    nestedName: string;
    sort?: 'alphabetical' | 'id' | 'page-line';
}
type UIConfigMetadataSection = {
    name: string;
    type: 'metadata';
    label: string;
};
