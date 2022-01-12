/// <reference types="svelte" />

type UIConfig = {
    sections: UIConfigSection[];
};

type UIConfigSection = UIConfigTextSection | UIConfigMetadataSection;

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

type UIConfigMetadataSection = {
    name: string;
    type: 'metadata';
    label: string;
};
