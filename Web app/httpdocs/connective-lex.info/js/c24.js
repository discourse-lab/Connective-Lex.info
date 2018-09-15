/******************************************
 * 
 * c24.js
 * @file Contains the source code for the Connective-Lex.info webapp.
 * @author Felix Dombek
 * @version 1.0
 * 
 ******************************************/

'use strict';

/* Free functions */

/**
 * Initalizes the app. Must be called once after the page has loaded.
 */
function InitApp() {
  SetAjaxProgressHandler();

  gListService = new LexListService();
  gFileService = new LexFileService();
  gLocationService = new LocationDataService();
  gRenderService = new EntryRenderService();

  gSelectorComponent = new LexSelectorComponent();
  gOptionsComponent = new OptionsComponent();
  gResultsComponent = new ResultsComponent();

  gSelectorComponent.Init();
  gOptionsComponent.Init();
  gResultsComponent.Init();
}

/**
 * Links the metadata for a specific lexicon to the metadata template.
 * 
 * @param {string} lexId - The ID of the lexicon whose metadata is about to be displayed.
 */
function ShowMetadata(lexId) {
  $.templates('#metadataTemplate').link('#metadataDialog', gSelectorComponent.metadata[lexId]);
}

/**
 * Shows a very nasty error message if something goes wrong.
 * 
 * @param {string} ownMessage - A high-level message explaining what the error is about.
 * @param {(Object|string)} systemMessage - A low-level error object or message with details about what went wrong.
 */
function ShowErrorMessage(ownMessage, systemMessage) {
  if (systemMessage.message) {
    systemMessage = systemMessage.message;
  } else if (systemMessage.responseJSON && systemMessage.responseJSON.error) {
    systemMessage = `${systemMessage.responseJSON.error} (Status: ${systemMessage.status} ${systemMessage.statusText})`;
  } else {
    systemMessage = JSON.stringify(systemMessage);
  }
  $.templates('#errorTemplate').link('#errorDialog', {
    ownMessage: ownMessage,
    systemMessage: systemMessage,
  });
  $('#errorDialog').modal({ backdrop: 'static', keyboard: false });
}

/**
 * Shows the current progress in the progress bar.
 * 
 * @param {number} percentComplete - A percentage number.
 */
function ShowProgress(percentComplete) {
  let progress = $('#progress');
  let progressbar = $('#progressbar');

  let visible = true; // progress.is(':visible');
  if (percentComplete > 100) {
    percentComplete = 100;
  }

  progressbar.width(`${percentComplete}%`);
  //document.location.hash = `${percentComplete}%`;
  if (percentComplete >= 100 && visible) {
    //$('#progress').fadeOut();
    return;
  } else if (percentComplete < 100) {
    if (!visible) {
      progress.show();
    }
  }
}

/**
 * Sets the Ajax progress handler once at the start of the app.
 */
function SetAjaxProgressHandler() {
  $.ajaxSetup({
    xhr: () => {
      let xhr = new XMLHttpRequest();
      xhr.addEventListener('progress', evt => {
        if (evt.lengthComputable) {
          let percentComplete = evt.loaded / evt.total * 100;
          console.log(`Loaded ${evt.loaded} of ${evt.total} (${percentComplete} %).`);
          ShowProgress(percentComplete);
        }
      }, false);

      return xhr;
    },
    complete: evt => {
      console.log('Request finished.');
      ShowProgress(100);
    }
  });
}

/**
 * Initializes some things which do not directly relate to the app logic,
 * mostly GUI things. It also adds a function to the Lodash object which
 * extends its functionality a bit.
 */
function InitGui() {
  $('#menu-toggle').click(evt => {
    evt.preventDefault();
    $('#wrapper').toggleClass('toggled');
    $('#menu-toggle').toggleClass('toggled');
    $('#togglebutton-content').toggleClass('toggled');
  });
  if (gSettings.useBootstrapTooltips) {
    $(() => $('[data-toggle="tooltip"]').tooltip({trigger: 'hover'})); // Can be disabled via options because of bug in Bootstrap tooltips
  }

  // Lodash pickDeep function taken from https://codereview.stackexchange.com/a/58279/117
  _.pickDeep = (collection, predicate = ((val, key) => (val === true)), thisArg = undefined) => {
    if (_.isFunction(predicate)) {
      predicate = _.iteratee(predicate, thisArg);
    } else {
      var keys = _.flatten(_.tail(arguments));
      predicate = (val, key) => _.includes(keys, key);
    }

    return _.transform(collection, (memo, val, key) => {
      var include = predicate(val, key);
      if (!include && _.isObject(val)) {
        val = _.pickDeep(val, predicate);
        include = !_.isEmpty(val);
      }
      if (include) {
        _.isArray(collection) ? memo.push(val) : memo[key] = val;
      }
    });
  };

  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  String.prototype.hashCode = function() {
    var hash = 0,
      i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };
}

/******************************************
 * 
 * Global app objects:
 * The instances of Services and Components which together form this app.
 * 
 ******************************************/

let gListService;
let gFileService;
let gLocationService;
let gRenderService;
let gSelectorComponent;
let gOptionsComponent;
let gResultsComponent;