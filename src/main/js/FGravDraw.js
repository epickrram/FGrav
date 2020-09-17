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

function FGravDraw(fgrav) {
    this.fgrav = fgrav;
    this.svg = fgrav.svg;
}

// accessed from eval (yes, I know, see below)
// and global to the window
var colorScheme = {
    colorFor: function() {
        throw Error("Did not load any color scheme");
    },
    reset: function() {
        this.colorFor = function() {
            throw Error("Did not load any color scheme");
        }
        this.legend = {};
    },
    legend: {}
};

function escText(text) {
    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    return text.replace(/>/g, "&gt;");
}

// accessed from potentially remote code evaluated only when loaded.
function colorValueFor(palette, name, value) {
    var v = typeof value !== 'undefined' ? value : Math.random();
    var colorVar = typeof name !== 'undefined' ? colorVarianceBy(name) : v;

    var r = 0, g = 0, b = 0;

    switch (palette) {
        case "red":
            r = 200 + Math.round(55 * colorVar);
            g = b = 50 + Math.round(80 * colorVar);
            break;
        case "green":
            g = 200 + Math.round(55 * colorVar);
            r = b = 50 + Math.round(60 * colorVar);
            break;
        case "blue":
            b = 205 + Math.round(50 * colorVar);
            r = g = 80 + Math.round(60 * colorVar);
            break;
        case "yellow":
            b = 50 + Math.round(20 * colorVar);
            r = g = 175 + Math.round(55 * colorVar);
            break;
        case "purple":
            g = 80 + Math.round(60 * colorVar);
            r = b = 190 + Math.round(65 * colorVar);
            break;
        case "aqua":
            g = 165 + Math.round(55 * colorVar);
            r = 50 + Math.round(60 * colorVar);
            b = 165 + Math.round(55 * colorVar);
            break;
        case "orange":
            g = 90 + Math.round(65 * colorVar);
            r = 190 + Math.round(65 * colorVar);
            break;
    }
    return "rgb(" + r + "," + g + "," + b + ")";

    function colorVarianceBy(name) {
        var acc = 0;
        var max = 0;
        var weight = 1;
        name = name.split("").reverse().join("");
        for (var i = 0; i < name.length; i++) {
            var c = name.charCodeAt(i);
            acc += (((c * 31 % 256) / 255) * weight);
            max += weight;
            weight *= 0.7;
        }
        return acc / max;
    }
}

FGravDraw.prototype.rect = function(x, y, width, height, fill) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    element.setAttribute("x", x);
    element.setAttribute("y", y);
    element.setAttribute("width", width);
    element.setAttribute("height", height);
    element.setAttribute("fill", fill);

    return element;
};

FGravDraw.prototype.animateWidth = function(from, to, start, duration) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    element.setAttribute("attributeType", "XML");
    element.setAttribute("attributeName", "width");
    element.setAttribute("from", from);
    element.setAttribute("to", (to - from));
    element.setAttribute("begin", start);
    element.setAttribute("dur", duration);
    element.setAttribute("fill", "freeze");
    element.setAttribute("additive", "sum");
    return element;
};

FGravDraw.prototype.animatePosition = function(x, newX, y, newY) {
    y = (y) ? y : 0;
    newY = (newY) ? newY : 0;
    var to = "" + (newX - x) + " " + (newY - y);
    var element = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
    element.setAttribute("type", "translate");
    element.setAttribute("attributeName", "transform");
    element.setAttribute("from", "0 0");
    element.setAttribute("to", to);
    element.setAttribute("begin", "0.5s");
    element.setAttribute("dur", "10s");
    element.setAttribute("fill", "freeze");
    element.setAttribute("additive", "sum");
    return element;
};

FGravDraw.prototype.text = function(text, id, x, y, fontSize, anchor, fill) {
    var element = this.textBox(id, x, y, fontSize, anchor, fill);
    element.innerHTML = escText(text);

    return element;
};

FGravDraw.prototype.textBox = function(id, x, y, fontSize, anchor, fill) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", "text");
    element.setAttribute("x", x);
    element.setAttribute("y", y);
    if (id) element.setAttribute("id", id);
    if (anchor) element.setAttribute("text-anchor", anchor);
    if (fontSize) element.setAttribute("font-size", fontSize);
    if (fill) element.setAttribute("fill", fill);

    return element;
};

FGravDraw.prototype.textToFit = function(text, widthToFit, fontSize) {
    var chars = Math.floor(widthToFit / (this.fgrav.fontWidthRatio * fontSize));

    if (chars < 3 || text.length === 0) {
        return "";
    }

    if (text.length > chars) {
        text = text.substring(0, chars - 2) + "..";
    }

    return text;
};

FGravDraw.prototype.drawError = function(errorMsg) {
    var background = this.rect(0.0, 0, 500, 150, "url(#background)");
    var err = this.text(errorMsg, "error", 250, 75, 17, "middle");

    this.svg.appendChild(background);
    this.svg.appendChild(err);
};