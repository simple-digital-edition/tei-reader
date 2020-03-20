Main Configuration
==================

The configuration must be made available via a ``<script>`` tag with the ``id`` attribute set to "TEIReaderConfig" and
the ``type`` set to "application/json":

.. sourcecode:: html

  <script id="TEIReaderConfig" type="application/json">
    {
      "sections": ...
    }
  </script>

The configuration itself is provided as one large JSON object, which is documented here. The documentation uses a
semi-formal format, mainly showing the individual JSON objects that make up the configuration, with some additional
markers:

* Optional keys are marked with "?".
* Keys that can be repeated are marked with "+".
* Nested JSON objects are indicated with a camel-case value (e.g. "ParserElement"). When creating an actual
  configuration object, these are replaced with the nested JSON object.
* Customisable values are indicates by the values "AnyString" (any string content allowed), "AnyHTMLString" (any HTML
  content is allowed), and "Boolean" (true or false).
* Choices are marked using the pipe "|" symbol.
* Fixed values are indicated using values that start with a lower-case letter.
* Where lists are shown with a single value, this value can be repeated as often as required.

The top-level configuration object is structured as follows:

.. sourcecode:: json

  {
    "sections": {
      "+SectionIdentifier": "TextSection | NestedListSection | MetadataSection"
    }
    "ui": "ReaderUI"
  }

It consists of one or more section identifier keys, each of which has either a ``TextSection`` or a
``MetadataSection`` object as its value. The TEI Reader can handle any number of ``TextSection``, however
there may be at most one ``MetadataSection``.

TextSection
-----------

The ``TextSection`` represents a section in which the user can read a TEI text block:

.. sourcecode:: json

  {
    "label": "AnyString",
    "type": "Text",
    "parser": "ParserElement",
    "schema": [
      "TagElement"
    ]
  }

The ``label`` can be any string value and is used in the UI to allow the user to navigate to this section. The ``type``
must be ``"Text"``. The ``parser`` configuration is used to identify the root element in the TEI document that
contains the text to be edited in this section. The ``schema`` contains a list of ``TagElement`` objects
that identify the various markup elements that have been used to annotate the text in this section.

TagElement
++++++++++

The ``TagElement`` represents one markup tag that is used in the TEI text edited in the section it is specified in.

.. sourcecode:: json

  {
    "name": "AnyString",
    "type": "block | wrapping | nested | inline | mark",
    "attrs": {
      "+AttributeName": "ElementAttribute"
    },
    "?parser": "ParserElement",
    "?parsers": ["ParserElement"],
    "?content": "ElementName",
    "?reference": "NestedReferenceElement",
    "?navigation": "NavigationElement"
  }

The ``name`` can be any value, but each ``name`` **must** be unique within the ``TextSection``. The ``type`` defines the
type of markup the ``TagElement`` represents:

* *block*: A basic block-level element.
* *wrapping*: A block-level element that contains another block-level element. The name of the inner block-level
  element **must** be specified in the ``content`` key.
* *nested*: The root element for a nested document. Nested documents **must** have an ``"xml:id"`` attribute that
  specifies the unique identifier for each nested document. This must be in the format
  ``nestedDocumentElementName-UniqueNumber``.
* *inline*: An inline element.
* *mark*: A formatting mark that is attached either to text or to an inline element.

The distinction between inline and mark elements is fluid, but in general you should prefer mark elements for formatting
and styling markup and inline elements to mark semantic content.

The ``attrs`` object maps attribute names (which can by any string value) to ``ElementAttribute`` configurations that
specify how the attribute is parsed and serialised.

Each ``TagElement`` **must** specify either a single ``parser`` or a list of ``parsers`` that specify which TEI tags
are mapped to this ``TagElement``.

The ``content`` **must** and **may only** be specified for a ``TagElement`` that has the ``type`` ``"wrapping"``. In
that case it **must** be set to the ``name`` of the ``TagElement`` that may be contained by the wrapping ``TagElement``.

The ``reference`` is specified for any ``TagElement`` that represents the reference to a nested document and specifies
how the two are linked together.

ElementAttribute
****************

The ``ElementAttribute`` specifies the default value for the attribute and how it is parsed:

.. sourcecode:: json

  {
    "default": "AnyString",
    "?parser": "ParserElement",
    "?parsers": ["ParserElement"]
  }

As with the ``TagElement``, either a single ``parser`` or multiple ``parsers`` **must** be provided to specify how the
attribute is parsed from the TEI document.

The ``default`` specifies the default value that is set for the attribute if no valid value can be parsed from the TEI
document.

NestedReferenceElement
**********************

Editing nested documents consists of two steps. First, the user needs to mark up the text that represents the reference
to the nested document. Then they need to edit the nested document. The ``NestedReferenceElement`` specifies the link
from the reference element to the nested document.

.. sourcecode:: json

  {
    "type": "ElementName",
    "attr": "AttributeName",
    "display": "sidebar | footer"
  }

The ``type`` specifies the ``name`` of the ``TagElement`` that represents the nested documents. The ``attr`` specifies
the attribute on the reference element that contains the nested document's unique identifier. The ``display`` configures
whether the nested document is to be shown in the sidebar or in the footer of the user interface. However, if the
device used by the user is small, then all nested documents are shown in the footer.

NavigationElement
*****************

The ``NavigationElement`` configures which attribute to use to generate the in-text navigation elements.

.. sourcecode:: json

  {
    "attr": "AttributeName"
  }

The ``attr`` to use for navigation.

ParserElement
+++++++++++++

The ``ParserElement`` specifies how a ``TagElement`` or ``ElementAttribute`` is parsed from the TEI document.

.. sourcecode:: json

  {
    "selector": "XpathSelector",
    "?type": "static",
    "?value": "AnyString",
    "?text": "xpath-text-selector"
  }

The ``selector`` contains an XPath selector. The selector is configured to require the "tei" prefix on all TEI nodes,
for example "tei:head[@type=\"level-1\"]".

When used in the ``TagElement`` for inline or mark elements, the ``text`` **may** be used and contains a further XPath
selector that specfifies how the text content is to be parsed, relative to the TEI element selected via the ``selector``
XPath.

When used in the ``ElementAttribute``, the attribute's value by default is set to the result of the ``selector``.
However, if the ``type`` is specified with the value ``"static"``, then if the ``selector`` matches, the attribute's
value is set to the value specified in ``value``.

NestedListSection
-----------------

The ``NestedListSection`` represents a section where the user can read a list of nested documents.

.. sourcecode:: json

  {
    "label": "AnyString",
    "type": "NestedList",
    "source": "SectionName",
    "nodeName": "TagElementName"
  }

The ``label`` can be any string value and is used in the UI to allow the user to navigate to this section. The ``type``
must be ``"NestedList"``. The ``source`` is the name of the ``TextSection`` that contains the document from which to
show the nested documents. The ``nodeName`` specifies the name of the nested ``TagElement`` to show the individual
nested documents for.

MetadataSection
---------------

The ``MetadataSection`` configures the Metadata reader.

.. sourcecode:: json

  {
    "label": "AnyString",
    "type": "Metadata",
    "schema": ["MetadataReaderElement"],
    "ui": ["MetadataReaderUISection"]
  }

The ``label`` can be any string value and is used in the UI to allow the user to navigate to this section. The ``type``
must be ``"Metadata"``. The ``schema`` specifies how the metadata is parsed from the TEI document. The ``ui``
specifies how the metadata is displayed to the user.

MetadataReaderElement
+++++++++++++++++++++

The ``MetadataReaderElement`` is used to convert the TEI header into a tree-structure that can then be viewed via the
UI.

.. sourcecode:: json

  {
    "tag": "AnyString",
    "?children": ["MetadataReaderElement"],
    "?multiple": "Boolean"
  }

The ``tag`` specifies the TEI tag that this ``MetadataReaderElement`` matches. If it matches, then if any ``children``
are specified, the matching is applied recursively.

If ``multiple`` is set to ``true``, then a list of all matching TEI tags is generated, otherwise the first matching
TEI tag is stored.

MetadataReaderUISection
+++++++++++++++++++++++

The ``MetadataReaderUISection`` is used to visually separate sections of the metadata to edit.

.. sourcecode:: json

  {
    "label": "AnyString",
    "entries": ["MetadataReaderUIElement"]
  }

The ``label`` is used as the heading that is displayed to the user. The ``entries`` define the editable UI elements.

MetadataReaderUIElement
***********************

The ``MetadataReaderUIElement`` is used to create the actual interface for editing the metadata.

.. sourcecode:: json

  {
    "type": "single-text | multi-field | multi-row",
    "label": "AnyString",
    "path": "DottedPath",
    "?entries": ["MetadataReaderUIElement"]
  }

The ``type`` specifies how the element is displayed and **must** be one of ``"single-text"``, ``"multi-field"``, or
``"multi-row"``. The ``label`` is used to label the input element. The ``path`` is a dotted path that specifies the
location in the tree of the metadata to edit. The optional ``entries`` allow nesting ``MetadataReaderUIElement`` to
enable complex displays

If the ``type`` is ``"single-text"``, then the value specified by the ``path`` is displayed. If the ``type`` is
``multi-row``, then the ``entries`` **must** be specified and define the ``MetadataReaderUIElement``\ s that make up
one row. If the ``type`` is ``multi-field`` then the ``entries`` **must** be specified and define the
``MetadataReaderUIElement``\ s that conceptually belong together.

In general the ``multi-field`` ``MetadataReaderUIElement`` are contained within ``multi-row``
``MetadataReaderUIElement``\ s.

The full path for accessing the metadata from the tree structure is calculated by concatenating all the ``path``
values for the nested ``MetadataReaderUIElement``\ s.
