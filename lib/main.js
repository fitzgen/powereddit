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

// List of tabs which are currently running this addon (have the content script
// injected). Who cares if it is O(n) lookup? I haven't seen anyone have enough
// tabs open, all on reddit, to make this a bottelneck :)
var tabsRunningAddon = [];

tabs.on('close', function (tab) {
    var idx = tabsRunningAddon.indexOf(tab);
    if ( idx >= 0 ) {
        tabsRunningAddon.splice(idx, 1);
    }
});

function poweredditTab () {
    var worker;

    if ( tabsRunningAddon.indexOf(tabs.activeTab) === -1 ) {

        tabsRunningAddon.push(tabs.activeTab);

        if ( tabs.activeTab.url.match(/\/comments\//g) ) {

            worker = tabs.activeTab.attach({
                contentScriptFile: data.url('comments.js')
            });

        } else {

            worker = tabs.activeTab.attach({
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

    } // else {

    //     // Already running the content script, and since there is currently
    //     // no way to go back to the old version of reddit, just reload the
    //     // page and don't include the content script.

    //     tabs.activeTab.attach({
    //         contentScript: "window.location.reload();"
    //     });

    //     var idx = tabsRunningAddon.indexOf(tabs.activeTab);
    //     if ( idx >= 0 ) {
    //         tabsRunningAddon.splice(idx, 1);
    //     }

    // }
}

pageMod.PageMod({
    include: ['*.reddit.com'],
    contentScriptWhen: 'end',
    contentScript: '',
    onAttach: function (worker) {
        poweredditTab();
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
