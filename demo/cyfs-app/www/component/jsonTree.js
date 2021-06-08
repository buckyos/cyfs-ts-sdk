/**
 * JSON Tree library (a part of jsonTreeViewer)
 * http://github.com/summerstyle/jsonTreeViewer
 *
 * Copyright 2017 Vera Lobacheva (http://iamvera.com)
 * Released under the MIT license (LICENSE.txt)
 */

var jsonTree = (function() {
    
    /* ---------- Utilsities ---------- */
    class Utils {

        static label(v){
            if(typeof v==="string"){
                if(v.startsWith("m_")){
                    return v.substring(2);
                }else{
                    return v;
                }
            }else{
                return v;
            }
        }

        static value(label, v){
            if(label==='m_obj_type'){
                return cyfs.number_2_obj_type_code_name(v);
            }else{
                return v;
            }
        }
        
        /*
         * Returns js-"class" of value
         * 
         * @param val {any type} - value
         * @returns {string} - for example, "[object Function]"
         */
        static getClass(val) {
            return Object.prototype.toString.call(val);
        }
        
        /**
         * Checks for a type of value (for valid JSON data types).
         * In other cases - throws an exception
         * 
         * @param val {any type} - the value for new node
         * @returns {string} ("object" | "array" | "null" | "boolean" | "number" | "string")
         */
        static getType(val) {
            if (val === null) {
                return 'null';
            }
            
            switch (typeof val) {
                case 'number':
                    return 'number';
                
                case 'string':
                    return 'string';
                
                case 'boolean':
                    return 'boolean';

                case 'bigint':
                    return 'number';
            }
            
            switch(Utils.getClass(val)) {
                case '[object Array]':
                    return 'array';
                
                case '[object Object]':
                    return 'object';
                
                case '[object Uint8Array]':
                    return 'buffer';
            }

            return 'string';
        }
        
        /**
         * Applies for each item of list some function
         * and checks for last element of the list
         * 
         * @param obj {Object | Array} - a list or a dict with child nodes
         * @param func {Function} - the function for each item
         */
        static forEachNode(obj, func, keysort) {
            var type = Utils.getType(obj),
                isLast;
        
            switch (type) {
                case 'buffer':
                    isLast = obj.length - 1;
                    
                    obj.forEach((item, i)=> {
                        func(i, item, i === isLast);
                    });
                    
                    break;
                case 'array':
                    isLast = obj.length - 1;
                    
                    obj.forEach((item, i)=> {
                        func(i, item, i === isLast);
                    });
                    
                    break;
                case 'object':
                    let keys;
                    if(keysort){
                        const obj_keys = Object.keys(obj);
                        if(obj_keys.length>0){
                            keys = keysort(obj_keys);
                        }else{
                            keys = obj_keys;
                        }
                    }else{
                        keys = Object.keys(obj).sort();
                    }
                    
                    isLast = keys.length - 1;
                    
                    keys.forEach((item, i)=> {
                        func(item, obj[item], i === isLast);
                    });
                    
                    break;
            }
        }
        
        /*
         * Checks for a valid type of root node*
         *
         * @param {any type} jsonObj - a value for root node
         * @returns {boolean} - true for an object or an array, false otherwise
         */
        static isValidRoot(jsonObj) {
            switch (Utils.getType(jsonObj)) {
                case 'object':
                case 'array':
                    return true;
                default:
                    return false;
            }
        }

        /**
         * Extends some object
         */
        static extend(targetObj, sourceObj) {
            for (var prop in sourceObj) {
                if (sourceObj.hasOwnProperty(prop)) {
                    targetObj[prop] = sourceObj[prop];
                }
            }
        }
    }

    class NodeBase {
        constructor(type){
            this.type = type;
        }
    }
    
    
    /* ---------- Node constructors ---------- */

    /*
     * The constructor for simple types (string, number, boolean, null)
     * {...
     * [+] "label": value,
     * ...}
     * value = string || number || boolean || null
     *
     * Markup:
     * <li class="jsontree_node">
     *     <span class="jsontree_label-wrapper">
     *         <span class="jsontree_label">"age"</span>
     *         :
     *     </span>
     *     <span class="jsontree_value jsontree_value_(number|boolean|string|null)">25</span>
     *     ,
     * </li>
     *
     * @abstract
     * @param label {string} - key name
     * @param val {string | number | boolean | null} - a value of simple types
     * @param isLast {boolean} - true if node is last in list of parent childNodes
     */
    class NodeSimple extends NodeBase {
        constructor(type, label, val, isLast) {
            super(type);

            this.label = label;
            this.isComplex = false;
            
            const template = (label, val)=> {
                var str = '\
                    <span class="jsontree_label-wrapper">\
                        <span class="json_line jsontree_label jsontree_expand-label-text">"' +
                        Utils.label(label) +
                        '"</span> : \
                    </span>\
                    <span class="jsontree_value-wrapper">\
                        <span class="json_line jsontree_value jsontree_value_' + this.type + '">' +
                            Utils.value(label, val) +
                        '</span>' +
                        (!isLast ? ',' : '') + 
                    '</span>';
    
                return str;
            };
        
            // create el
            this.el = document.createElement('li');
            this.el.classList.add('jsontree_node');
            this.el.classList.add('json_line');
            this.el.innerHTML = template(label, val);

            // add event to labelE1 in el
            const labelEl = this.el.querySelector('.jsontree_label');
            labelEl.addEventListener('click', (e)=> {
                if (e.altKey) {
                    this.toggleMarked();
                    return;
                }

                if (e.shiftKey) {
                    document.getSelection().removeAllRanges();
                    alert(this.getJSONPath());
                    return;
                }
            }, false);
        }

        /**
         * Mark node
         */
        mark() {
            this.el.classList.add('jsontree_node_marked');    
        }

        /**
         * Unmark node
         */
        unmark() {
            this.el.classList.remove('jsontree_node_marked');    
        }

        /**
         * Mark or unmark node
         */
        toggleMarked() {
            this.el.classList.toggle('jsontree_node_marked');    
        }

        /**
         * Expands parent node of this node
         *
         * @param isRecursive {boolean} - if true, expands all parent nodes
         *                                (from node to root)
         */
        expandParent(isRecursive) {
            if (!this.parent) {
                return;
            }

            this.parent.expand(); 
            this.parent.expandParent(isRecursive);
        }

        /**
         * Returns JSON-path of this 
         * 
         * @param isInDotNotation {boolean} - kind of notation for returned json-path
         *                                    (by default, in bracket notation)
         * @returns {string}
         */
        getJSONPath(isInDotNotation) {
            if (this.isRoot) {
                return "$";
            }

            var currentPath;

            if (this.parent.type === 'array') {
                currentPath = "[" + this.label + "]";
            } else {
                currentPath = isInDotNotation ? "." + this.label : "['" + this.label + "']";
            }

            return this.parent.getJSONPath(isInDotNotation) + currentPath; 
        }
    }
    
    
    /*
     * The constructor for boolean values
     * {...
     * [+] "label": boolean,
     * ...}
     * boolean = true || false
     *
     * @constructor
     * @param label {string} - key name
     * @param val {boolean} - value of boolean type, true or false
     * @param isLast {boolean} - true if node is last in list of parent childNodes
     */
    class NodeBoolean extends NodeSimple{
        constructor(label, val, isLast) {
            super("boolean", label, val, isLast)
        }
    }
    
    /*
     * The constructor for number values
     * {...
     * [+] "label": number,
     * ...}
     * number = 123
     *
     * @constructor
     * @param label {string} - key name
     * @param val {number} - value of number type, for example 123
     * @param isLast {boolean} - true if node is last in list of parent childNodes
     */
    class NodeNumber extends NodeSimple{
        constructor(label, val, isLast) {
            super("number", label, val, isLast);
        }
    }
    
    /*
     * The constructor for string values
     * {...
     * [+] "label": string,
     * ...}
     * string = "abc"
     *
     * @constructor
     * @param label {string} - key name
     * @param val {string} - value of string type, for example "abc"
     * @param isLast {boolean} - true if node is last in list of parent childNodes
     */
    class NodeString extends NodeSimple{
        constructor(label, val, isLast) {
            super("string", label, '"' + val + '"', isLast);
        }
    }
    
    /*
     * The constructor for null values
     * {...
     * [+] "label": null,
     * ...}
     *
     * @constructor
     * @param label {string} - key name
     * @param val {null} - value (only null)
     * @param isLast {boolean} - true if node is last in list of parent childNodes
     */
    class NodeNull extends NodeSimple{
        constructor(label, val, isLast) {
            super("null", label, label, val, isLast);
        }
    }
    
    /*
     * The constructor for complex types (object, array)
     * {...
     * [+] "label": value,
     * ...}
     * value = object || array
     *
     * Markup:
     * <li class="jsontree_node jsontree_node_(object|array) [expanded]">
     *     <span class="jsontree_label-wrapper">
     *         <span class="jsontree_label">
     *             <span class="jsontree_expand-button" />
     *             "label"
     *         </span>
     *         :
     *     </span>
     *     <div class="jsontree_value">
     *         <b>{</b>
     *         <ul class="jsontree_child-nodes" />
     *         <b>}</b>
     *         ,
     *     </div>
     * </li>
     *
     * @abstract
     * @param label {string} - key name
     * @param val {Object | Array} - a value of complex types, object or array
     * @param isLast {boolean} - true if node is last in list of parent childNodes
     */
    class NodeComplex extends NodeBase {
        constructor(type, label, val, isLast, sym, options) {
            super(type);

            this.sym = sym;

            if(options==null){
                options = {}
            }

            if(val.is_some!=null&&val.is_some()){
                val = val.unwrap()
            }

            const template = (label, sym)=> {
                var comma = (!isLast) ? ',' : '',
                    str = '\
                        <div class="jsontree_value-wrapper">\
                            <div class="jsontree_value jsontree_value_' + this.type + '">\
                                <b class="jsontree_left">' + sym[0] + '</b>\
                                <span class="jsontree_show-more">&hellip;</span>\
                                <ul class="jsontree_child-nodes"></ul>\
                                <b class="jsontree_right">' + sym[1] + '</b>' +
                            '</div>' + comma +
                        '</div>';
    
                if (label !== null) {
                    str = '\
                        <span class="jsontree_label-wrapper">\
                            <span class="jsontree_label">' +
                                '<span class="jsontree_expand-button"></span>' +
                                '<span class="jsontree_expand-button-text">"'+Utils.label(label)+'</span>'+
                            '"</span> : \
                        </span>' + str;
                }
    
                return str;
            };

            const childNodes = [];
        
            this.label = label;
            this.isComplex = true;
        
            this.el = document.createElement('li');
            this.el.classList.add('jsontree_node');
            this.el.classList.add('jsontree_node_complex');
            this.el.innerHTML = template(label, this.sym);
        
            this.childNodes = [];
            this.childNodesUl = this.el.querySelector('.jsontree_child-nodes');
        
            if (label !== null) {
                const labelEl = this.el.querySelector('.jsontree_label');
                const moreContentEl = this.el.querySelector('.jsontree_show-more');
        
                labelEl.addEventListener('click', (e)=> {
                    if (e.altKey) {
                        this.toggleMarked();
                        return;
                    }

                    if (e.shiftKey) {
                        document.getSelection().removeAllRanges();
                        alert(this.getJSONPath());
                        return;
                    }

                    this.toggle(e.ctrlKey || e.metaKey);
                }, false);
                
                moreContentEl.addEventListener('click', (e)=> {
                    this.toggle(e.ctrlKey || e.metaKey);
                }, false);
        
                this.isRoot = false;
            } else {
                this.isRoot = true;
                this.parent = null;
        
                this.el.classList.add('jsontree_node_expanded');
            }
        
            if(val.to_base_58!=null){
                this.addChild(new NodeString(label+"_base58", val.to_base_58(), isLast));
            }

            Utils.forEachNode(val, (label, node, isLast)=> {
                if(options.filter && options.filter(label)){
                    // ignore
                }else{
                    const child = Node(label, node, isLast, options);
                    this.addChild(child);
                }
            }, options.keysort);
        
            this.isEmpty = !Boolean(this.childNodes.length);
            if (this.isEmpty) {
                this.el.classList.add('jsontree_node_empty');
            }
        }
        
        /*
         * Add child node to list of child nodes
         *
         * @param child {Node} - child node
         */
        addChild(child) {
            this.childNodes.push(child);
            this.childNodesUl.appendChild(child.el);
            child.parent = this;
        }
    
        /*
         * Expands this list of node child nodes
         *
         * @param isRecursive {boolean} - if true, expands all child nodes
         */
        expand(isRecursive){
            if (this.isEmpty) {
                return;
            }
            
            if (!this.isRoot) {
                this.el.classList.add('jsontree_node_expanded');
            }
    
            if (isRecursive) {
                this.childNodes.forEach((item, i)=> {
                    if (item.isComplex) {
                        item.expand(isRecursive);
                    }
                });
            }
        }
    
        /*
         * Collapses this list of node child nodes
         *
         * @param isRecursive {boolean} - if true, collapses all child nodes
         */
        collapse(isRecursive) {
            if (this.isEmpty) {
                return;
            }
            
            if (!this.isRoot) {
                this.el.classList.remove('jsontree_node_expanded');
            }
    
            if (isRecursive) {
                this.childNodes.forEach((item, i)=> {
                    if (item.isComplex) {
                        item.collapse(isRecursive);
                    }
                });
            }
        }
    
        /*
         * Expands collapsed or collapses expanded node
         *
         * @param {boolean} isRecursive - Expand all child nodes if this node is expanded
         *                                and collapse it otherwise
         */
        toggle(isRecursive) {
            if (this.isEmpty) {
                return;
            }
            
            this.el.classList.toggle('jsontree_node_expanded');
            
            if (isRecursive) {
                var isExpanded = this.el.classList.contains('jsontree_node_expanded');
                
                this.childNodes.forEach((item, i)=> {
                    if (item.isComplex) {
                        item[isExpanded ? 'expand' : 'collapse'](isRecursive);
                    }
                });
            }
        }

        /**
         * Find child nodes that match some conditions and handle it
         * 
         * @param {Function} matcher
         * @param {Function} handler
         * @param {boolean} isRecursive
         */
        findChildren(matcher, handler, isRecursive) {
            if (this.isEmpty) {
                return;
            }
            
            this.childNodes.forEach((item, i)=> {
                if (matcher(item)) {
                    handler(item);
                }

                if (item.isComplex && isRecursive) {
                    item.findChildren(matcher, handler, isRecursive);
                }
            });
        }
    }
    
    
    /*
     * The constructor for object values
     * {...
     * [+] "label": object,
     * ...}
     * object = {"abc": "def"}
     *
     * @constructor
     * @param label {string} - key name
     * @param val {Object} - value of object type, {"abc": "def"}
     * @param isLast {boolean} - true if node is last in list of siblings
     */
    class NodeObject extends NodeComplex {
        constructor(label, val, isLast, filter, keysort) {
            super("object", label, val, isLast, ['{', '}'], filter, keysort);
        }
    }
    
    /*
     * The constructor for array values
     * {...
     * [+] "label": array,
     * ...}
     * array = [1,2,3]
     *
     * @constructor
     * @param label {string} - key name
     * @param val {Array} - value of array type, [1,2,3]
     * @param isLast {boolean} - true if node is last in list of siblings
     */
    class NodeArray extends NodeComplex {
        constructor(label, val, isLast, options) {
            super("array", label, val, isLast, ['[', ']'], options);
        }
    }
    

    /*
     * The constructor for buffer values
     * {...
     * [+] "label": buffer,
     * ...}
     * buffer = [1,2,3]
     *
     * @constructor
     * @param label {string} - key name
     * @param val {Uint8Array} - value of buffer type, [1,2,3]
     * @param isLast {boolean} - true if node is last in list of siblings
     */
    class NodeBuffer extends NodeComplex {
        constructor(label, val, isLast, options) {
            super("array", label, val, isLast, ['[', ']'], options);
        }
    }

    /**
     * The factory for creating nodes of defined type.
     * 
     * ~~~ Node ~~~ is a structure element of an onject or an array
     * with own label (a key of an object or an index of an array)
     * and value of any json data type. The root object or array
     * is a node without label.
     * {...
     * [+] "label": value,
     * ...}
     * 
     * Markup:
     * <li class="jsontree_node [jsontree_node_expanded]">
     *     <span class="jsontree_label-wrapper">
     *         <span class="jsontree_label">
     *             <span class="jsontree_expand-button" />
     *             "label"
     *         </span>
     *         :
     *     </span>
     *     <(div|span) class="jsontree_value jsontree_value_(object|array|boolean|null|number|string)">
     *         ...
     *     </(div|span)>
     * </li>
     *
     * @param label {string} - key name
     * @param val {Object | Array | string | number | boolean | null} - a value of node
     * @param isLast {boolean} - true if node is last in list of siblings
     * 
     * @return {Node}
     */
    function Node(label, val, isLast, options) {
        var nodeType = Utils.getType(val);
        switch(nodeType){
            case "boolean": return new NodeBoolean(label, val, isLast);
            case "number": return new NodeNumber(label, val, isLast);
            case "string": return new NodeString(label, val, isLast);
            case "null": return new NodeNull(label, val, isLast);
            case "buffer": return new NodeBuffer(label, val, isLast);
            case "array": return new NodeArray(label, val, isLast);
            case "object": return new NodeObject(label, val, isLast, options);
            default: throw new Error(`not support type:${nodeType}`);
        }
    }

    function RootNode(label, val, isLast, options) {
        var nodeType = Utils.getType(val);

        switch(nodeType){
            case "boolean": return new NodeBoolean(label, val, isLast);
            case "number": return new NodeNumber(label, val, isLast);
            case "string": return new NodeString(label, val, isLast);
            case "null": return new NodeNull(label, val, isLast);
            case "buffer": return new NodeBuffer(label, val, isLast);

            case "array": return new NodeArray(label, val, isLast, options);
            case "object": return new NodeObject(label, val, isLast, options);
            default: throw new Error(`not support type:${nodeType}`);
        }
    }
    
    /* ---------- The tree constructor ---------- */
    
    /*
     * The constructor for json tree.
     * It contains only one Node (Array or Object), without property name.
     * CSS-styles of .tree define main tree styles like font-family,
     * font-size and own margins.
     *
     * Markup:
     * <ul class="jsontree_tree clearfix">
     *     {Node}
     * </ul>
     *
     * @constructor
     * @param jsonObj {Object | Array} - data for tree
     * @param domEl {DOMElement} - DOM-element, wrapper for tree
     */
    class Tree{
        constructor(jsonObj, domEl, rootFilter, keysort) {
            this.wrapper = document.createElement('ul');
            this.wrapper.className = 'jsontree_tree clearfix';
            
            this.rootNode = null;
            this.domEl = domEl;
            
            this.sourceJSONObj = jsonObj;
            this.rootFilter = rootFilter;
            this.keysort = keysort;

            this.loadData(jsonObj);
            this.appendTo(domEl);
        }

        /**
         * Fill new data in current json tree
         *
         * @param {Object | Array} jsonObj - json-data
         */
        loadData(jsonObj) {
            if (!Utils.isValidRoot(jsonObj)) {
                alert('The root should be an object or an array');
                return;
            }

            this.sourceJSONObj = jsonObj;
            
            const options = {
                rootFilter: this.rootFilter, 
                keysort: this.keysort
            }

            this.rootNode = RootNode(null, jsonObj, 'last', options);
            this.wrapper.innerHTML = '';
            this.wrapper.appendChild(this.rootNode.el);
        }
        
        /**
         * Appends tree to DOM-element (or move it to new place)
         *
         * @param {DOMElement} domEl 
         */
        appendTo(domEl) {
            domEl.appendChild(this.wrapper);
        }
        
        /**
         * Expands all tree nodes (objects or arrays) recursively
         *
         * @param {Function} filterFunc - 'true' if this node should be expanded
         */
        expand(filterFunc) {
            if (this.rootNode.isComplex) {
                if (typeof filterFunc == 'function') {
                    this.rootNode.childNodes.forEach((item, i)=> {
                        if (item.isComplex && filterFunc(item)) {
                            item.expand();
                        }
                    });
                } else {
                    this.rootNode.expand('recursive');
                }
            }
        }

        /**
         * Collapses all tree nodes (objects or arrays) recursively
         */
        collapse() {
            if (typeof this.rootNode.collapse === 'function') {
                this.rootNode.collapse('recursive');
            }
        }

        /**
         * Returns the source json-string (pretty-printed)
         * 
         * @param {boolean} isPrettyPrinted - 'true' for pretty-printed string
         * @returns {string} - for exemple, '{"a":2,"b":3}'
         */
        toSourceJSON(isPrettyPrinted) {
            if (!isPrettyPrinted) {
                return JSON.stringify(this.sourceJSONObj);
            }

            var DELIMETER = "[%^$#$%^%]",
                jsonStr = JSON.stringify(this.sourceJSONObj, null, DELIMETER);

            jsonStr = jsonStr.split("\n").join("<br />");
            jsonStr = jsonStr.split(DELIMETER).join("&nbsp;&nbsp;&nbsp;&nbsp;");

            return jsonStr;
        }

        /**
         * Find all nodes that match some conditions and handle it
         */
        findAndHandle(matcher, handler) {
            this.rootNode.findChildren(matcher, handler, 'isRecursive');
        }

        /**
         * Unmark all nodes
         */
        unmarkAll() {
            this.rootNode.findChildren((node)=> {
                return true;
            }, (node)=> {
                node.unmark();
            }, 'isRecursive');
        }

        clear() {
            while (this.domEl.firstChild) {
                this.domEl.removeChild(this.domEl.firstChild);
            }
        }
    };

    /* ---------- Public methods ---------- */
    return {
        /**
         * Creates new tree by data and appends it to the DOM-element
         * 
         * @param jsonObj {Object | Array} - json-data
         * @param domEl {DOMElement} - the wrapper element
         * @param rootFilter {Function} - filter root elements
         * @returns {Tree}
         */
        create : function(jsonObj, domEl, rootFilter, keysort) {
            return new Tree(jsonObj, domEl, rootFilter, keysort);
        }
    };
})();