<template>
    <main class="metadata-reader">
        <div v-if="isSmall && !isSmallMenuOpen" :class="isSmallMenuOpen ? 'small-menu-open' : null">
            <nav>
                <ul>
                    <li><a @click="toggleSmallMenu">&#x2630;</a></li>
                </ul>
            </nav>
            <nav class="vertical">
                <ul>
                    <li><a @click="toggleSmallMenu">{{ $store.state.sections[section].label }}</a></li>
                </ul>
            </nav>
        </div>
        <section v-for="group, idx in metadataGroups" :key="idx">
            <h2>{{ group.label }}</h2>
            <metadata-field v-for="entry, idx2 in group.entries" :key="idx2" :section="section" :config="entry" :parent="''"></metadata-field>
        </section>
    </main>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import MetadataField from './MetadataField.vue';

@Component({
    components: {
        MetadataField,
    },
})
export default class MetadataReader extends Vue {
    @Prop() section!: string;

    // ===================
    // Computed properties
    // ===================
    public get isSmall() {
        return this.$store.state.ui.mode === 'small';
    }

    public get isSmallMenuOpen() {
        return this.$store.state.ui.smallMenuOpen;
    }

    public get metadataGroups() {
        return this.$store.state.sections[this.$props.section].ui;
    }

    // ==============
    // Event handlers
    // ==============

    public toggleSmallMenu() {
        this.$store.commit('toggleSmallMenu');
    }
}
</script>
