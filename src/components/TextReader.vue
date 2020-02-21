<template>
    <main class="text-reader">
        <div v-if="isSmall && headings.length > 0" :class="isSmallMenuOpen ? 'small-menu-open' : null">
            <nav>
                <ul>
                    <li><a @click="toggleSmallMenu">&#x2630;</a></li>
                </ul>
            </nav>
            <nav class="vertical">
                <ul>
                    <template v-for="heading, idx in headings">
                        <li v-if="heading.target === activeHeading || (!activeHeading && idx === 0) || isSmallMenuOpen" :key="idx"><a v-html="heading.label" :aria-checked="heading.target === activeHeading ? 'true' : 'false'" @click="isSmallMenuOpen ? navigateTo(heading.target) : toggleSmallMenu()"></a></li>
                    </template>
                </ul>
            </nav>
        </div>
        <nav v-if="!isSmall && headings.length > 0" class="vertical">
            <ul>
                <li v-for="heading, idx in headings" :key="idx"><a v-html="heading.label" :aria-checked="heading.target === activeHeading ? 'true' : 'false'" @click="navigateTo(heading.target)"></a></li>
            </ul>
        </nav>
        <article>
            <div v-scroll="scrollReader">
                <text-node v-if="doc" :section="section" :node="doc"/>
            </div>
            <aside v-if="footnote">
                <a @click="hideFootnote(footnote[0])">&#x2716;</a>
                <text-node :section="section" :node="footnote[1]"></text-node>
            </aside>
        </article>
        <aside v-if="!isSmall && hasNestedDocs">
            <section v-for="[annotationId, annotation], idx in annotations" :key="idx">
                <a @click="hideAnnotation(annotationId)">&#x2716;</a>
                <text-node v-if="annotation" :section="section" :node="annotation"></text-node>
            </section>
        </aside>
    </main>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import TextNode from './TextNode.vue';
import get from '@/util/get';
import { StringKeyValueDict, NumberKeyValueDict, SerialisedNode } from '@/interfaces';
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

    public get hasNestedDocs() {
        if (this.$store.state.content[this.$props.section].nested) {
            if (Object.keys(this.$store.state.content[this.$props.section].nested).length > 0) {
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
            this.walkTreeForHeadings(this.doc, schema, headings)
            return headings;
        }
        return [];
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

    public navigateTo(heading: string) {
        const element = document.querySelector('[data-id="' + heading + '"]') as HTMLElement;
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
            const headings = this.$el.querySelectorAll(this.headings.map((heading: StringKeyValueDict) => { return '[data-id="' + heading.target + '"]' }).join(', '));
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
                            this.activeHeading = heading.getAttribute('data-id');
                        }
                    } else {
                        if (scroll.scrollTop >= heading.offsetTop) {
                            this.activeHeading = heading.getAttribute('data-id');
                        }
                    }
                }
            }
        }
    }

    // ===============
    // Private methods
    // ===============

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

    private walkTreeForHeadings(node: SerialisedNode, schema: any, headings: StringKeyValueDict[]) {
        if (node) {
            for (let idx = 0; idx < schema.length; idx++) {
                if (schema[idx].name === node.type && schema[idx].navigation && node.attrs && node.attrs[schema[idx].navigation.attr]) {
                    headings.push({
                        target: node.attrs[schema[idx].navigation.attr] as string,
                        label: this.getText(node),
                    });
                }
            }
            if (node.content) {
                for (let idx = 0; idx < node.content.length; idx++) {
                    this.walkTreeForHeadings(node.content[idx], schema, headings)
                }
            }
        }
    }
}
</script>
