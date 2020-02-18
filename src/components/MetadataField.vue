<template>
    <div>
        <template v-if="config.type == 'single-text'">
            <span class="field">
                <span class="label">{{ config.label }}</span>
                <span class="value">{{ value }}</span>
            </span>
        </template>
        <template v-if="config.type == 'multi-row'">
            <ol class="multi-row">
                <li v-for="(data, idx) in value" :key="idx">
                    <metadata-field v-for="(entry, idx2) in config.entries" :section="section" :config="entry" :parent="parent + config.path + '.[' + idx + ']'" :key="idx2"/>
                </li>
            </ol>
        </template>
        <template v-if="config.type == 'multi-field'">
            <ol class="multi-field">
                <li v-for="(entry, idx) in config.entries" :key="idx">
                    <metadata-field :section="section" :config="entry" :parent="parent + config.path"/>
                </li>
            </ol>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import get from '@/util/get';
import { ConfigMetadataNodeSchema } from '@/interfaces';

@Component({
    name: 'metadata-field',
})
export default class MetadataField extends Vue {
    @Prop() config!: ConfigMetadataNodeSchema;
    @Prop() section!: string;
    @Prop() parent!: string;

    public get value() {
        const value = get(this.$store.state.content[this.$props.section], this.$props.parent + this.$props.config.path);
        if (value) {
            return value;
        } else {
            return '';
        }
    }
}
</script>
