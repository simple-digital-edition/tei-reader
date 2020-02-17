<template>
    <main>
        <nav v-if="headings.length > 0" class="vertical">
            <ul>
                <li v-for="heading, idx in headings" :key="idx"><a v-html="heading.label" @click="navigateTo(heading.target)"></a></li>
            </ul>
        </nav>
        <article>
            <text-node v-if="doc" :section="section" :node="doc"/>
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
import { StringKeyValueDict } from '@interfaces';

@Component({
    components: {
        TextNode,
    },
})
export default class TextReader extends Vue {
    @Prop() section!: string;

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
        const nested = this.$store.state.content[this.$props.section].nested;
        return this.$store.state.ui.sections[this.$props.section].annotations.map((annotation) => {
            const annotationDoc = get(this.$store.state.content, annotation);
            if (annotationDoc) {
                return [annotation, annotationDoc.content[0]];
            } else {
                return null;
            }
        });
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

    public hideAnnotation(annotation: string) {
        this.$store.commit('toggleAnnotation', { path: annotation });
    }

    public navigateTo(heading: string) {
        const element = document.querySelector('[data-id="' + heading + '"]');
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
            });
        }
    }

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
