<template>
    <div class="tei-reader">
        <nav>
            <ul>
                <li>Book</li>
                <li>Notes</li>
                <li>Annotations</li>
            </ul>
        </nav>
        <main>
            <nav class="vertical">
                <ul>
                    <li>Heading 1</li>
                    <li>Heading 2</li>
                    <li>Heading 3</li>
                </ul>
            </nav>
            <article>
                <p>This is the main text</p>
                <aside>
                    <p>This is a footer</p>
                </aside>
            </article>
            <aside>
                <section>Annotations go here</section>
            </aside>
        </main>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class TeiReader extends Vue {
}
</script>
