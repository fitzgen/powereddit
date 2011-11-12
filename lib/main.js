/*jslint onevar: false, undef: true, eqeqeq: true, bitwise: true,
  newcap: true, immed: true, nomen: false, white: false, plusplus: false,
  laxbreak: true */

/*global require, exports, console */

var data = require('self').data;
var widget = require('widget');
var setTimeout = require('timers').setTimeout;
var tabs = require('tabs');
var contentExtractor = require('content-extractor');
var pageMod = require('page-mod');

function poweredditTab (tab) {
    var worker;

    console.log("replaced = " + tab.url.replace(/\?.*$/, ''));
    console.log("matches? " + tab.url.replace(/\?.*$/, '').match(/\.com\/?$/));

    if ( tab.url.match(/\/comments\//g) ) {
        worker = tab.attach({
            contentScriptFile: data.url('comments.js')
        });
    }

    // Can't blindly just do the addon for the rest of reddit pages because
    // then the page to browse reddit subscriptions won't work, as well as
    // user pages, etc.
    else if ( tab.url.match(/\/r\//g)
              || tab.url.replace(/\?.*$/, '').match(/\.com\/?$/) ) {
        worker = tab.attach({
            contentScriptFile: data.url('f7u12.js')
        });

        worker.port.on('extract', function (msg) {
            msg = JSON.parse(msg);
            contentExtractor.extract(msg.url, function (content) {
                worker.port.emit('data', JSON.stringify({
                    id: msg.id,
                    content: content
                }));
            });
        });

        worker.port.on('open-page', tabs.open.bind(tabs));
    }
}

pageMod.PageMod({
    include: ['*.reddit.com'],
    contentScriptWhen: 'end',
    contentScript: '',
    onAttach: function (worker) {
        poweredditTab(worker.tab);
    }
});

// Create a widget which activates the addon for the current tab when the widget
// is clicked.
// widget.Widget({
//     id: 'powereddit',
//     label: 'Powereddit',
//     contentURL: data.url('icon.png'),
//     onClick: poweredditTab,
//     width: 20
// });
