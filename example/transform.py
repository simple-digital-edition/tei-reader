from lxml import etree

NS = {'tei': 'http://www.tei-c.org/ns/1.0',
      'room3b': 'https://www.room3b.eu'}

function_ns = etree.FunctionNamespace('https://www.room3b.eu')
id_map = {}

def uid(ctx, seq):
    global id_map
    if seq in id_map:
        id_map[seq] = id_map[seq] + 1
    else:
        id_map[seq] = 1
    return '{0}-{1}'.format(seq, id_map[seq])


function_ns['uid'] = uid

inner_nodes = ['text', 'front', 'titlePage', 'body', 'lg']
inner_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(inner_node) for inner_node in inner_nodes]
leaf_nodes = ['titlePart', 'byline', 'docImprint', 'docEdition', 'head', 'l', 'p']
leaf_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(leaf_node) for leaf_node in leaf_nodes]
inline_nodes = ['pubPlace', 'publisher', 'docDate', 'choice']
inline_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(inline_node) for inline_node in inline_nodes]
markup_nodes = ['hi', 'sic', 'corr']
markup_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(markup_node) for markup_node in markup_nodes]
markup_or_leaf_nodes = ['lb', 'pb']
markup_or_leaf_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(markup_or_leaf_node) for markup_or_leaf_node in markup_or_leaf_nodes]
skip_nodes = ['div']
skip_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(skip_node) for skip_node in skip_nodes]
drop_nodes = ['milestone']
drop_nodes = ['{{http://www.tei-c.org/ns/1.0}}{0}'.format(drop_node) for drop_node in drop_nodes]


def transform_attrib(attrib):
    result = {}
    for key, value in attrib.items():
        if key == 'rendition':
            if value == '#g':
                result['style'] = 'letter-spacing'
            elif value == '#in':
                result['style'] = 'initial-letter'
            else:
                print(value)
        else:
            result[key] = value
    return result


def transform_node(node, parent=None):
    if node.tag in inner_nodes:
        transformed_node = etree.Element(node.tag, **node.attrib)
        for child_node in node:
            tmp = transform_node(child_node)
            if tmp is not None:
                if isinstance(tmp, list):
                    for element in tmp:
                        if element is not None:
                            transformed_node.append(element)
                else:
                    transformed_node.append(tmp)
        return transformed_node
    elif node.tag in leaf_nodes or (node.tag in markup_or_leaf_nodes and parent is None):
        transformed_node = etree.Element(node.tag, **node.attrib)
        if node.text:
            tmp = etree.Element('{http://www.tei-c.org/ns/1.0}seg')
            tmp.text = node.text
            transformed_node.append(tmp)
        for child_node in node:
            transform_node(child_node, parent=transformed_node)
            if child_node.tail:
                tmp = etree.Element('{http://www.tei-c.org/ns/1.0}seg')
                tmp.text = child_node.tail
                transformed_node.append(tmp)
        return transformed_node
    elif node.tag in inline_nodes:
        transformed_node = etree.Element(node.tag, **transform_attrib(node.attrib))
        if node.text:
            transformed_node.text = node.text
        for child_node in node:
            transform_node(child_node, parent=transformed_node)
        if parent is not None:
            parent.append(transformed_node)
        else:
            return transformed_node
    elif node.tag in markup_nodes or (node.tag in markup_or_leaf_nodes and parent is not None):
        tmp = etree.Element(node.tag, **transform_attrib(node.attrib))
        if node.text:
            tmp.text = node.text
        parent.append(tmp)
        for child_node in node:
            transform_node(child_node, parent=parent)
            if child_node.tail:
                tmp = etree.Element(node.tag, **transform_attrib(node.attrib))
                tmp.text = child_node.tail
                parent.append(tmp)
    elif node.tag in skip_nodes:
        return [transform_node(child_node, parent=parent) for child_node in node]
    elif node.tag in drop_nodes:
        pass
    else:
        print(node.tag)


def transform(doc):
    transformed_doc = etree.Element('{http://www.tei-c.org/ns/1.0}TEI')
    transformed_doc.append(transform_node(doc.xpath('/tei:TEI/tei:text', namespaces=NS)[0]))
    return transformed_doc


with open('example/fouque_falkensteins_01_1810.TEI-P5.xml') as in_f:
    source = etree.parse(in_f)

output = transform(source)

with open('example/transform.xslt') as in_f:
    xslt_transform = etree.XSLT(etree.parse(in_f))

output = xslt_transform(output)

with open('public/text.tei', 'wb') as out_f:
    out_f.write(etree.tostring(output, pretty_print=True))
