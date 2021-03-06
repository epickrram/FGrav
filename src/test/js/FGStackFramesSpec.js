

describe("FGStackFrames", function() {

    var stackFrames;

    beforeEach(function () {
        stackFrames = new FGStackFrames();
        frameFilter.reset();
    });


    var extractName = function (value, index, array) {
        return value.name;
    };

    var extractSamples = function (value, index, array) {
        return value.samples;
    };

    describe("when loadCollapsed invoked ", function () {

        beforeEach(function() {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest("test.collapsed").andReturn({
                responseText:
                    "a;b;c 1\n" +
                    "a;b;d 2\n" +
                    "a;x;d 3\n"
            });
            frameFilter.reset();
            frameFilter.filters.push(filterDefault);
        });

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });

        it("should load collapsed file", function () {
            stackFrames.loadCollapsed(new FG(), "test.collapsed");

            var request = jasmine.Ajax.requests.mostRecent();
            expect(request.url).toBe("test.collapsed");
            expect(request.method).toBe('GET');

            expect(stackFrames.stackFrameRows.length).toEqual(3);
            expect(stackFrames.stackFrameRows[0].map(extractName)).toEqual(['a']);
            expect(stackFrames.stackFrameRows[0].map(extractSamples)).toEqual([6]);
            expect(stackFrames.stackFrameRows[1].map(extractName)).toEqual(['b', 'x']);
            expect(stackFrames.stackFrameRows[1].map(extractSamples)).toEqual([3, 3]);
            expect(stackFrames.stackFrameRows[2].map(extractName)).toEqual(['c', 'd', 'd']);
            expect(stackFrames.stackFrameRows[2].map(extractSamples)).toEqual([1, 2, 3]);
        });

        it("should generate all frame with total samples as its samples count", function () {
            var fg = new FG();
            stackFrames.loadCollapsed(fg, "test.collapsed");
            var all = stackFrames.allFrame(fg);

            expect(all.name).toEqual("all");
            expect(all.samples).toEqual(6);

        });
    });

    describe("calculations post stack frames creation", function () {

        var fg;

        beforeEach(function() {
            fg = new FG();
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest("test.collapsed").andReturn({
                responseText:
                    "a;b;c 10\n" +
                    "a;b;d 20\n" +
                    "a;x;d 30\n"
            });
            jasmine.Ajax.stubRequest("test_many_samples_with_small_minimum.collapsed").andReturn({
                responseText:
                    "a;b;c 1\n" +
                    "d;e;f 100\n" +
                    "a;b;d 200\n" +
                    "a;x;d 3000\n"
            });
            jasmine.Ajax.stubRequest("test_large_path.collapsed").andReturn({
                responseText:
                    "a;b;c 10\n" +
                    "a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;" +
                    "a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;" +
                    "a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;" +
                    "a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;" +
                    "a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;" +
                    "a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z 100\n"
            });
            frameFilter.filter = filterDefault;
            colorScheme.legend = {
                red: 'items',
                blue: 'more items'
            };
        });

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });

        it("should keep default dimensions when freezeDimensions is true", function () {
            fg.freezeDimensions = true;

            stackFrames.loadCollapsed(fg, "test.collapsed");

            expect(fg.width).toEqual(1200);
            expect(fg.height).toEqual(2200);
            expect(fg.frameHeight).toEqual(15);
            expect(fg.margin).toEqual(24);
            expect(fg.fontSize).toEqual(12);
            expect(fg.textPadding).toEqual(10.5);
        });

        it("should calculate dimensions based on stack frames", function () {
            stackFrames.loadCollapsed(fg, "test.collapsed");

            expect(fg.width).toEqual((2 * 24) + (60 * 14));
            expect(fg.height).toEqual((3 + 2 + 1) * (15 + 2) + (24 * 4)); // 3 = maxLevel, 2 = legend size
        });

        it("should modify margin and font when width is tight", function () {
            stackFrames.loadCollapsed(fg, "test_many_samples_with_small_minimum.collapsed");

            expect(fg.width).toEqual(1200);
            expect(fg.margin).toEqual(8);
            expect(fg.fontSize).toEqual(8);
        });

        it("should modify frame height font and text padding when height is tight", function () {
            stackFrames.loadCollapsed(fg, "test_large_path.collapsed");

            expect(fg.frameHeight).toEqual(14);
            expect(fg.fontSize).toEqual(8);
            expect(fg.textPadding).toEqual(8);
        });
    });
});