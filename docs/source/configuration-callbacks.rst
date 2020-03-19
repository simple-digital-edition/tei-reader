Callbacks
=========

In addition to the static configuration, the TEI Reader supports twp JavaScript callbacks. To add callbacks, create
a new ``TEIReader`` object on the ``window`` object:

.. sourcecode:: html

  <script type="application/javascript">
    window.TEIEditor = {
        callbacks: {
        }
    }
  </script>

There are two optional callbacks that can be defined on the ``callback`` object:

.. sourcecode:: html

  <script type="application/javascript">
    window.TEIEditor = {
        callbacks: {
            autoLoad: function(callback) {
            },
            close: function() {
            }
        }
    }
  </script>

The ``autoLoad`` callback is called once after the TEI Reader has initialised itself. Use this to load a TEI document.
The TEI document **must** be passed as a string to the ``callback`` function parameter.

The ``close`` callback is called when the user closes the reader.
