<template>
  <div id="app" :class="'mode-' + this.$store.state.ui.mode">
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
        this.updateWindowSize();
        window.addEventListener('resize', this.updateWindowSize);
    }

    public beforeDestroy() {
        window.removeEventListener('resize', this.updateWindowSize);
    }

    public updateWindowSize() {
        if (window.innerWidth < 1024) {
            this.$store.commit('setMode', 'small');
        } else {
            this.$store.commit('setMode', 'large');
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

    .metadata-reader {
        > div {
            flex: 0 0 auto;
            display: flex;
            flex-direction: row;

            > nav:first-child {
                flex: 0 0 auto;
            }

            > nav:last-child {
                flex: 1 1 auto;
            }

            &.small-menu-open {
                > nav:first-child a {
                    visibility: hidden;
                }
            }
        }

        > section {
            padding: 0 1rem;
        }

        .field {
            display: block;

            .label {
                display: block;
            }

            .value {
                display: block;
            }
        }
    }
}

#app {
    &.mode-small {
        .tei-reader {
            > div {
                flex: 0 0 auto;
                display: flex;
                flex-direction: row;

                > nav:first-child {
                    flex: 0 0 auto;
                }

                > nav:last-child {
                    flex: 1 1 auto;
                }
            }

            > main.text-reader {
                flex: 1 1 auto;
                display: flex;
                flex-direction: column;
                overflow: hidden;

                > div {
                    flex: 0 0 auto;
                    display: flex;
                    flex-direction: row;

                    nav {
                        &:first-child {
                            flex: 0 0 auto;
                        }

                        &:last-child {
                            flex: 1 1 auto;
                        }
                    }

                    &.small-menu-open {
                        > nav:first-child a {
                            visibility: hidden;
                        }
                    }
                }

                > article {
                    flex: 1 1 auto;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;

                    > div {
                        position: relative;
                        overflow-y: auto;
                        padding: 1rem;
                        flex: 1 1 auto;
                    }

                    > aside {
                        flex: 0 0 auto;
                        padding: 0.5rem 1rem;
                        position: relative;

                        > a {
                            position: absolute;
                            right: 0.5rem;
                            top: 0.2rem;
                            z-index: 1;
                            cursor: pointer;
                        }
                    }
                }
            }
        }
    }

    &.mode-large {
        .tei-reader {
            > main.text-reader {
                flex: 1 1 auto;
                display: flex;
                flex-direction: row;
                overflow: hidden;

                > nav {
                    flex: 0 0 auto;
                    width: 15rem;
                    overflow-y: auto;
                }

                > article {
                    flex: 1 1 auto;
                    overflow-y: hidden;
                    display: flex;
                    flex-flow: column;

                    > div {
                        position: relative;
                        overflow-y: auto;
                        padding: 1rem;
                        flex: 1 1 auto;
                    }

                    > aside {
                        flex: 0 0 auto;
                        padding: 0.5rem 1rem;
                        position: relative;

                        > a {
                            position: absolute;
                            right: 0.5rem;
                            top: 0.2rem;
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

                > aside {
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
    }
}
</style>
