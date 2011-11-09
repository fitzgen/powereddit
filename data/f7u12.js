/*jslint onevar: false, undef: true, eqeqeq: true, bitwise: true,
  newcap: true, immed: true, nomen: false, white: false, plusplus: false,
  laxbreak: true */

/*global window, document, expando_child, self */

(function () {

    var slice = Array.prototype.slice;

    function $ (selector, ctx) {
        ctx = ctx || document.body;
        return slice.call(ctx.querySelectorAll(selector));
    }

    function complement (fn) {
        return function () {
            return !fn.apply(this, arguments);
        };
    }

    function isSponsored (div) {
        return $('a.title', div)[0].rel === "nofollow";
    }

    function linksToImage (a) {
        return a.href.match(/\.(png|jpg|jpeg|gif)$/) !== null;
    }

    function hasClass(node, cls) {
        return node.className.indexOf(cls) !== -1;
    }

    function styleImage (img) {
        img.style.margin = '2em';
        img.style.border = '1px solid black';
        img.style.maxWidth = '1000px';
    }

    function makeImage (src) {
        var img = document.createElement('img');
        img.src = src;
        styleImage(img);
        return img;
    }

    function attachAfter (node, newNode) {
        node.parentNode.insertBefore(newNode, node);
        node.parentNode.insertBefore(node, newNode);
    }

    function linksToImgur (a) {
        return a.href.indexOf('imgur.com') !== -1;
    }

    function quickMemeExtractSrc (a) {
        return 'http://i.qkme.me/'
            + a.href.replace(/\?id=\w+/, '').match(/(\w+)\/?$/)[1]
            + '.jpg';
    }

    function linksToQuickMeme (a) {
        return a.href.indexOf('qkme.me') !== -1
            || a.href.indexOf('quickmeme.com') !== -1;
    }

    function click (el) {
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("click", true, true, window,
                             0, 0, 0, 0, 0, false, false, false,
                             false, 0, null);
        el.dispatchEvent(event);
    }

    function main () {
        var entries = [];
        var i = 0;
        var content = document.createElement('div');
        var nextprev = $('p.nextprev')[0];

        content.style.textAlign = 'center';

        // Get all entries
        $('#siteTable div.thing.link')
            .filter(complement(isSponsored))
            .forEach(function (e) {
                entries.push(e);
            });

        // Clear the content
        $('#siteTable').forEach(function (div) {
            div.innerHTML = '';
        });

        // Add our own content div
        nextprev.parentNode.insertBefore(content, nextprev);

        function hideEntry () {
            var node;
            while ( (node = content.firstChild) ) {
                content.removeChild(node);
            }
        }

        function imgurExtractSrc (a) {
            return a.href.replace(/\?.*/, "") + ".png";
        }

        function showEntry (entry) {
            var link, expando;

            hideEntry();
            window.scroll(0, 0);

            if ( entry ) {
                link = $('a.title', entry)[0];
                content.appendChild(entry);
                if ( linksToImage(link) ) {
                    return content.appendChild(makeImage(link));
                } else if ( linksToImgur(link) ) {
                    return content.appendChild(makeImage(imgurExtractSrc(link)));
                } else if ( linksToQuickMeme(link) ) {
                    return content.appendChild(makeImage(quickMemeExtractSrc(link)));
                } else if ( (expando = $('div.expando', entry)[0]) ) {
                    try {
                        return expando_child(expando); // expando_child is a reddit global
                    } catch (x) {}
                }

                // Have to move this out of if/else above because I am getting
                // weird bugs in expando when it shouldn't expand.
                return self.port.emit('extract', JSON.stringify({
                    id: i,
                    url: link.href
                }));
            } else {
                content.innerHTML = "<h1>No more items on this page.</h1>";
            }

        }

        function next () {
            showEntry(entries[++i]);
            if ( i >= entries.length ) {
                i = entries.length;
            }
        }

        function prev () {
            showEntry(entries[--i]);
            if ( i < 0 ) {
                i = -1;
            }
        }

        // Keyboard navigation controls.
        document.addEventListener('keyup', function (event) {
            var arrow;
            switch ( event.keyCode ) {
            case 75: // K : previous story
                event.preventDefault();
                prev();
                break;
            case 74: // J : next story
                event.preventDefault();
                next();
                break;
            case 13: // Return : open story in new tab
                event.preventDefault();
                self.port.emit('open-page', $('a.title', content)[0].href);
                break;
            case 67: // C : open comments in new tab
                event.preventDefault();
                self.port.emit('open-page', $('a.comments', content)[0].href);
                break;
            case 85: // U : upvote
                event.preventDefault();
                arrow = $('.arrow.up', entries[i])[0];
                if ( arrow ) {
                    click(arrow);
                }
                break;
            case 68: // D : downvote
                event.preventDefault();
                arrow = $('.arrow.down', entries[i])[0];
                if ( arrow ) {
                    click(arrow);
                }
                break;
            case 78: // N : next page
                event.preventDefault();
                click($('a[rel="nofollow next]"')[0]);
                break;
            case 80: // P : prev page
                event.preventDefault();
                click($('a[rel="nofollow prev"]')[0]);
                break;
            }
        }, false);

        // Clicking on the image that we added makes it go next.
        content.addEventListener('click', function (event) {
            if ( event.target.nodeName === 'IMG' ) {
                event.preventDefault();
                next();
            }
        }, false);

        self.port.on("data", function (msg) {
            msg = JSON.parse(msg);
            var div = document.createElement('div');
            div.style.textAlign = 'left';
            div.innerHTML = msg.content;
            content.appendChild(div);
        });

        showEntry(entries[i]);
    }

    main();

}());
