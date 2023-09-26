/* ==========
 * Count Up Animation
 * This Code is licensed by Will-Myers.com 
========== */
(function(){  
  const ps = {
    cssId: 'wm-countup-animation',
    uniqueId: 1,
  };
  const defaults = {
  };
  const utils = {
    /* Emit a custom event */
    endsWithNumber: function ( str ){
      str = str.trim();
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
        localeString = instance.settings.localeString.replaceAll("'", '').replaceAll('"', '');

      //Is Scaled Text
      let block = null;
      if (utils.isScaledText(el)) {
        block = utils.isScaledText(el);
        utils.isScaledText(el).classList.add('has-countup-animation');
        let styles = `<style>
.has-countup-animation .preSlide {
  transform: translate(0,0) !important;
  opacity: 1 !important;
}
</style>`;
        document.head.insertAdjacentHTML('afterbegin', styles);
        el.style.opacity = '0';
        let str = '0';
        let count = instance.settings.el.innerText.length;
        for (let i = 1; i < count; i++) {
          str += '0'
        }
        el.dataset['startingNumber'] = str;
      }

      let countTo = convertToNumber(instance.settings.el.innerText),
        duration = instance.settings.duration,
        start = instance.settings.startingNumber ? convertToNumber(instance.settings.startingNumber) : 0,
        hasSeperator = instance.settings.hasSeperator,
        decimals = getDecimals(instance.settings.el.innerText);

      function convertToNumber(str) {
        function escapeRegExp(str) {
          return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
      
        str = str.trim();
        const thousandsSeparator = getThousandsSeparator();
        const escapedSeparator = escapeRegExp(thousandsSeparator);
      
        // Create a regular expression to match either a dot or a comma as a decimal separator
        const decimalRegExp = /[.,]/;
        const separatorRegExp = new RegExp(escapedSeparator, 'g');
        
        // Replace thousands separator with an empty string
        const stringWithoutCommas = str.replace(separatorRegExp, '');
      
        // Replace the first occurrence of a decimal separator with a dot ('.') to ensure it's a valid number
        const stringWithDotAsDecimalPoint = stringWithoutCommas.replace(decimalRegExp, '.');
      
        // Parse the modified string to a float
        const num = parseFloat(stringWithDotAsDecimalPoint);
      
        //console.log('num:', num);
        return num;
      }
      function getDecimalSeparator() {
        // Format a number with the current locale to get the separator
        const formattedNumber = (1.1).toLocaleString(localeString);
        return formattedNumber.charAt(1);
      }
      function getThousandsSeparator() {
        // Format a large number with the current locale to get the separator
        const formattedNumber = (1000).toLocaleString(localeString);
        return formattedNumber.charAt(1);
      }
      function getDecimals(numStr) {
        let separator = getDecimalSeparator();
        let decimals = 0;
        let splitAtSeparator = numStr.split(separator)[1];
        if (splitAtSeparator) decimals = splitAtSeparator.trim().length;
        return decimals
      };

      instance.settings.el.innerHTML = start;

      // Frames
      let frame = 0,
          fps = instance.settings.fps,
          frameDuration = 1000 / fps,
          totalFrames = Math.round( duration / frameDuration );

      // Easing Function
      let ease = x => Math.sin((x * Math.PI) / 2);

      let animateCountUp = el => {
        el.style.opacity = '';
        let counter = setInterval( () => {
          frame++;

          // Easing 
          let easingProgress = ease( frame / totalFrames );

          // Use the easing progress to get actual count
          let currentCount = parseFloat(((countTo - start) * easingProgress ) + start).toFixed(decimals);

          if (localeString && hasSeperator) {
            currentCount = Number(parseFloat(currentCount).toFixed(2)).toLocaleString(localeString, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })
          }
          
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
          return el.dataset['speed'] || el.dataset['duration'] || utils.getPropertyValue(this.el, '--speed') || 3000;
        }, 
        get fps() {
          return el.dataset['fpx'] || utils.getPropertyValue(this.el, '--fps') || 60;
        },
        get startingNumber() {
          return el.dataset['start'] || utils.getPropertyValue(this.el, '--start') || 0;
        },
        get hasSeperator() {
          const numberString = el.innerText.toString();
          return numberString.includes('.') || numberString.includes(',');
        },
        get localeString() {
          return el.dataset['locale'] || utils.getPropertyValue(this.el, '--locale-string') || "en-US";
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
                         data-speed="${instance.settings.speed}"
                         data-start=${instance.settings.startingNumber}
                         ${customColor ? `style="${customColor.style.cssText}" class="${customColor.classList.value}" ` : ''}>
                             ${el.innerHTML}
                   </span>`;
          
      el.insertAdjacentHTML('afterend', newEl);
      el.remove();
      ps.uniqueId++;
      return document.querySelector(`[data-wm-plugin="countup"][data-unique-id="${id}"]`);
    }

    function parseURL(instance, url) {
      const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
      let start = params.get("start");
      let speed = params.get("speed");

      var defaultStart = 0; // Default value for start parameter
      var defaultSpeed = 3000; // Default value for speed parameter

      start = start ? parseInt(start) : defaultStart;
      speed = speed ? parseInt(speed) : defaultSpeed;

      instance.settings.speed = speed
      instance.settings.startingNumber = start;
    }
    
    function Constructor(el, options = {}) {
      let instance = this;

      // Add Elements Obj
      this.settings = {
        el: el,
        get index() {
          return Array.from( el.parentElement.children).indexOf(el);
        }
      };
      parseURL(instance, el.getAttribute('href'))

      this.settings.el = replaceAnchor(this);
      
      //Get Settings
      new CountUpAnimation(instance.settings.el)
    }

    return Constructor;
  }());
  
  let countupsFromCode = document.querySelectorAll('[data-wm-plugin="countup"]');
  let countupsFromAnchors = document.querySelectorAll('a[href*="#wm-countup"], a[href*="#wmcountup"]'),
  origin = window.location.origin;

  for (let el of countupsFromCode) {
    try {
      if (el.classList.contains('loaded')) return;
      new CountUpAnimation(el)
    } catch (err) {
      console.log('error with', el);
      console.log(err);
    }
  }
  for (let el of countupsFromAnchors) {    
    try {
      if (el.classList.contains('loaded')) return;
      new BuildCountUp(el)
    } catch (err) {
      console.log('error with', el);
      console.log(err);
    }
  }
}());
