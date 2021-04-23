<template>
    <main class="text-reader">
        <div v-if="isSmall && (!isSmallMenuOpen || headings.length > 0)" :class="isSmallMenuOpen ? 'small-menu-open' : null">
            <nav class="main">
                <ul>
                    <li><a @click="toggleSmallMenu">&#x2630;</a></li>
                </ul>
            </nav>
            <nav v-if="headings.length > 0" class="main vertical">
                <ul>
                    <template v-for="heading, idx in headings">
                        <li v-if="heading.target === activeHeading || (!activeHeading && idx === 0) || isSmallMenuOpen" :key="idx"><a v-html="heading.label" :aria-checked="heading.target === activeHeading ? 'true' : 'false'" @click="isSmallMenuOpen ? navigateTo(heading) : toggleSmallMenu()"></a></li>
                    </template>
                </ul>
            </nav>
            <nav v-else class="main">
                <ul>
                    <li><a @click="toggleSmallMenu">{{ $store.state.sections[section].label }}</a></li>
                </ul>
            </nav>
        </div>
        <nav v-if="!isSmall && headings.length > 0" class="headings vertical">
            <ul>
                <li v-for="heading, idx in headings" :key="idx"><a v-html="heading.label" :aria-checked="heading.target === activeHeading ? 'true' : 'false'" @click="navigateTo(heading)"></a></li>
            </ul>
        </nav>
        <article>
            <div v-scroll="scrollReader" v-html="text" @click="textClick"></div>
            <aside v-if="footnote">
                <a @click="hideFootnote(footnote[0])">&#x2716;</a>
                <text-node :section="section" :node="footnote[1]"></text-node>
            </aside>
        </article>
        <aside v-if="!isSmall && hasSidebarAnnotations">
            <section v-for="[annotationId, annotation], idx in annotations" :key="idx">
                <a @click="hideAnnotation(annotationId)">&#x2716;</a>
                <text-node v-if="annotation" :section="section" :node="annotation"></text-node>
            </section>
        </aside>
    </main>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import TextNode from './TextNode.vue';
import get from '@/util/get';
import { StringKeyValueDict, NumberKeyValueDict, SerialisedNode, AnyKeyValueDict } from '@/interfaces';
// eslint-disable-next-line
// @ts-ignore
import { tween } from 'femtotween';

@Component({
    components: {
        TextNode,
    },
})
export default class TextReader extends Vue {
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

    public get doc() {
        const sectionData = this.$store.state.content[this.$props.section];
        if (sectionData && sectionData.doc) {
            return sectionData.doc;
        } else {
            return null;
        }
    }

    public get hasSidebarAnnotations(): boolean {
        const schema = this.$store.state.sections[this.$props.section].schema;
        for (let idx = 0; idx < schema.length; idx++) {
            if (schema[idx].reference && schema[idx].reference.display === 'sidebar') {
                return true;
            }
        }
        return false;
    }

    public get annotations() {
        return this.$store.state.ui.sections[this.$props.section].annotations.map((annotation: string) => {
            const annotationDoc = get(this.$store.state.content, annotation);
            if (annotationDoc) {
                return [annotation, annotationDoc.content[0]];
            } else {
                return null;
            }
        });
    }

    public get footnote() {
        const footnote = this.$store.state.ui.sections[this.$props.section].footnote;
        if (footnote) {
            const footnoteDoc = get(this.$store.state.content, footnote);
            if (footnoteDoc) {
                return [footnote, footnoteDoc.content[0]];
            }
        }
        return null;
    }

    public get headings() {
        if (this.doc) {
            const schema = this.$store.state.sections[this.$props.section].schema;
            const headings = [] as StringKeyValueDict[];
            this.generateHeadings(this.doc, schema, headings)
            return headings;
        }
        return [];
    }

    public get schema() {
        return this.$store.state.sections[this.$props.section].schema;
    }

    public get text() {
        return this.generateHTML(this.doc, this.schema).join('');
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

    public hideAnnotation(annotation: string) {
        this.$store.commit('toggleAnnotation', { path: annotation });
    }

    public hideFootnote(annotation: string) {
        this.$store.commit('toggleFootnote', { path: annotation });
    }

    public navigateTo(heading: StringKeyValueDict) {
        const element = document.querySelector('[data-' + heading.attr + '="' + heading.target + '"]') as HTMLElement;
        if (element) {
            const container = this.$el.querySelector('article > div') as HTMLElement;
            if (container) {
                tween(container.scrollTop, element.offsetTop, (value: number) => { container.scrollTop = value; });
            }
        }
        if (this.isSmallMenuOpen) {
            this.toggleSmallMenu();
        }
    }

    public toggleSmallMenu() {
        this.$store.commit('toggleSmallMenu');
    }

    public scrollReader(ev: UIEvent, scroll: NumberKeyValueDict) {
        if (this && this.$el) {
            // Store scroll
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
            // Update Headings
            const headings = Array.prototype.slice.call(this.$el.querySelectorAll('[data-navigation-attr]')).filter((heading: HTMLElement) => {
                return heading.getAttribute('data-' + heading.getAttribute('data-navigation-attr'));
            });
            if (headings.length > 0) {
                this.activeHeading = null;
                if (scroll.scrollTop > 0) {
                    const article = this.$el.querySelector('article');
                    if (article) {
                        scroll.scrollTop = scroll.scrollTop + article.clientHeight * 0.25;
                    }
                }
                for (let idx = 0; idx < headings.length; idx++) {
                    const heading = headings[idx] as HTMLElement;
                    if (idx < headings.length - 1) {
                        const nextHeading = headings[idx + 1] as HTMLElement;
                        if (scroll.scrollTop >= heading.offsetTop && scroll.scrollTop < nextHeading.offsetTop) {
                            this.activeHeading = heading.getAttribute('data-' + heading.getAttribute('data-navigation-attr'));
                        }
                    } else {
                        if (scroll.scrollTop >= heading.offsetTop) {
                            this.activeHeading = heading.getAttribute('data-' + heading.getAttribute('data-navigation-attr'));
                        }
                    }
                }
            }
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
        if (target && target.getAttribute('data-reference-path')) {
            if (target.getAttribute('data-reference-mode') === 'sidebar') {
                if (this.$store.state.ui.mode === 'small') {
                    this.$store.commit('toggleFootnote', { path: target.getAttribute('data-reference-path') });
                } else {
                    this.$store.commit('toggleAnnotation', { path: target.getAttribute('data-reference-path') });
                }
            } else if (target.getAttribute('data-reference-mode') === 'footnote') {
                this.$store.commit('toggleFootnote', { path: target.getAttribute('data-reference-path') });
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

    private generateHeadings(node: SerialisedNode, schema: any, headings: StringKeyValueDict[]) {
        if (node) {
            for (let idx = 0; idx < schema.length; idx++) {
                if (schema[idx].name === node.type && schema[idx].navigation && node.attrs && node.attrs[schema[idx].navigation.attr]) {
                    headings.push({
                        attr: schema[idx].navigation.attr,
                        target: node.attrs[schema[idx].navigation.attr] as string,
                        label: this.getText(node),
                    });
                }
            }
            if (node.content) {
                for (let idx = 0; idx < node.content.length; idx++) {
                    this.generateHeadings(node.content[idx], schema, headings)
                }
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
                    if (node.attrs && nodeSchema.reference && nodeSchema.reference.external && node.attrs[nodeSchema.reference.external]) {
                        textElements.push(' href="' + node.attrs[nodeSchema.reference.external] + '" target="_blank"');
                    }
                    if (node.attrs && nodeSchema.reference && nodeSchema.reference.attr && node.attrs[nodeSchema.reference.attr]) {
                        textElements.push(' data-reference-path="' + this.$props.section + '.nested.' + nodeSchema.reference.type + '.' + node.attrs[nodeSchema.reference.attr] + '"');
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
