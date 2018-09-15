/******************************************
 *
 * c24-components.js
 * @file Contains Components; classes which retrieve data (e.g.
 * from Services), manage it and display it in the frontend.
 * @author Felix Dombek
 * @version 1.0
 *
 ******************************************/

'use strict';

/**
 * LexSelectorComponent:
 * The lexicon manager and main data model for the app.
 * Responsible for getting the lexicon list, displaying it,
 * loading selected lexicons and their associated metadata
 * and initiating the preprocessing of loaded lexicons.
 */
class LexSelectorComponent {

  /**
   * Constructs a LexSelectorComponent instance and initalizes instance members.
   */
  constructor() {

    /** The list of lexicons as provided by LexListService.  */
    this.lexList = {};

    /** A mapping { lexId: metadata } for each lexicon. */
    this.metadata = {};

    /** A mapping { lexId: lexicon } for each lexicon. */
    this.lex = {};

    /** Maps for POS conversion: { tagset: { tag: newTag } } */
    this.synMaps = {};

    /** Maps for Sense conversion: { tagset: { tag: newTag } } */
    this.senseMaps = {};

    /** Identifier for this object's data when writing/reading URL data to/from {@link LocationDataService}. */
    this.locationIdentifier = 's';
  }

  /**
   * Initiates the app by loading the list of lexicons and the POS/Sense tag conversion maps.
   */
  Init() {
    let resourcePromises = [
      this.LoadListAndMetadata(),
      this.LoadMaps()
    ];
    Promise.all(resourcePromises).then(() => this.LoadState());
  }

  /**
   * Called by the component's JsRender template when a lexicon's checkbox is selected/deselected by the user.
   * Delegates lexicon loading and preprocessing to {@link LoadLexicon}.
   *
   * @param {*} evt The original mouse/keyboard event
   * @param {*} eventArgs Additional event information from JsRender (currently unused)
   */
  onSelect(evt, eventArgs) {
    let clickedCheckBox = evt.target;
    let lexId = clickedCheckBox.value;
    let isChecked = clickedCheckBox.checked;
    if (!this.lex[lexId] && isChecked) {
      this.lexList[lexId].selected = true;
      this.LoadLexicon(lexId);
    } else if (this.lex[lexId] && !isChecked) {
      this.lexList[lexId].selected = false;
      delete this.lex[lexId];
      gResultsComponent.ExecuteQuery();
    }
    this.WriteState();
  }

  /**
   * Loads the selected lexicon asynchronously via {@link LexFileService} and initiates preprocessing.
   *
   * @param {string} lexId - ID of the lexicon to be loaded
   * @param {boolean} doQuery - Whether a search query should immediately be started.
   *                            This is true if a lexicon was selected by the user because new entries
   *                            should be displayed as soon as the user selects a new lexicon.
   *                            It is false when the app starts and the state is read from {@link LocationDataService},
   *                            because multiple lexicons might be loaded at once. In this case, the search
   *                            must be started manually after loading.
   * @return {Promise} - A Promise which resolves as soon as the lexicon is preprocessed and available.
   */
  LoadLexicon(lexId, doQuery = true) {
    return gFileService.getFile(this.lexList[lexId].jsonFile).then(
      lexicon => {
        new LexiconPreprocessor(this.synMaps, this.senseMaps, this.metadata).PreprocessLexicon(lexicon, lexId);
        this.lex[lexId] = lexicon;
        if (doQuery) {
          gResultsComponent.ExecuteQuery();
        }
      }
    );
  }

  /**
   * Load the POS/Sense conversion maps via {@link LexFileService}.
   *
   * @return {Promise} - A Promise which resolves as soon as both mapping files are loaded.
   */
  LoadMaps() {
    return Promise.all([
      gFileService.getFile('syn-maps.json').then(mapItem => this.synMaps = mapItem),
      gFileService.getFile('sense-maps.json').then(mapItem => this.senseMaps = mapItem)
    ]).catch(
      error => ShowErrorMessage('The POS/Sense mapping files could not be loaded.', error)
    );
  }

  /**
   * Loads the list of available lexicons via {@link LexListService}.
   *
   * @return {Promise} - A Promise which resolves as soon as the list and all metadata are loaded.
   */
  LoadListAndMetadata() {
    return gListService.getList().then(lexList => {
      let promises = [];
      lexList.forEach(lexItem => {
        lexItem.selected = false;
        this.lexList[lexItem.lexId] = lexItem;
        if (lexItem.hasMeta) {
          promises.push(gFileService.getFile(lexItem.metaFile).then(
            metaItem => this.metadata[lexItem.lexId] = metaItem
          ).catch(
            error => console.warn(`The metadata file for ${lexItem.lexId} could not be loaded!`, error)
          ));
        }
      });
      return Promise.all(promises).then(
        () => $.templates('#lexSelectionTemplate').link('#lexSelection', this)
      );
    }).catch(
      error => ShowErrorMessage('The list of lexicons could not be loaded.', error)
    );
  }

  /**
   * Load the state of this component from {@link LocationDataService}.
   * This includes loading all checked lexicons, metadata and initiating the display of results.
   *
   * @return {Promise} - A Promise which resolves when the state, including all files, is restored.
   */
  LoadState() {
    let stateObject = gLocationService.GetLocation(this.locationIdentifier);
    let promises = [];
    for (let index in stateObject) {
      let lexId = stateObject[index];
      if (this.lexList[lexId]) {
        $.observable(this).setProperty('lexList.' + lexId + '.selected', true);
        promises.push(this.LoadLexicon(lexId, false));
      }
    }
    return Promise.all(promises).then(() => gResultsComponent.ExecuteQuery());
  }

  /**
   * Write the state of this component to {@link LocationDataService}.
   * This adds the list of loaded lexicons to the current URL so that
   * the state can be restored when the link is shared or the page is reloaded.
   */
  WriteState() {
    gLocationService.UpdateLocation(this.locationIdentifier, Object.keys(this.lexList).filter(
      key => this.lexList[key].selected));
  }
}

/*********************************************************************************************************
 *
 ********************************************************************************************************/

/**
 * OptionsComponent:
 * Displays and manages the options for searching/filtering lexicon entries.
 */
class OptionsComponent {

  /**
   * Creates an OptionsComponent instance and initializes its members.
   */
  constructor() {
    /** Identifier for this object's data when writing/reading URL data to/from {@link LocationDataService}. */
    this.locationIdentifier = 'o';

    /** The current filter text. */
    this.filterText = '';

    /** The types of text that the filter text applies to. */
    this.filterType = {
      word: true,
      synonym: false,
      example: false
    };

    /** filterType as a string which can be used for setting the selection field in the GUI. */
    this.filterTypeStr = 'word';

    /** The POS tags that should be included in the current search. */
    this.syn = {
      cco: false,
      csu: false,
      adv: false,
      prep: false,
      other: false,
      all: true
    };

    /** The Sense tags that should be included in the current search. */
    this.sense = {
      expansion: {
        conjunction: false,
        disjunction: false,
        equivalence: false,
        instantiation: false,
        level_of_detail: { arg1_as_detail: false, arg2_as_detail: false, all: false },
        substitution: { arg1_as_subst: false, arg2_as_subst: false, all: false },
        exception: { arg1_as_excpt: false, arg2_as_excpt: false, all: false },
        manner: { arg1_as_manner: false, arg2_as_manner: false, all: false },
        all: false
      },
      comparison: {
        contrast: false,
        similarity: false,
        concession: { arg1_as_denier: false, arg2_as_denier: false, all: false },
        all: false
      },
      contingency: {
        cause: { reason: false, result: false, all: false },
        condition: { arg1_as_cond: false, arg2_as_cond: false, all: false },
        negative_condition: { arg1_as_negcond: false, arg2_as_negcond: false, all: false },
        purpose: { arg1_as_goal: false, arg2_as_goal: false, all: false },
        all: false
      },
      temporal: {
        synchronous: false,
        asynchronous: { precedence: false, succession: false, all: false },
        all: false
      },
      belief: false,
      speechact: false,
      other: false,
      all: true
    };
  }

  /**
   * Initializes the component by linking it to the Options template
   * and getting the state from the {@link LocationDataService}.
   */
  Init() {
    $.templates('#searchOptionsTemplate').link('#searchOptions', this);
    this.LoadState();
  }

  /**
   * Called by the component's JsRender template when an option checkbox is selected/delected by the user.
   * Sets the correct internal values for a changed checkbox.
   * Writes the current state to the URL and starts the search.
   *
   * @param {*} evt The original mouse/keyboard event
   * @param {*} eventArgs Additional event information from JsRender (currently unused)
   */
  onSelectCheckbox(evt, eventArgs) {
    this.SetRelatedValues(evt.target.value, evt.target.checked);
    this.WriteState();
    gResultsComponent.ExecuteQuery();
  }

  /**
   * Called by the component's JsRender template when a filter option is selected by the user.
   * Writes the current state to the URL and starts the search.
   *
   * @param {*} evt The original mouse/keyboard event
   * @param {*} eventArgs Additional event information from JsRender (currently unused)
   */
  onSelectFilterType(evt, eventArgs) {
    $.observable(this).setProperty('filterType.word', evt.target.value.indexOf('word') >= 0);
    $.observable(this).setProperty('filterType.synonym', evt.target.value.indexOf('synonym') >= 0);
    $.observable(this).setProperty('filterType.example', evt.target.value.indexOf('example') >= 0);
    this.WriteState();
    gResultsComponent.ExecuteQuery();
  }

  /**
   * Called by the component's JsRender template when the user enters a filter text.
   * Saves the entered text.
   *
   * @param {*} evt The original mouse/keyboard event
   * @param {*} eventArgs Additional event information from JsRender (currently unused)
   */
  onChangeFilterText(evt, eventArgs) {
    this.filterText = evt.target.value.trim();
  }

  /**
   * Called by the component's JsRender template when the user submits the query
   * by pressing the Enter key or clicking the magnifying glass button.
   * Writes the current state to the URL and starts the search.
   *
   * @param {*} evt The original mouse/keyboard event
   * @param {*} eventArgs Additional event information from JsRender (currently unused)
   */
  onSubmit(evt, evtArgs) {
    this.WriteState();
    gResultsComponent.ExecuteQuery();
    return false;
  }

  /**
   * This function is responsible for keeping all internal values consistent.
   * Any values updated by this functions are automatically updated in the GUI because
   * the checkboxes are data-bound to this object via JsViews.
   *
   * @param {string} path - The path in this object which is being manipulated by the user via checkbox.
   * @param {boolean} checked - Whether the checkbox was checked or unchecked.
   */
  SetRelatedValues(path, checked) {
    let pathComponents = path.split('.');
    let numComponents = pathComponents.length;
    if (numComponents < 2) {
      return;
    }
    $.observable(this).setProperty(path, checked);
    let superObject = undefined;
    let subObject = this.sense;
    for (let i = 1; i < numComponents - 1; ++i) {
      superObject = subObject;
      subObject = subObject[pathComponents[i]];
    }
    if (pathComponents[numComponents - 1] === 'all') {
      this.SetOrClearAll(subObject, checked);
    } else if (!checked) {
      $.observable(subObject).setProperty('all', false);
    }

    $.observable(subObject).setProperty('all', !this.TestAllOrNoneSet(subObject).hasUnset);

    if (numComponents >= 4) {
      $.observable(superObject).setProperty('all', !this.TestAllOrNoneSet(superObject).hasUnset);
    }

    let { allOrNone: synAllOrNone } = this.TestAllOrNoneSet(this.syn);
    $.observable(this).setProperty('syn.all', synAllOrNone);
    let { allOrNone: senseAllOrNone } = this.TestAllOrNoneSet(this.sense);
    $.observable(this).setProperty('sense.all', senseAllOrNone);
  }

  /**
   * Helper function for {@link SetRelatedValues}; recursively sets or unsets all
   * values in an object.
   *
   * @param {Object} subObject - The object in which all values must be set or unset
   * @param {boolean} checked - Whether to set or unset each value.
   */
  SetOrClearAll(subObject, checked) {
    for (let key in subObject) {
      if (typeof subObject[key] === 'object') {
        this.SetOrClearAll(subObject[key], checked);
      } else {
        $.observable(subObject).setProperty(key, checked);
      }
    }
  }

  /**
   * Helper function for {@link SetRelatedValues}; tests if all values in a object are set
   * or none of them, because this must be treated identically in the GUI.
   *
   * @param {Object} obj - The object whose values are tested.
   * @return {Object} - An object with Boolean values hasUnset, hasSet, and allOrNone.
   */
  TestAllOrNoneSet(obj) {
    let hasUnset = false;
    let hasSet = false;

    for (let key in obj) {
      if (key === 'all') {
        continue;
      }

      if (typeof obj[key] === 'object') {
        let { hasUnset: subHasUnset, hasSet: subHasSet } = this.TestAllOrNoneSet(obj[key]);
        if (subHasUnset) {
          hasUnset = true;
        }
        if (subHasSet) {
          hasSet = true;
        }
      } else {
        if (obj[key]) {
          hasSet = true;
        } else {
          hasUnset = true;
        }
      }
    }
    return { hasUnset: hasUnset, hasSet: hasSet, allOrNone: !hasUnset || !hasSet };
  }

  /**
   * Load the state of this component from the location bar via {@link LocationDataService}.
   * This includes current filter word, filter type selection and selected POS/Sense tags.
   */
  LoadState() {
    let stateObject = gLocationService.GetLocation(this.locationIdentifier);

    if (!stateObject) {
      gResultsComponent.ExecuteQuery();
      return;
    }

    this.syn.all = false;
    let falsifyAll = (obj) => {
      for (let key in obj) {
        if (key === 'all') {
          obj[key] = false;
        } else if (typeof obj[key] === 'object') {
          falsifyAll(obj[key]);
        }
      }
    };
    falsifyAll(this.sense);

    for (let i in stateObject) {
      if (typeof stateObject[i] === 'object') {
        for (let j in stateObject[i]) {
          if (typeof stateObject[i][j] === 'object') {
            for (let k in stateObject[i][j]) {
              if (typeof stateObject[i][j][k] === 'object') {
                for (let l in stateObject[i][j][k]) {
                  $.observable(this).setProperty(i + '.' + j + '.' + k + '.' + l, stateObject[i][j][k][l]);
                }
              } else {
                $.observable(this).setProperty(i + '.' + j + '.' + k, stateObject[i][j][k]);
              }
            }
          } else {
            $.observable(this).setProperty(i + '.' + j, stateObject[i][j]);
          }
        }
      } else {
        $.observable(this).setProperty(i, stateObject[i]);
      }
    }
    let typeStr = (this.filterType.word ? 'word' : '') + '_' + (
      this.filterType.synonym ? 'synonym' : '') + '_' + (
      this.filterType.example ? 'example' : '');
    typeStr = typeStr.replace(/_+/g, '_').replace(/^_/, '').replace(/_$/, '');
    $.observable(this).setProperty('filterTypeStr', typeStr);
    gResultsComponent.ExecuteQuery();
  }

  /**
   * Write the current options to the location bar via {@link LocationDataService}.
   */
  WriteState() {
    let storeState = {
      filterText: this.filterText,
      filterType: this.filterType,
      syn: this.syn,
      sense: gSettings.storeSensesInUrl ? this.sense : false
    };

    // only keep true options for storing, otherwise the string would get even longer.
    storeState = _.pickDeep(storeState, (val, key) => (val === true || val.length > 1));
    gLocationService.UpdateLocation(this.locationIdentifier, storeState);
  }
}

/*********************************************************************************************************
 *
 ********************************************************************************************************/

/**
 * ResultsComponent:
 * Stores and displays the search results.
 */
class ResultsComponent {

  /**
   * Initializes the results to be empty.
   */
  constructor() {

    /** The array of results for display in the GUI. */
    this.results = [];

    /** The result counts per language */
    this.resultCounts = {};

    /** Array of active search timeout handles. */
    this.activeSearches = [];

    /** The helper object for checking if an entry matches the filter settings. */
    this.resultsFilter = new ResultsFilter();

    /** Variables needed to keep track of current search progress. */
    this.totalSize = 0;
    this.processedCount = 0;
  }

  /**
   * Creates the initial search results from the currently set options and links
   * this object to the result template in the GUI. The template link contains
   * a helper function to detect synonyms, which is used by the template to decide
   * whether to activate or deactivate the Synonyms button for a result.
   */
  Init() {
    this.ExecuteQuery();
    $.templates('#resultListTemplate').link('#resultList', this, {
      hasSynonyms: data => {
        if (data.synonyms && data.synonyms.synonym && data.synonyms.synonym.length > 0) {
          return true;
        }

        for (let i in data.syn) {
          let syni = data.syn[i];
          if (syni.synonyms && syni.synonyms.synonym && syni.synonyms.synonym.length > 0) {
            return true;
          }

          for (let j in syni.sem) {
            let semj = syni.sem[j];
            if (semj.synonyms && semj.synonyms.synonym && semj.synonyms.synonym.length > 0) {
              return true;
            }
          }
        }

        return false;
      }
    });
  }

  /**
   * Executes the current search query, i.e. checks all loaded lexicon entries for compliance with the
   * filter settings. This function is programmed to run asynchronously; it calls a subfunction via
   * setTimeout and then returns immediately. The subfunction processes a slice of entries and then
   * also enqueues the next slice for processing via setTimeout.
   * This ensures that the search will never make the GUI irresponsive.
   */
  ExecuteQuery() {
    ShowProgress(0);

    let lexIds = Object.keys(gSelectorComponent.lex);
    this.totalSize = lexIds.map(lexId => gSelectorComponent.lex[lexId].entry.length).reduce(
      (acc, val) => acc + val,
      0);

    setTimeout(() => this.SetResults([]), 0);

    let tempResults = [];
    this.processedCount = 0;
    const processAtOnce = 20;

    this.activeSearches.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeSearches.length = 0;

    /* Subfunction which emulates asynchronous processing in the (single-threaded) JS environment
       by processing a slice of entries and then enqueuing the next slice to be processed so that
       the browser has time to process user events and render the GUI between slices. */
    let processingFunction = (lexIdIndex, entryIndex) => {
      ShowProgress(100 * this.processedCount / this.totalSize);
      if (lexIdIndex >= lexIds.length) {
        this.activeSearches.push(setTimeout(() => this.SetResults(tempResults), 0));
        return;
      }

      let entries = undefined;
      try {
        entries = gSelectorComponent.lex[lexIds[lexIdIndex]].entry;
      } catch (e) {
        // This happens when a lexicon is deselected while a search is running.
        // Abort search.
        return;
      }

      for (let i = 0; i < processAtOnce; ++i, ++entryIndex) {
        if (entryIndex >= entries.length) {
          this.activeSearches.push(setTimeout(processingFunction.bind(this), 0, ++lexIdIndex, 0));
          return;
        }
        ++this.processedCount;
        if (this.resultsFilter.TestEntry(entries[entryIndex])) {
          if (!entries[entryIndex].html) {
            entries[entryIndex].html = gRenderService.RenderEntry(entries[entryIndex]);
          }
          tempResults.push(entries[entryIndex]);
        }
      }

      this.activeSearches.push(setTimeout(processingFunction.bind(this), 0, lexIdIndex, entryIndex));
    };

    this.activeSearches.push(setTimeout(processingFunction.bind(this), 0, 0, 0));
  }

  /**
   * Replaces the old results with new ones and updates the GUI.
   * @param {Object[]} newResults - The list of results which replaces the old one.
   */
  SetResults(newResults) {
    $.observable(this.results).refresh(newResults);
    if (gSettings.useBootstrapTooltips) {
      $(() => $('[data-toggle="tooltip"]').tooltip({ html: true })); // Can be disabled via options because of bug in Bootstrap tooltips
    }
    let totalSize = this.totalSize;
    this.totalSize = 0;
    $.observable(this).setProperty('totalSize', totalSize);
    setTimeout(() => {
      let newResultCounts = {};
      for (let i in this.results) {
        ++newResultCounts[this.results[i].lexName] || (newResultCounts[this.results[i].lexName] = 1);
      }
      for (let lexName in this.resultCounts) {
        $.observable(this.resultCounts).removeProperty(lexName);
      }
      for (let lexName in newResultCounts) {
        $.observable(this.resultCounts).setProperty(lexName, newResultCounts[lexName]);
      }
    }, 0);
  }
}