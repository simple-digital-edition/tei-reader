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
export default class App extends Vue {
    public mounted() {
        const configElement = document.getElementById('TEIReaderConfig');
        if (configElement) {
            const config = JSON.parse(configElement.innerHTML);
            if (config) {
                this.$store.commit('init', config);
            }
        }
        if (this.$store.state.callbacks && this.$store.state.callbacks.autoLoad) {
            this.$store.state.callbacks.autoLoad((sourceData: string) => {
                this.$store.dispatch('load', sourceData);
            });
        }
    }
}
</script>

<style lang="scss">
.tei-reader {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    nav {
        flex: 0 0 auto;

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
        flex: 1 1 auto;
        display: flex;
        flex-direction: row;
        overflow: hidden;

        nav {
            flex: 0 0 auto;
            width: 15rem;
            overflow-y: auto;
        }

        article {
            flex: 1 1 auto;
            position: relative;
            overflow-y: auto;
            padding: 1rem;

            aside {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
            }
        }

        aside {
            flex: 0 0 auto;
            width: 15rem;
            padding: 0 1rem;
            overflow-y: auto;

            > section {
                position: relative;

                > a {
                    position: absolute;
                    right: 0.5rem;
                    top: 0;
                    z-index: 1;
                    cursor: pointer;
                    display: none;

                }

                &:hover {
                    > a {
                        display: block;
                    }
                }
            }
        }
    }
}
</style>
