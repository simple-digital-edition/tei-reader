####
Demo
####

Below is a demo showing all features provided by the TEI editor:

.. raw:: html

  <iframe src="_static/demo/index.html" style="width:100%;height:30rem;border:1px solid #dddddd;"></iframe>

The reader above uses the following configuration:

.. sourcecode:: json

  {
      "sections": {
          "body": {
              "label": "Text",
              "type": "Text",
              "parser": {
                  "selector": "tei:text/tei:body"
              },
              "schema": [
                  {
                      "name": "paragraph",
                      "type": "block",
                      "parser": {
                          "selector": "tei:p"
                      }
                  },
                  {
                      "name": "title-page",
                      "type": "block",
                      "parser": {
                          "selector": "tei:titlePage"
                      }
                  },
                  {
                      "name": "title-part",
                      "type": "block",
                      "parser": {
                          "selector": "tei:titlePart"
                      }
                  },
                  {
                      "name": "doc-edition",
                      "type": "block",
                      "parser": {
                          "selector": "tei:docEdition"
                      }
                  },
                  {
                      "name": "doc-imprint",
                      "type": "block",
                      "parser": {
                          "selector": "tei:docImprint"
                      }
                  },
                  {
                      "name": "byline",
                      "type": "block",
                      "parser": {
                          "selector": "tei:byline"
                      }
                  },
                  {
                      "name": "head",
                      "type": "block",
                      "parser": {
                          "selector": "tei:head"
                      },
                      "attrs": {
                          "id": {
                              "parser": {
                                  "selector": "@xml:id"
                              }
                          }
                      },
                      "navigation": {
                          "attr": "id"
                      }
                  },
                  {
                      "name": "line-group",
                      "type": "block",
                      "parser": {
                          "selector": "tei:lg"
                      }
                  },
                  {
                      "name": "line",
                      "type": "block",
                      "parser": {
                          "selector": "tei:l"
                      }
                  },
                  {
                      "name": "paragraph",
                      "type": "block",
                      "parser": {
                          "selector": "tei:p"
                      }
                  },
                  {
                      "name": "text",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:seg",
                              "text": "text()"
                          },
                          {
                              "selector": "tei:hi",
                              "text": "text()"
                          }
                      ]
                  },
                  {
                      "name": "page-break",
                      "type": "inline",
                      "parser": {
                          "selector": "tei:pb"
                      }
                  },
                  {
                      "name": "line-break",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:lb"
                          }
                      ]
                  },
                  {
                      "name": "pub-place",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:pubPlace"
                          }
                      ]
                  },
                  {
                      "name": "publisher",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:publisher"
                          }
                      ]
                  },
                  {
                      "name": "doc-date",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:docDate"
                          }
                      ]
                  },
                  {
                      "name": "choice-ref",
                      "type": "inline",
                      "parser": {
                          "selector": "tei:ref[@type='choice']",
                          "text": "text()"
                      },
                      "attrs": {
                          "target": {
                              "parser": {
                                  "selector": "@target"
                              }
                          }
                      },
                      "reference": {
                          "type": "choice",
                          "attr": "target",
                          "display": "sidebar"
                      }
                  },
                  {
                      "name": "choice",
                      "type": "nested",
                      "parsers": {
                          "selector": "tei:choice"
                      },
                      "attrs": {
                          "id": {
                              "parser": {
                                  "selector": "@xml:id"
                              }
                          }
                      }
                  },
                  {
                      "name": "sic",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:sic",
                              "text": "text()"
                          }
                      ]
                  },
                  {
                      "name": "corr",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:corr",
                              "text": "text()"
                          }
                      ]
                  },
                  {
                      "name": "letter-spacing",
                      "type": "mark",
                      "parsers": [
                          {
                              "selector": "contains(@style, 'letter-spacing')"
                          }
                      ]
                  },
                  {
                      "name": "initial-letter",
                      "type": "mark",
                      "parsers": [
                          {
                              "selector": "contains(@style, 'initial-letter')"
                          }
                      ]
                  }
              ]
          },
          "changes": {
              "label": "Edits",
              "type": "NestedList",
              "source": "body",
              "nodeName": "choice"
          },
          "metadata": {
              "label": "About",
              "type": "Metadata",
              "schema": [
                  {
                      "tag": "tei:fileDesc",
                      "children": [
                          {
                              "tag": "tei:titleStmt",
                              "children": [
                                  {
                                      "tag": "tei:title"
                                  },
                                  {
                                      "tag": "tei:author",
                                      "children": [
                                          {
                                              "tag": "tei:persName"
                                          }
                                      ]
                                  }
                              ]
                          },
                          {
                              "tag": "tei:publicationStmt",
                              "children": [
                                  {
                                      "tag": "tei:publisher",
                                      "children": [
                                          {
                                              "tag": "tei:orgName",
                                              "multiple": true
                                          }
                                      ]
                                  },
                                  {
                                      "tag": "tei:availability",
                                      "children": [
                                          {
                                              "tag": "tei:licence",
                                              "children": [
                                                  {
                                                      "tag": "tei:p"
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          }
                      ]
                  }
              ],
              "ui": [
                  {
                      "label": "Bibliography",
                      "entries": [
                          {
                              "type": "single-text",
                              "label": "Title",
                              "path": "fileDesc.titleStmt.title._text"
                          },
                          {
                              "type": "single-text",
                              "label": "Author",
                              "path": "fileDesc.titleStmt.author.persName._text"
                          }
                      ]
                  },
                  {
                      "label": "Digital Version",
                      "entries": [
                          {
                              "type": "single-text",
                              "label": "License",
                              "path": "fileDesc.publicationStmt.availability.licence.p._text"
                          },
                          {
                              "type": "multi-row",
                              "path": "fileDesc.publicationStmt.publisher.orgName",
                              "entries": [
                                  {
                                      "type": "single-text",
                                      "label": "Publisher",
                                      "path": "._text"
                                  }
                              ]
                          }
                      ]
                  }
              ]
          }
      },
      "ui": {
          "closeLabel": "Close"
      }
  }


The reader also uses the following callbacks:

.. sourcecode:: html

  <script type="application/javascript">
    window.TEIReader = {
        callbacks: {
            autoLoad: function(callback) {
                const request = window.fetch('text.tei');
                request.then((response) => {
                    response.text().then((text) => {
                        callback({
                            content: text,
                            identifier: 'tei-reader-demo',
                        });
                    })
                });
            },
            close: function() {
                alert('There is nothing else to see here');
            }
        }
    }
  </script>
