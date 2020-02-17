<template>
    <main>
        <nav v-if="headings.length > 0" class="vertical">
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
        <aside v-if="hasNestedDocs">
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
import { StringKeyValueDict, NumberKeyValueDict } from '@interfaces';

@Component({
    components: {
        TextNode,
    },
})
export default class TextReader extends Vue {
    @Prop() section!: string;

    activeHeading = '';

    // ================
    // Lifecycle events
    // ================

    // ===================
    // Computed properties
    // ===================

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
        return this.$store.state.ui.sections[this.$props.section].annotations.map((annotation) => {
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
            const cache = {} as StringKeyValueDict;
            return this.doc.content.map((node) => {
                if (!cache[node.type]) {
                    cache[node.type] = 'false';
                    for(let idx = 0; idx < schema.length; idx++) {
                        if (schema[idx].name === node.type) {
                            if (schema[idx].navigation) {
                                cache[node.type] = 'true';
                            }
                        }
                    }
                }
                if (cache[node.type] === 'true') {
                    return {
                        target: node.attrs['id'],
                        label: this.getText(node),
                    };
                } else {
                    return null;
                }
            }).filter((node) => { return node });
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
        const element = document.querySelector('[data-id="' + heading + '"]');
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
            });
        }
    }

    public scrollReader(ev: UIEvent, scroll: NumberKeyValueDict) {
        const headings = this.$el.querySelectorAll(this.headings.map((heading: StringKeyValueDict) => { return '[data-id="' + heading.target + '"]' }).join(', '));
        if (headings.length > 0) {
            this.activeHeading = '';
            if (scroll.scrollTop > 0) {
                scroll.scrollTop = scroll.scrollTop + this.$el.querySelector('article').clientHeight * 0.25;
            }
            for (let idx = 0; idx < headings.length; idx++) {
                if (idx < headings.length - 1) {
                    if (scroll.scrollTop >= headings[idx].offsetTop && scroll.scrollTop < headings[idx + 1].offsetTop) {
                        this.activeHeading = headings[idx].getAttribute('data-id');
                    }
                } else {
                    if (scroll.scrollTop >= headings[idx].offsetTop) {
                        this.activeHeading = headings[idx].getAttribute('data-id');
                    }
                }
            }
        }
    }

    // ===============
    // Private methods
    // ===============

    private getText(node: any) {
        if (node.type === 'text') {
            return node.text;
        } else {
            if (node.content) {
                return node.content.map((child) => { return this.getText(child); }).join('');
            } else {
                return '';
            }
        }
    }
}
</script>
