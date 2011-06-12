/*jslint onevar: false, undef: true, eqeqeq: true, bitwise: true,
  newcap: true, immed: true, nomen: false, white: false, plusplus: false,
  laxbreak: true */

/*global require, exports, console */

var request = require('request');
var setTimeout = require('timers').setTimeout;

function contentExtractor (url) {
    return "http://boilerpipe-web.appspot.com/extract"
        + "?extractor=LargestContentExtractor&output=text&url="
        + encodeURIComponent(url);
}

function fetchPage (url, callback) {
    var req = request.Request({
        url: contentExtractor(url),
        onComplete: function (response) {
            callback(
                response
                    .text
                    .split(/\n+/g)
                    .map(function (p) {
                        return '<p style="margin: 2em 5em; width: 60em; font-size:12px">'
                            + p + '</p>';
                    })
                    .join('\n')
            );
        }
    });
    req.get();
}

var cache = {};

exports.extract = function (url, fn) {
    if ( url in cache ) {
        setTimeout(function () {
            fn(cache[url]);
        }, 4);
    } else {
        fetchPage(url, function (content) {
            cache[url] = content;

            // Invalidate cache to prevent memory leaks.
            setTimeout(function () {
                cache[url] = null;
                delete cache[url];
            }, 1000 * 60 * 60);

            fn(content);
        });
    }
};