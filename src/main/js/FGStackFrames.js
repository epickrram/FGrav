/************************************************************************
 Copyright 2020 eBay Inc.
 Author/Developer: Amir Langer

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 **************************************************************************/
function FGStackFrames() {
    this.totalSamples = -1;
    this.stackFrameRows = null;
}


FGStackFrames.prototype.loadCollapsed = function(fg, collapsedUrl, successCallback, errorCallback, collapsed) {
    collapsed = (typeof collapsed !== 'undefined') ? collapsed : new Collapsed();
    var response = new FGravResponse();
    var stackFrames = this;
    $.ajax({
        type: "GET",
        url: collapsedUrl,
        dataType: "text",
        processData: false,
        success : function(data) {
            var rows = [];
            // var framesMap = {};
            var codePaths = data.split("\n");
            $.each(frameFilter.filters, function () {
                codePaths = codePaths.map(this).filter(ignoreNull);
            });
            codePaths = codePaths.sort();
            collapsed.parseCollapsed(codePaths);
            stackFrames.calculateWidth(fg, collapsed.totalSamples, collapsed.minSample, collapsed.paths.length);
            stackFrames.totalSamples = collapsed.totalSamples;
            var row = [];
            var ptr = 0;
            var lastP;
            var level = 0;
            while (ptr >= 0) {
                var p = collapsed.paths[ptr].popFrame();
                if (p) {
                    var currentFrame;
                    if (collapsed.paths[ptr].pathStr === lastP) {
                        currentFrame = row.pop();
                        collapsed.updateFrame(currentFrame, collapsed.paths[ptr], ptr);
                    }
                    else {
                        currentFrame = stackFrame(p, collapsed, ptr, level, collapsed.paths[ptr]);
                        // framesMap[collapsed.paths[ptr].pathStr] = currentFrame;
                    }
                    lastP = collapsed.paths[ptr].pathStr;
                    row.push(currentFrame);
                }
                var currentPtr = ptr + 1;
                ptr = containsPaths(collapsed.paths, currentPtr);
                if (ptr < currentPtr) {
                    rows.push(row);
                    row = [];
                    level++;
                    lastP = undefined;
                }
            }
            if (row.length > 0) {
                rows.push(row);
            }
            collapsed.calculateOffsets(fg.width, fg.margin, fg.minDisplaySample);
            stackFrames.calculateHeight(fg, collapsed.maxLevel);
            stackFrames.stackFrameRows = rows;
            // stackFrames.stackFrameByPath = framesMap;

            successCallback(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            response.setError(errorThrown, textStatus);
            errorCallback(response);
        }
    });


    function stackFrame(name, collapsed, col, level, path) {
        var frame = {
            name: name,
            samples: 0,
            lastStackIndex: -1,
            stack: path.pathStr,
            level: level,
            w: function() {
                return collapsed.frameWidth(fg.width, fg.margin, this.samples);
            },
            x: function() {
                var n = fg.margin + collapsed.offset[this.lastStackIndex] - this.w();
                return parseFloat(n.toFixed(4));
            },
            y: function() {
                return fg.height - fg.margin - (fg.frameHeight * (this.level + 3)); // 3 = details, all, self
            },
            toString: function() {
                return this.name + ", samples: " + this.samples + ", i:" + this.lastStackIndex + ", x:" + this.x() + ", y:" + this.y() + ", w: " + this.w();
            }
        };
        collapsed.updateFrame(frame, path, col);
        return frame;
    }

    function containsPaths(paths, ptr) {
        var i;
        for (i = ptr; i < paths.length; i++) {
            if (paths[i].path.length > 0) {
                return i;
            }
        }
        for (i = 0; i < ptr; i++) {
            if (paths[i].path.length > 0) {
                return i;
            }
        }
        return -1;
    }
    
    function ignoreNull(f) {
        return f != null;
    }
};

FGStackFrames.prototype.allFrame = function(fg) {
    var stackFrames = this;
    return {
        name: "all",
        samples: stackFrames.totalSamples,
        stack: ";all",
        w: function() {
            return fg.width - (2 * fg.margin);
        },
        x: function() {
            return fg.margin;
        },
        y: function() {
            return fg.height - fg.margin - (2 * fg.frameHeight);
        },
        toString: function() {
            return this.name + ", samples: " + this.samples + ", i:" + this.lastStackIndex + ", x:" + this.x() + ", y:" + this.y() + ", w: " + this.w();
        }
    };
};

FGStackFrames.prototype.calculateWidth = function(fg, totalSamples, minSample, numberOfPaths) {
    if (!fg.freezeDimensions) {
        if (((fg.width - (2 * fg.margin) - numberOfPaths) / totalSamples) < minSample) {
            fg.fontSize = Math.min(fg.fontSize, 8);
            fg.margin = 8;
        }
        if (!fg.forcedWidth) {
            fg.width = Math.min(fg.width, (fg.margin * 2) + (totalSamples * fg.sampleCoefficient));
        }
    }
    fg.minDisplaySample = fg.minwidth / ((fg.width - (2 * fg.margin) - fg.shiftWidth) / totalSamples);
};


FGStackFrames.prototype.calculateHeight = function (fg, maxLevel) {
    if (!fg.freezeDimensions) {
        var neededFrameHeight = Math.floor(fg.height / maxLevel);
        if (neededFrameHeight < fg.frameHeight) {
            neededFrameHeight = Math.max(fg.frameHeight - 4, Math.floor(neededFrameHeight));
            setHeightParameters(fg, neededFrameHeight, 8, 8);
        }
        if (!fg.forcedHeight) {
            var additional = (colorScheme.legend) ? Object.keys(colorScheme.legend).length : 0;
            fg.height = Math.min(fg.height, ((maxLevel + additional + 1) * (fg.frameHeight + 2)) + (fg.margin * 4));
        }
    }

    function setHeightParameters(fg, h, f, p) {
        fg.frameHeight = h;
        fg.fontSize = f;
        fg.textPadding = p;
    }
};
