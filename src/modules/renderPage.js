const { forEach } = Array.prototype;
import Link from '../Link';

module.exports = function (page, popstate) {
    document.documentElement.classList.remove('is-leaving')

    // replace state in case the url was redirected
    let link = new Link()
    link.setPath(page.responseURL)

    if (window.location.pathname !== link.getPath()) {
        window.history.replaceState({
                url: link.getPath(),
                random: Math.random(),
                source: "swup",
            },
            document.title,
            link.getPath(),
        );
    }

    // only add for non-popstate transitions
    if (!popstate || this.options.animateHistoryBrowsing) {
        document.documentElement.classList.add('is-rendering')
    }

    this.triggerEvent('willReplaceContent')

    // replace blocks
    for (var i = 0; i < page.blocks.length; i++) {
        document.body.querySelector(`[data-swup="${i}"]`).outerHTML = page.blocks[i]
    }

    // set title
    document.title = page.title;

    this.triggerEvent('contentReplaced')
    this.triggerEvent('pageView')
    if (!this.options.cache) {
        this.cache.empty(this.options.debugMode)
    }
    setTimeout(() => {
        document.documentElement.classList.remove('is-animating')
    }, 10)

    // handle classes after render
    if (this.options.pageClassPrefix !== false) {
        document.body.className.split(' ').forEach(className => {
            // empty string for page class
            if (className != "" && className.includes(this.options.pageClassPrefix)) {
                document.body.classList.remove(className)
            }
        })
    }

    // empty string for page class
    if (page.pageClass != "") {
        page.pageClass.split(' ').forEach(className => {
            if (className != "" && className.includes(this.options.pageClassPrefix)) {
                document.body.classList.add(className)
            }
        })
    }

    // scrolling
    if (!this.options.doScrollingRightAway || this.scrollToElement) {
        this.doScrolling(popstate)
    }

    // detect animation end
    let animatedElements = document.querySelectorAll(this.options.animationSelector)
    let promises = [];
    animatedElements
        ::forEach(element => {
        var promise = new Promise(resolve => {
            element.addEventListener(this.transitionEndEvent, event => {
                if (element == event.target) {
                    resolve()
                }
            })
        });
        promises.push(promise)
    })

    //preload pages if possible
    this.preloadPages()

    Promise
        .all(promises)
        .then(() => {
            this.triggerEvent('animationInDone')
            // remove "to-{page}" classes
            document.documentElement.className.split(' ').forEach(classItem => {
                if (new RegExp("^to-").test(classItem) || classItem === "is-changing" || classItem === "is-rendering" || classItem === "is-popstate") {
                    document.documentElement.classList.remove(classItem);
                }
            });
        })

    // update current url
    this.getUrl()
    // reset scroll-to element
    this.scrollToElement = null
}
