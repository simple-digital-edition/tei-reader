<template>
  <div id="app">
    <TeiReader/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import TeiReader from './components/TeiReader.vue';

@Component({
  components: {
    TeiReader,
  },
})
export default class App extends Vue {}
</script>

<style lang="scss">
.tei-reader {
    nav {
        > ul {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: row;

            > li {
                list-style-type: none;
                margin: 0;
                padding: 0;
                flex: 0 0 auto;
            }
        }

        &.vertical {
            ul {
                flex-direction: column;
            }
        }
    }

    main {
        display: flex;
        flex-direction: row;

        nav {
            flex: 0 0 auto;
            width: 10rem;
        }

        article {
            flex: 1 1 auto;
            position: relative;

            aside {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
            }
        }

        aside {
            flex: 0 0 auto;
            width: 10rem;
        }
    }
}
</style>
