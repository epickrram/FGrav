describe("FG", function() {

    var loc;
    var fg;
    var g;
    var textNode;

    beforeEach(function () {
        fg = new FG(undefined, 2, "TITLE", loc);
        fg.details = {};
        fg.tooltip = {

            attr: new Map(),
            setAttribute: function(k, v) {
                this.attr.set(k, v);
            },
            getAttribute: function(k) {
                return this.attr.get(k);
            }
        };

        textNode = {
            attributes: {
                name: {
                    value: "NAME"
                },
                samples: {
                    value: "17"
                },
                attr: {
                    value: "VALUE"
                }
            },
            setAttribute: function (k, v) {
                this.attributes[k] = v;
            },
            removeAttribute: function (k) {
                this.attributes[k] = undefined;
            }
        };

        g = {
            querySelectorAll: function (selector) {
                return (selector === "text") ? [ textNode ] : [];
            }
        };
    });

    describe("when loading", function() {
       it("should generate urls from names", function () {
            fg.colorSchemeName = "ColorScheme";
            fg.frameFilterNames = "FrameFilter";

            var urls = fg.urlsToLoad();

            expect(urls.length).toBe(2);
            expect(urls[0]).toEqual("js/color/FG_Color_ColorScheme.js");
            expect(urls[1]).toEqual("js/frame/FG_Filter_FrameFilter.js");

        });

        it("should generate multiple urls", function () {
            fg.colorSchemeName = "ColorScheme";
            fg.frameFilterNames = "FrameFilter1,FrameFilter2,/js/MyCustomFilter.js";

            var urls = fg.urlsToLoad();

            expect(urls.length).toBe(4);
            expect(urls[0]).toEqual("js/color/FG_Color_ColorScheme.js");
            expect(urls[1]).toEqual("js/frame/FG_Filter_FrameFilter1.js");
            expect(urls[2]).toEqual("js/frame/FG_Filter_FrameFilter2.js");
            expect(urls[3]).toEqual("js/MyCustomFilter.js");

        });
    });

    describe("when invoking get functions on elements in FG ", function () {

        it("should append id to name", function() {
            fg.id = "ID_";

            expect(fg.namePerFG("X")).toEqual("ID_X");
        });

        it("if no id then should return the name", function() {
            expect(fg.namePerFG("X")).toEqual("X");
        });

        it("should return group name", function () {
            expect(g_name(g)).toEqual("NAME");
        });

        it("should return group samples", function () {
            expect(g_samples(g)).toEqual(17);
        });

        it("g_to_func should also return group name", function () {
            expect(g_to_func(g)).toEqual("NAME");
        });

        it("should return group name samples and percentage", function () {
            fg.totalSamples = 170;

            expect(fg.g_details(g).details).toEqual("NAME (17 samples, 10%)");
            expect(fg.g_details(g).tip).toEqual("NAME (17 samples, 10%)");
        });
    });

    describe("when handle group details and tooltip", function () {

        it("should show given details", function() {
            fg.showDetails(g, 0, 0, { tip: "TIP", details:"DETAILS" });
            expect(fg.details.nodeValue).toEqual("DETAILS");
        });


        it("should clear details and hide tooltip", function () {
           fg.clearDetails(g);
            expect(fg.details.nodeValue).toEqual(" ");
            expect(fg.tooltip.getAttribute("visibility")).toEqual("hidden");
        });
    });

    describe("when deal with original values", function () {


        it("should store value as an attribute", function() {
            orig_save(textNode, "attr", "val");
            expect(textNode.attributes._orig_attr).toEqual("val");
        });

        it("should store original value as an attribute", function() {
            orig_save(textNode, "attr");
            expect(textNode.attributes._orig_attr).toEqual("VALUE");
        });

        it("should store original value and load it back in element attributes", function() {
            textNode.attributes["attr"] = "MY VALUE";
            orig_save(textNode, "attr");
            orig_load(textNode, "attr");
            expect(textNode.attributes.attr).toEqual("MY VALUE");
        });

        it("original load removes orig attribute", function() {
            orig_save(textNode, "attr");
            expect(textNode.attributes._orig_attr).toEqual("VALUE");
            orig_load(textNode, "attr");
            expect(textNode.attributes._orig_attr).toEqual(undefined);
        });
    });

    describe("when invoking zoom and unzoom", function () {

        var a, b, c, children;

        beforeEach(function () {

            a = domGroupElement();
            b = domGroupElement();
            c = domGroupElement();
            children = [];

            fg.svg = {
                getElementById: function (id) {
                    return {
                        children: children
                    }
                }
            };

            fg.unzoombtn = domElement();
        });

        it("unzoom should hide unzoom button", function() {
            fg.unzoom();
            expect(fg.unzoombtn.classList.class).toEqual(["hide"]);
        });

        it("unzoom should remove parent and hide class", function() {
            children = [a, b, c];
            children.forEach(function (el) {
                el.classList.add('hide');
                el.classList.add('parent');
            });
            fg.unzoom();
            expect(a.classList.class.length).toBe(0);
            expect(b.classList.class.length).toBe(0);
            expect(c.classList.class.length).toBe(0);
        });


        it("zoom should expose unzoom button", function() {
            var g = domGroupElement();
            g.rect.setAttributes("width", "17", "x", "19", "y", "23");
            fg.zoom(g);

            expect(fg.unzoombtn.classList.class).toEqual([]);
        });

        it("zoom should add parent class to parent of pressed node", function() {
            var g = domGroupElement();
            children = [g, a];
            children.forEach(function (el, i) {
                el.rect.setAttributes("width", "17", "x", "19", "y", "23" + i);
                el.text.setAttributes("name", "name"+i, "x", "19", "y", "23"+i);
            });

            fg.zoom(g);

            expect(a.classList.class).toEqual([ "parent" ]);
        });

        it("zoom should add hide class to non related node", function() {
            var g = domGroupElement();
            children = [g, a];
            children.forEach(function (el, i) {
                el.rect.setAttributes("width", "17", "x", "19"+(i*10), "y", "23");
                el.text.setAttributes("name", "name"+i, "x", "19"+(i*10), "y", "23");
            });

            fg.zoom(g);

            expect(a.classList.class).toEqual([ "hide" ]);
        });

    });

    function domElement() {
        return {
            attributes: {},
            getAttribute: function(k) {
                return this.attributes[k];
            },
            setAttribute: function(k, v) {
                this.attributes[k] = { value: v };
            },
            setAttributes: function(k1, v1, k2, v2, k3, v3) {
                this.setAttribute(k1, v1);
                this.setAttribute(k2, v2);
                this.setAttribute(k3, v3);
            },
            classList: {
                class: [],
                add: function (c) {
                    this.class.push(c);
                },
                remove: function (c) {
                    this.class = this.class.filter(function(e) { return e !== c });
                }
            }
        };
    }

    function domGroupElement() {
        var el = domElement();
        el.rect = domElement();
        el.text = domElement();
        el.querySelectorAll = function (selector) {
            if (selector === 'rect') {
                return [this.rect];
            }
            if (selector === 'text') {
                return [this.text];
            }

            return [];
        };
        return el;
    }

});