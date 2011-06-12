/*jslint onevar: false, undef: true, eqeqeq: true, bitwise: true,
  newcap: true, immed: true, nomen: false, white: false, plusplus: false,
  laxbreak: true */

/*global window, document, expando_child, self, hidecomment, showcomment, reply */

(function () {

    var slice = Array.prototype.slice;

    function $ (selector, ctx) {
        ctx = ctx || document.body;
        return slice.call(ctx.querySelectorAll(selector));
    }

    var comments = $("div.thing.comment");
    var commentsLength = comments.length;

    // Always points to the comment that is currently active. Reference this in
    // all the handlers, etc.
    var activeComment;
    // Always has the index of the active comment in the list of all comments in
    // this page.
    var activeIndex;

    function height (el) {
        return el
            ? el.offsetTop + height(el.offsetParent)
            : 0;
    }

    function addClass (cls, el) {
        el.className += ' ' + cls;
    }

    function removeClass (cls, el) {
        el.className = el.className.replace(new RegExp('\\b' + cls + '\\b', 'g'),
                                            '');
    }

    function focus (comment) {
        activeComment = comment;
        addClass('border', $('.usertext', comment)[0]);
        window.scroll(0, height(comment) - window.screen.height / 4);
    }

    var currentlyEditingTextarea = false;
    $('div.commentarea')[0].addEventListener('focus', function (event) {
        if ( event.target.nodeName === "TEXTAREA" ) {
            currentlyEditingTextarea = true;
        }
    }, true);
    $('div.commentarea')[0].addEventListener('blur', function (event) {
        if ( event.target.nodeName === "TEXTAREA" ) {
            currentlyEditingTextarea = false;
        }
    }, true);

    function click (el) {
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("click", true, true, window,
                             0, 0, 0, 0, 0, false, false, false,
                             false, 0, null);
        el.dispatchEvent(event);
    }

    document.addEventListener('keyup', function (event) {
        var el;
        if ( ! currentlyEditingTextarea ) {
            switch ( event.keyCode ) {
            case 75: // K : previous comment
                while ( activeIndex > 0 ) {
                    activeIndex--;
                    if ( height(comments[activeIndex]) > 0 ) {
                        removeClass('border', $('.border', activeComment)[0]);
                        focus(comments[activeIndex]);
                        break;
                    }
                }
                break;
            case 74: // J : next comment;
                while ( activeIndex < commentsLength - 1 ) {
                    activeIndex++;
                    if ( height(comments[activeIndex]) > 0 ) {
                        removeClass('border', $('.border', activeComment)[0]);
                        focus(comments[activeIndex]);
                        break;
                    }
                }
                break;
            case 85: // U : upvote comment
                el = $('.arrow.up', activeComment)[0];
                if ( el ) {
                    click(el);
                }
                break;
            case 68: // D : downvote comment
                el = $('.arrow.down', activeComment)[0];
                if ( el ) {
                    click(el);
                }
                break;
            case 67: // C : collapse thread
                el = $('a.expand', activeComment)[0];
                if ( el ) {
                    hidecomment(el);
                }
                break;
            case 69: // E : expand thread
                el = $('a.expand', activeComment)[0];
                if ( el ) {
                    showcomment(el);
                }
                break;
            case 82: // R : reply
                reply($('a[href="javascript:void(0)"]', activeComment)[0]);
                break;
            }
        }
    }, false);


    // Init.
    activeIndex = 0;
    focus(comments[0]);

}());