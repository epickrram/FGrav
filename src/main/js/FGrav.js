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

function FGrav(w, h, margin, fontSize, title, _w) {
    _w = (typeof _w !== 'undefined') ? _w : window;
    var _loc = _w.location.search;
    var _d = _w.document;

    this.margin = margin;
    this.width = this.getParameter("width", w, _loc);
    this.forcedWidth = this.getParameter("width", undefined, _loc);
    this.height = this.getParameter("height", h, _loc);
    this.forcedHeight = this.getParameter("height", undefined, _loc);
    this.title = title;
    this.fontSize = fontSize;
    this.fontWidthRatio = 0.59;

    waitUntilJQueryIsLoaded(_w);

    this.svg = _d.getElementsByTagName("svg")[0];


    function waitUntilJQueryIsLoaded(_w) {
        if (!(_w.jQuery)) {
            setTimeout(function() { waitUntilJQueryIsLoaded(_w) }, 10);
        }
    }

}

FGrav.prototype.loadDynamicJs = function(urls, successCallback, errorCallback) {
    var response = new FGravResponse();
    var ajaxObjs = [];
    var jsSrc = [];
    $.each(urls, function (i, url) {
        var ajax = $.ajax({ type: "GET",
            url: url,
            dataType: 'text',
            success: function(data) {
                jsSrc[i] = data;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                response.addError(errorThrown, textStatus);
            }
        });
        ajaxObjs[i] = ajax;
    });
    $.when.apply($, ajaxObjs)
        .then(function () {
            if (response.isSuccess()) {
                $.each(jsSrc, function (i, src) {
                    // TODO DOES NOT WORK. HAD TO RESORT TO EVAL!!!
                    // var loadedScript = document.createElement('script');
                    // loadedScript.type = "text/javascript";
                    // loadedScript.innerHTML = data;
                    // loadedScript.text = data;
                    //
                    // svg.children[1].parentNode.insertBefore(loadedScript, svg.children[1].nextSibling);
                    eval(src);
                });
                successCallback(response);
            } else {
                errorCallback(response);
            }
        });
};

FGrav.prototype.getParameter = function(parameterName, defaultValue, _loc) {
    _loc = (typeof _loc !== 'undefined') ? _loc : location.search;
    var result = defaultValue,
        tmp = [];
    var items = _loc.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
};

FGrav.prototype.getRequiredParameter = function(parameterName, _loc) {
    var p = this.getParameter(parameterName, undefined, _loc);
    if (typeof p !== 'undefined') {
        return p;
    }
    throw "You must provide an input parameter \'" + parameterName + "\'";
};