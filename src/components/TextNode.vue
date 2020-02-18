<template>
    <a v-if="isReference" :class="'node-' + node.type" v-bind="nodeAttrs" @click="toggleReference">
        <span v-if="node.text">{{ node.text }}</span>
        <template v-for="child, idx in node.content">
            <span v-if="child.type === 'text'" :key="idx" :class="marks(child)" v-bind="markAttrs(child)">{{ child.text }}</span>
            <text-node v-else :key="idx" :section="section" :node="child"/>
        </template>
    </a>
    <span v-else-if="isInline" :class="'node-' + node.type" v-bind="nodeAttrs">
        <span v-if="node.text">{{ node.text }}</span>
        <template v-for="child, idx in node.content">
            <span v-if="child.type === 'text'" :key="idx" :class="marks(child)" v-bind="markAttrs(child)">{{ child.text }}</span>
            <text-node v-else :key="idx" :section="section" :node="child"/>
        </template>
    </span>
    <div v-else :class="'node-' + node.type" v-bind="nodeAttrs">
        <template v-for="child, idx in node.content">
            <span v-if="child.type === 'text'" :key="idx" :class="marks(child)" v-bind="markAttrs(child)">{{ child.text }}</span>
            <text-node v-else :key="idx" :section="section" :node="child"/>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StringKeyValueDict, SerialisedNode } from '@/interfaces';

@Component({
    name: 'text-node',
})
export default class TextNode extends Vue {
    @Prop() section!: string;
    @Prop() node!: SerialisedNode;

    public get isSmall() {
        return this.$store.state.ui.mode === 'small';
    }

    public get typeDef() {
        const schema = this.$store.state.sections[this.$props.section].schema;
        for(let idx = 0; idx < schema.length; idx++) {
            if (schema[idx].name === this.$props.node.type) {
                return schema[idx];
            }
        }
        return null;
    }

    public get nodeAttrs() {
        const attrs = {} as StringKeyValueDict;
        if (this.$props.node.attrs) {
            Object.entries(this.$props.node.attrs).forEach(([key, value]) => {
                if (value) {
                    attrs['data-' + key] = value as string;
                }
            });
        }
        return attrs;
    }

    public get isReference() {
        const type = this.typeDef;
        if (type && type.reference) {
            return true;
        } else {
            return false;
        }
    }

    public get isInline() {
        const type = this.typeDef;
        if (type && type.type === 'inline') {
            return true;
        } else {
            return false;
        }
    }

    public marks(node: SerialisedNode) {
        if (node.marks) {
            return node.marks.map((mark) => { return 'mark-' + mark.type; });
        }
        return [];
    }

    public markAttrs(node: SerialisedNode) {
        if (node.marks) {
            const attrs = {} as StringKeyValueDict;
            node.marks.forEach((mark) => {
                if (mark.attrs) {
                    Object.entries(mark.attrs).forEach(([key, value]) => {
                        if (value) {
                            attrs['data-' + key] = value as string;
                        }
                    });
                }
            });
            return attrs;
        }
        return {};
    }

    public toggleReference() {
        const type = this.typeDef;
        if (type && this.isReference && this.$props.node.attrs[type.reference.attr]) {
            if (!this.isSmall && type.reference.display === 'sidebar') {
                this.$store.commit('toggleAnnotation', {
                    path: this.$props.section + '.nested.' + type.reference.type + '.' + this.$props.node.attrs[type.reference.attr].substring(1),
                });
            } else {
                this.$store.commit('toggleFootnote', {
                    path: this.$props.section + '.nested.' + type.reference.type + '.' + this.$props.node.attrs[type.reference.attr].substring(1),
                });
            }
        }
    }
}
</script>
