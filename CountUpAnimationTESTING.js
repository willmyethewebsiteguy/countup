/* ==========
 * Count Up Animation
 * This Code is licensed by Will-Myers.com 
========== */
(function(){  
  const ps = {
    cssId: 'wm-countup-animation',
    uniqueId: 1
  };
  const defaults = {
  };
  const utils = {
    /* Emit a custom event */
    endsWithNumber: function ( str ){
      return isNaN(str.slice(-1)) ? str.slice(-1) : '';
    },
    isScaledText: function (el) {
      let answer = false;
      if (el.closest('.sqsrte-scaled-text')) {
        answer = el.closest('.sqs-block');
      }
      return answer;
    },
    emitEvent: function (type, detail = {}, elem = document) {
      // Make sure there's an event type
      if (!type) return;

      // Create a new event
      let event = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: detail,
      });

      // Dispatch the event
      return elem.dispatchEvent(event);
    },
    inIframe: function () {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    },
    preventPlugin: function(){
      let styles = window.getComputedStyle(document.body),
          prevent = (styles.getPropertyValue(`--${ps.id}-edit-mode`) === 'true');

      return (prevent && utils.inIframe());
    },
    loadImages: function(container){
      let images = container.querySelectorAll('.summary-v2-block img, .sqs-block-image img, .section-background img');
      images.forEach(img => {

        img.classList.add('loaded');
        let imgData = img.dataset,
            focalPoint = imgData.imageFocalPoint,
            parentRation = imgData.parentRatio,
            src = img.src;
        if (focalPoint) {
          let x = focalPoint.split(',')[0] * 100,
              y = focalPoint.split(',')[1] * 100;
          img.style.setProperty('--position', `${x}% ${y}%`)
        }
        if (!src) {
          img.src = imgData.src
        }
      });
    },
    debounce: function (fn) {
      // Setup a timer
      let timeout;

      // Return a function to run debounced
      return function () {
        // Setup the arguments
        let context = this;
        let args = arguments;

        // If there's a timer, cancel it
        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        // Setup the new requestAnimationFrame()
        timeout = window.requestAnimationFrame(function () {
          fn.apply(context, args);
        });
      }
    },
    getPropertyValue: function(el, prop) {
      let styles = window.getComputedStyle(el),
          value = styles.getPropertyValue(prop);
      return value;
    },
    unescapeSlashes: function(str) {
      let parsedStr = str.replace(/(^|[^\\])(\\\\)*\\$/, "$&\\");
      parsedStr = parsedStr.replace(/(^|[^\\])((\\\\)*")/g, "$1\\$2");

      try {
        parsedStr = JSON.parse(`"${parsedStr}"`);
      } catch(e) {
        return str;
      }
      return parsedStr ;
    }
  }

  let CountUpAnimation = (function(){

    function buildAnimation(instance) {
      let el = instance.settings.el,
          suffix = utils.endsWithNumber(el.innerText),
          locale = instance.settings.el.innerText.includes(",");

      //Is Scaled Text
      let block = null;
      if (utils.isScaledText(el)) {
        block = utils.isScaledText(el);
      }

      let countTo = parseInt( instance.settings.el.innerText.replace(/,/g, '')),
          duration = instance.settings.duration;
      instance.settings.el.innerHTML = instance.settings.startingNumber;

      // Frames
      let frame = 0,
          fps = instance.settings.fps,
          frameDuration = 1000 / fps,
          totalFrames = Math.round( duration / frameDuration );

      // Easing Function
      let ease = x => Math.sin((x * Math.PI) / 2);

      let animateCountUp = el => {
        let counter = setInterval( () => {
          frame++;

          // Easing 
          let easingProgress = ease( frame / totalFrames );

          // Use the easing progress to get actual count
          let currentCount = Math.round( countTo * easingProgress );
          
          if (locale) currentCount = currentCount.toLocaleString("en-US");
          
          //If Scaled Text, Re=initialize
          if (block) { Squarespace?.initializeScaledText(block) }
 
          // Change Element if not same -- account for rounding issues
          if ( parseInt(el.innerText) !== currentCount ) {
            el.innerText = currentCount + suffix;
          }

          if ( frame === totalFrames ) {
            clearInterval( counter );
          }
        }, frameDuration );
      };

      let observer = new IntersectionObserver(
        (entries, observer) => { 
          entries.forEach(entry => {
            /* Placeholder replacement */
            if(entry.isIntersecting){
              animateCountUp(instance.settings.el);
              observer.unobserve(el);
            }
          });
        }, 
        {rootMargin: "0px 0px 0px 0px"});
      
      observer.observe(el)
    }

    function Constructor(el, options = {}) {
      let instance = this;

      // Add Elements Obj
      this.settings = {
        el: el,
        get duration() {
          return el.dataset['duration'] || utils.getPropertyValue(this.el, '--speed') || 3000;
        }, 
        get fps() {
          return el.dataset['fpx'] || utils.getPropertyValue(this.el, '--fps') || 60;
        },
        get startingNumber() {
          return el.dataset['startingNumber'] || utils.getPropertyValue(this.el, '--starting-number') || 0;
        }
      };

      //Get Settings
      buildAnimation(this)
      

      el.wmCountupAnimation = {
        initilized: true,
        settings: this.settings,
      };
      el.classList.add('loaded')
    }

    return Constructor;
  }());

  let BuildCountUp = (function(){

    function replaceAnchor(instance) {
      let el = instance.settings.el,
          index = instance.settings.index,
          parentEl = el.parentElement,
          id = ps.uniqueId,
          customColor = el.querySelector('span[class*="sqsrte-text-color"]'),
          newEl = `<span data-wm-plugin="countup" 
                         data-unique-id="${id}"
                         ${customColor ? `style="${customColor.style.cssText}" class="${customColor.classList.value}" ` : ''}>
                             ${el.innerHTML}
                         </span>`;
          
      el.insertAdjacentHTML('afterend', newEl);
      el.remove();
      ps.uniqueId++;
      return document.querySelector(`[data-wm-plugin="countup"][data-unique-id="${id}"]`);
    }
    
    function Constructor(el, options = {}) {
      let instance = this;

      // Add Elements Obj
      this.settings = {
        el: el,
        get duration() {
          return el.dataset['duration'] || 3000
        }, 
        get index() {
          return Array.from( el.parentElement.children).indexOf(el);
        }
      };

      this.settings.el = replaceAnchor(this);
      
      //Get Settings
      new CountUpAnimation(instance.settings.el)
    }

    return Constructor;
  }());
  
  let countupsFromCode = document.querySelectorAll('[data-wm-plugin="countup"]');
  let countupsFromAnchors = document.querySelectorAll('a[href="#wm-countup"]');

  for (let el of countupsFromCode) {
    if (el.classList.contains('loaded')) return;
    new CountUpAnimation(el)
  }
  for (let el of countupsFromAnchors) {
    if (el.classList.contains('loaded')) return;
    new BuildCountUp(el)
  }
}());