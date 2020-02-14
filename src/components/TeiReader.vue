<template>
    <div class="tei-reader">
        <nav>
            <ul role="menubar">
                <li v-for="value, key in sections" :key="key" role="presentation">
                    <a role="menuitem" v-html="value.label" @click="selectSection(key)" :aria-checked="key === selectedSection ? 'true' : 'false'"></a>
                </li>
            </ul>
        </nav>
        <template v-for="value, key in sections">
            <text-reader v-if="key === selectedSection && value.type === 'TextReader'" :key="key" :section="key"></text-reader>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import TextReader from './TextReader.vue';

@Component({
    components: {
        TextReader,
    },
})
export default class TeiReader extends Vue {
    public get sections() {
        return this.$store.state.sections;
    }

    public get selectedSection() {
        return this.$store.state.ui.selectedSection;
    }

    public selectSection(key: string) {
        this.$store.commit('selectSection', key);
    }
}
</script>
