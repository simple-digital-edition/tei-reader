<template>
    <main class="nested-list-reader">
        <div v-if="isSmall && !isSmallMenuOpen" :class="isSmallMenuOpen ? 'small-menu-open' : null">
            <nav class="main">
                <ul>
                    <li><a @click="toggleSmallMenu">&#x2630;</a></li>
                </ul>
            </nav>
            <nav class="main vertical">
                <ul>
                    <li><a @click="toggleSmallMenu">{{ $store.state.sections[section].label }}</a></li>
                </ul>
            </nav>
        </div>
        <article>
            <div v-scroll="scrollReader" v-html="text" @click="textClick"></div>
        </article>
    </main>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { NumberKeyValueDict, SerialisedNode, AnyKeyValueDict } from '@/interfaces';
// eslint-disable-next-line
// @ts-ignore
import { tween } from 'femtotween';

@Component({
    components: {
    },
})
export default class NestedListReader extends Vue {
    @Prop() section!: string;

    activeHeading: string | null = '';

    // ===================
    // Computed properties
    // ===================
    public get isSmall() {
        return this.$store.state.ui.mode === 'small';
    }

    public get isSmallMenuOpen() {
        return this.$store.state.ui.smallMenuOpen;
    }

    public get sectionData() {
        return this.$store.state.sections[this.$props.section];
    }

    public get docs(): {[x: string]: SerialisedNode} | null {
        const sectionData = this.$store.state.content[this.sectionData.source];
        if (sectionData && sectionData.nested && sectionData.nested[this.sectionData.nodeName]) {
            return sectionData.nested[this.sectionData.nodeName];
        } else {
            return null;
        }
    }

    public get schema() {
        return this.$store.state.sections[this.sectionData.source].schema;
    }

    public get text() {
        if (this.docs) {
            let lines = ['<ol>'];
            Object.entries(this.docs).forEach(([id, node]) => {
                if (node.content && node.content.length > 0) {
                    lines.push('<li id="' + id + '">');
                    lines = lines.concat(this.generateHTML(node.content[0], this.schema));
                    lines.push('</li>');
                }
            });
            lines.push('</ol>');
            return lines.join('');
        } else {
            return null;
        }
    }

    // ==================
    // Lifecycle handlers
    // ==================

    public mounted() {
        this.docUpdated();
    }

    // ==============
    // Event handlers
    // ==============

    public toggleSmallMenu() {
        this.$store.commit('toggleSmallMenu');
    }

    public scrollReader(ev: UIEvent, scroll: NumberKeyValueDict) {
        if (this && this.$el) {
            const teiReaderSrc = window.localStorage.getItem('tei-reader');
            let teiReader = {} as AnyKeyValueDict;
            if (teiReaderSrc) {
                teiReader = JSON.parse(teiReaderSrc);
            }
            if (!teiReader[this.$store.state.ui.identifier]) {
                teiReader[this.$store.state.ui.identifier] = {};
            }
            if (!teiReader[this.$store.state.ui.identifier][this.$props.section]) {
                teiReader[this.$store.state.ui.identifier][this.$props.section] = 0;
            }
            teiReader[this.$store.state.ui.identifier][this.$props.section] = scroll.scrollTop;
            window.localStorage.setItem('tei-reader', JSON.stringify(teiReader));
        }
    }

    public textClick(ev: MouseEvent) {
        let target = ev.target as HTMLElement;
        while (target) {
            if (target.localName === 'a') {
                break;
            }
            target = target.parentElement as HTMLElement;
        }
        const referencePath = target.getAttribute('data-reference-path');
        if (target && referencePath) {
            const path = referencePath.split('.');
            if (path.length > 0 && path[0] === this.sectionData.source && path[2] == this.sectionData.nodeName) {
                const container = this.$el.querySelector('article > div') as HTMLElement;
                const element = this.$el.querySelector('#' + path[3]) as HTMLElement;
                if (container && element) {
                    tween(container.scrollTop, element.offsetTop, (value: number) => { container.scrollTop = value; });
                }
            }
        }
    }

    // =======
    // Watches
    // =======

    @Watch('doc')
    public docUpdated() {
        const container = this.$el.querySelector('article > div') as HTMLElement;
        container.scrollTop = 0;
        if (window.localStorage && this.$store.state.ui.identifier && this.$props.section) {
            const teiReaderSrc = window.localStorage.getItem('tei-reader');
            let teiReader = {} as AnyKeyValueDict;
            if (teiReaderSrc) {
                teiReader = JSON.parse(teiReaderSrc);
            }
            if (!teiReader[this.$store.state.ui.identifier]) {
                teiReader[this.$store.state.ui.identifier] = {};
            }
            if (!teiReader[this.$store.state.ui.identifier][this.$props.section]) {
                teiReader[this.$store.state.ui.identifier][this.$props.section] = 0;
            }
            const container = this.$el.querySelector('article > div') as HTMLElement;
            Vue.nextTick(() => {
                container.scrollTop = teiReader[this.$store.state.ui.identifier][this.$props.section];
            });
            window.localStorage.setItem('tei-reader', JSON.stringify(teiReader));
        }
    }

    // ===============
    // Private methods
    // ===============

    private nodeSchema(name: string, schema: any) {
        for (let idx = 0; idx < schema.length; idx++) {
            if (schema[idx].name === name) {
                return schema[idx];
            }
        }
        return null;
    }

    private getText(node: SerialisedNode): string {
        if (node.type === 'text' && node.text) {
            return node.text;
        } else {
            if (node.content) {
                return node.content.map((child) => { return this.getText(child); }).join('');
            } else {
                return '';
            }
        }
    }

    private generateHTML(node: SerialisedNode, schema: any) {
        let textElements = [] as string[];
        if (node) {
            const nodeSchema = this.nodeSchema(node.type, schema);
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
                    if (node.attrs && nodeSchema.reference && nodeSchema.reference.attr && node.attrs[nodeSchema.reference.attr]) {
                        textElements.push(' data-reference-path="' + this.$props.section + '.nested.' + nodeSchema.reference.type + '.' + (node.attrs[nodeSchema.reference.attr] as string).substring(1) + '"');
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
                    textElements.push('>');
                }
                if (node.text) {
                    textElements.push(node.text);
                }
                if (node.content) {
                    for (let idx = 0; idx < node.content.length; idx++) {
                        const tmpElements = this.generateHTML(node.content[idx], schema);
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
                        const tmpElements = this.generateHTML(node.content[idx], schema);
                        textElements = textElements.concat(tmpElements);
                    }
                }
            }
        }
        return textElements;
    }
}
</script>
