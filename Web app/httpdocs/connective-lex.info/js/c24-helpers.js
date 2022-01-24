/******************************************
 *
 * c24-helpers.js
 * @file Contains Helper Classes; Classes which provide
 * specific services to the Components:
 *  - LexiconPreprocessor normalizes the structure of the lexicon objects
 *  - ResultsFilter determines if an entry matches the current filter settings
 * @author Felix Dombek
 * @version 1.0
 *
 ******************************************/

'use strict';

/**
 * LexiconPreprocessor:
 * Class which preprocesses the lexicons to normalize some irregularities
 * so that the templates don't have to deal with them, such as fields
 * which are sometimes arrays and sometimes single values. The single values
 * would then be converted to one-element arrays.
 */
class LexiconPreprocessor {

  /**
   * Takes data which apply to all lexicons, so that a single instance of this
   * class can preprocess many lexicons.
   *
   * @param {Object} synMaps - POS maps.
   * @param {Object} senseMaps - Sense maps.
   * @param {Object} metadata - Metadata.
   */
  constructor(synMaps, senseMaps, metadata) {
    this.synMaps = synMaps;
    this.senseMaps = senseMaps;
    this.metadata = metadata;
    this.synMap = undefined;
    this.senseMap = undefined;
    this.lexId = '';
    this.icaseLookup = (map, key) => map.map[map.keyMap[key.toLowerCase()]];
  }

  /**
   * Creates a path of subobjects in an object if it does not yet exist.
   * Each individual path component is checked for existence and created if not already there.
   *
   * @param {Object} obj - The object within the path should be created
   * @param {string} path - The path, e.g. 'subObj.subValue'
   * @param {*} [value] - The value that the last component of the paths is set to, if it doesn't exist.
   *                      Optional; default is an empty array.
   */
  CreatePathIfNotExists(obj, path, value = []) {
    let pathComponents = path.split('.');
    let changed = false;
    for (let i in pathComponents) {
      if (!obj[pathComponents[i]]) {
        obj[pathComponents[i]] = ((i == pathComponents.length - 1) ? value : {});
        changed = true;
      }
      obj = obj[pathComponents[i]];
    }
    return changed;
  };

  /**
   * Preprocesses a whole lexicon.
   *
   * @param {Object} lexicon - The lexicon object to be preprocessed.
   * @param {string} lexId - The ID of the lexicon. It is stored in each entry so that
   *                         the result list item template can easily access it.
   */
  PreprocessLexicon(lexicon, lexId) {
    if (lexicon.isProcessed) {
      return;
    }

    let makeMapPair = (sourceMap) => ({
      map: sourceMap,
      keyMap: Object.keys(sourceMap).reduce(
        (keys, key) => (keys[key.toLowerCase()] = key, keys), {}
      )
    });

    let synTagset = this.metadata[lexId].parseInfo.posTagset;
    let senseTagset = this.metadata[lexId].parseInfo.senseTagset;
    this.synMap = synTagset ? makeMapPair(this.synMaps[synTagset]) : undefined;
    this.senseMap = senseTagset ? makeMapPair(this.senseMaps[senseTagset]) : undefined;
    this.lexId = lexId;

    lexicon.entry.forEach(this.PreprocessEntry, this);
    lexicon.isProcessed = true;
  }

  /**
   * Preprocess a single entry.
   * The signature is dictated by Array.prototype.forEach, for which this function is a callback.
   *
   * @param {Object} entry - The current entry
   * @param {number} ientry - Index of the current entry
   * @param {Object[]} aentry - Array of all entries
   */
  PreprocessEntry(entry, ientry, aentry) {
    entry.lexId = this.lexId;
    let metadata = this.metadata[this.lexId];
    if (!metadata.color) {
      metadata.color = '#' + (metadata.lexiconName.hashCode() & 0xFFFFFF).toString(16).substring(0, 6);
    }
    entry.color = metadata.color;
    entry.lexName = metadata.lexiconName;
    entry.posTagset = metadata.parseInfo.posTagset;
    entry.senseTagset = metadata.parseInfo.senseTagset;
    entry.language = metadata.languageEnglish;

    this.CreatePathIfNotExists(entry, 'synonyms.synonym');
    entry.synonyms.synonym = entry.synonyms.synonym.filter(elem => elem.t);
    entry.hasSynonyms = this.HasSynonyms(entry);

    this.CreatePathIfNotExists(entry, 'stts.example');
    entry.stts.example = entry.stts.example.filter(elem => elem.t);

    let resultSyns = [];
    entry.syn.forEach((syn) => this.PreprocessSyn(syn, resultSyns), this);
    entry.syn = resultSyns;
  }

  /**
   * Preprocess a syn element.
   *
   * @param {Object} syn - Current syn
   * @param {number} isyn - Index of current syn
   * @param {Object[]} asyn - Array of syn elements
   * @param {Object[]} resultSyns - Array in which newly generated syns are stored.
   */
  PreprocessSyn(syn, resultSyns) {
    this.CreatePathIfNotExists(syn, 'sem');
    this.CreatePathIfNotExists(syn, 'example');
    syn.example = syn.example.filter(elem => elem.t);

    let newSyns = [syn];
    let targetSyn;
    if (this.synMap && (targetSyn = this.icaseLookup(this.synMap, syn.cat.t))) {
      syn.cat.orig = syn.cat.t;
      if (!Array.isArray(targetSyn)) {
        syn.cat.t = targetSyn;
      } else {
        for (let itarget = 0; itarget < targetSyn.length; ++itarget) {
          // Only the current element can be modified while we are iterating over the <syn>s.
          // We can't modify the sequence, so we store any additional new target pos tags until
          // we are done and then merge them into the <syn>s afterwards.
          if (itarget === 0) {
            syn.cat.t = targetSyn[0];
          } else {
            let newSyn = _.cloneDeep(syn);
            newSyn.cat.orig = syn.cat.orig;
            newSyn.cat.t = targetSyn[itarget];
            newSyns.push(newSyn);
          }
        }
      }
    }

    newSyns.forEach((newSyn) => {
      let resultSems = [];
      newSyn.sem.forEach((sem) => this.PreprocessSem(sem, resultSems), this);
      newSyn.sem = resultSems;
      resultSyns.push(newSyn);
    });
  }

  /**
   * Preprocess a sem element. All elements which result from this operation
   * are written to newSems, which must later replace the original sem array.
   *
   * @param {Object} sem - Current sem
   * @param {Object[]} resultSems - Array in which newly generated sems are stored.
   */
  PreprocessSem(sem, resultSems) {
    if (!sem.pdtb3_relation && !sem.sdrt_relation && !sem.pdtb2_relation) {
      return;
    }

    this.CreatePathIfNotExists(sem, 'example');
    sem.example = sem.example.filter(elem => elem.t);

    if (sem.sdrt_relation) {
      sem.pdtb3_relation = sem.sdrt_relation;
      delete sem.sdrt_relation;
    } else if (sem.pdtb2_relation) {
      sem.pdtb3_relation = sem.pdtb2_relation;
      delete sem.pdtb2_relation;
    }

    this.CreatePathIfNotExists(sem, 'pdtb3_relation');
    let newSems = [sem];
    let canonicalizeSenseNames = (relation) => {
      relation.sense = relation.sense.replace('Specification', 'Level-of-detail').replace('-as-consequent', '-as-cond');
    };
    // For each SDRT sense, there may be one or more PDTB senses which fit.
    // If there is just one, we simply replace it; if there are more, they are added as new <sem> elements.
    // Exception: In the extremely rare cases when a single <sem> contains a combination of more than one SDRT annotation,
    // we do not generate all potentially fitting combinations of PDTB senses, because this would lead to
    // at least 2x2 = 4 new <sem>s where there was previously only one.
    // Instead, we simply take the first fitting PDTB sense for each SDRT sense and replace them directly.
    if (sem.pdtb3_relation.length > 1) {
      // Special case
      sem.pdtb3_relation.forEach((rel, irel, arel) => {
        canonicalizeSenseNames(rel);
        let targetSense;
        if (this.senseMap && (targetSense = this.icaseLookup(this.senseMap, rel.sense))) {
          rel.sense_orig = rel.sense;
          rel.sense = Array.isArray(targetSense) ? targetSense[0] : targetSense;
        }
      }, this);
    } else {
      // General case
      canonicalizeSenseNames(sem.pdtb3_relation[0]);
      let targetSense;
      if (this.senseMap && sem.pdtb3_relation[0]
        && (targetSense = this.icaseLookup(this.senseMap, sem.pdtb3_relation[0].sense))) {
        sem.pdtb3_relation[0].sense_orig = sem.pdtb3_relation[0].sense;
        if (!Array.isArray(targetSense)) {
          sem.pdtb3_relation[0].sense = targetSense;
        } else {
          for (let itarget = 0; itarget < targetSense.length; ++itarget) {
            // Only the current element can be modified while we are iterating over the <sem>s.
            // We can't modify the sequence, so we store any additional new target senses until
            // we are done and then merge them into the <sem>s afterwards.
            if (itarget === 0) {
              sem.pdtb3_relation[0].sense = targetSense[0];
            } else {
              let newSem = _.cloneDeep(sem);
              newSem.pdtb3_relation[0].sense_orig = sem.pdtb3_relation[0].sense_orig;
              newSem.pdtb3_relation[0].sense = targetSense[itarget];
              newSems.push(newSem);
            }
          }
        }
      }
    }

    newSems.forEach((newSem) => this.MergeIntoResultSems(newSem, resultSems), this);
  }

  /**
   * Add a newly translated Sem element to the list of processed Sem elements,
   * merging it with any existing entry with the same sense while keeping
   * the examples and original senses from both originals entries.
   *
   * @param {Object} sem - The new Sem element
   * @param {Object[]} resultSems - the list of processed Sem elements
   */
  MergeIntoResultSems(newSem, resultSems) {
    let existingSem = _.find(resultSems, (resultSem, iresultSem) => {
      let semSenses = newSem.pdtb3_relation.reduce((acc, val) => (acc.push(val.sense), acc), []);
      let resultSenses = resultSem.pdtb3_relation.reduce((acc, val) => (acc.push(val.sense), acc), []);
      let areSame = _.xor(semSenses, resultSenses).length === 0;
      return areSame;
    })

    if (existingSem) {
      existingSem.example = _.uniq(_.concat(newSem.example || [], existingSem.example || []));
      existingSem.pdtb3_relation.forEach(
        rel => rel.sense_orig = _.uniq(_.concat((rel.sense_orig ? [rel.sense_orig] : []), (newSem.pdtb3_relation[0]
          .sense_orig ? [newSem.pdtb3_relation[0].sense_orig] : []))).join(', ')
      );
    } else {
      resultSems.push(newSem);
    }
  }

  HasSynonyms(entry) {
    if (entry.synonyms && entry.synonyms.synonym && entry.synonyms.synonym.length > 0) {
      return true;
    }

    for (let i in entry.syn) {
      let syni = entry.syn[i];
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
}

/*********************************************************************************************************
 *
 ********************************************************************************************************/

/**
 * ResultsFilter:
 * Object for testing if entries fit the current search options.
 * The {@link TestEntry} member function is used as a callback for filtering results.
 */
class ResultsFilter {

  /**
   * @constructor
   */
  constructor() {}

  /**
   * Test if a single entry fits the search criteria.
   *
   * @param {Object} entry - Current entry
   * @param {number} ientry - Index of current entry
   * @param {Object[]} aentry - Array of entries
   * @return {boolean} - true if it fits, else false
   */
  TestEntry(entry, ientry, aentry) {
    try {
      return (
        this.TestEntryText(entry, ientry, aentry) &&
        this.TestEntrySyn(entry, ientry, aentry) &&
        this.TestEntrySense(entry, ientry, aentry)
      );
    } catch (e) {
      console.warn(`An error has occurred during filtering.`, entry, ientry, e);
      return false;
    }
  }

  /**
   * Test if the text in an entry matches the filter.
   *
   * @param {Object} entry - Current entry
   * @param {number} ientry - Index of current entry
   * @param {Object[]} aentry - Array of entries
   * @return {boolean} - true if it fits, else false
   */
  TestEntryText(entry, ientry, aentry) {
    const filterText = gOptionsComponent.filterText;
    const filterForDiscont = (filterText === '...');
    if (!filterText) {
      return true;
    }

    if (gOptionsComponent.filterType.word) {
      if (entry.word.indexOf(gOptionsComponent.filterText) >= 0) {
        return true;
      }
      for (let i in entry.orths.orth) {
        if (filterForDiscont && entry.orths.orth[i].type === 'discont') {
          return true;
        }
        for (let j in entry.orths.orth[i].part) {
          if (entry.orths.orth[i].part[j].t.indexOf(gOptionsComponent.filterText) >= 0) {
            return true;
          }
        }
      }
    }

    if (gOptionsComponent.filterType.example) {
      // Possible example locations:
      // stts.example[0]
      // syn[0].example[0]
      // syn[0].sem[0].example[0]
      const stts = entry.stts;
      for (let i in stts.example) {
        if (stts.example[i].t.indexOf(filterText) >= 0) {
          return true;
        }
      }
      const syn = entry.syn;
      for (let i in syn) {
        for (let j in syn[i].example) {
          if (syn[i].example[j].t.indexOf(filterText) >= 0) {
            return true;
          }
        }
        for (let j in syn[i].sem) {
          for (let k in syn[i].sem[j].example) {
            if (syn[i].sem[j].example[k].t.indexOf(filterText) >= 0) {
              return true;
            }
          }
        }
      }
    }
    if (gOptionsComponent.filterType.synonym) {
      // Possible synonym locations:
      // synonyms.synonym[0]
      const synonyms = entry.synonyms;
      for (let i in synonyms.synonym) {
        if (synonyms.synonym[i].t.indexOf(filterText) >= 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Test if the POS tag matches the search criteria.
   *
   * @param {Object} entry - Current entry
   * @param {number} ientry - Index of current entry
   * @param {Object[]} aentry - Array of entries
   * @return {boolean} - true if it fits, else false
   */
  TestEntrySyn(entry, ientry, aentry) {
    // syn[0].cat
    if (gOptionsComponent.syn.all) {
      return true;
    }

    const syn = entry.syn;
    for (let i in syn) {
      const cat = syn[i].cat.t;
      if (gOptionsComponent.syn[cat] || (gOptionsComponent.syn[cat] === undefined && gOptionsComponent.syn.other)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Test if the sense matches the search criteria.
   *
   * @param {Object} entry - Current entry
   * @param {number} ientry - Index of current entry
   * @param {Object[]} aentry - Array of entries
   * @return {boolean} - true if it fits, else false
   */
  TestEntrySense(entry, ientry, aentry) {
    // syn[0].sem[0].pdtb3_relation[0].sense
    if (gOptionsComponent.sense.all) {
      return true;
    }

    const syn = entry.syn;
    for (let i in syn) {
      for (let j in syn[i].sem) {
        for (let k in syn[i].sem[j].pdtb3_relation) {
          const fullSense = syn[i].sem[j].pdtb3_relation[k].sense;
          const senseLower = fullSense.toLowerCase();
          let senseOpt = gOptionsComponent.sense;
          if (senseOpt.belief && senseLower.indexOf('+belief') > -1) {
            return true;
          }
          if (senseOpt.speechact && senseLower.indexOf('+speechact') > -1) {
            return true;
          }
          const senseParts = senseLower.replace(/\+belief/g, '').replace(/\+speechact/g, '').replace(/-/g,
            '_').split(':');
          for (let s in senseParts) {
            if (senseOpt === undefined) {
              if (gOptionsComponent.sense.other) {
                return true;
              }
              break;
            }
            senseOpt = senseOpt[senseParts[s]];
            if (senseOpt === undefined && gOptionsComponent.sense.other) {
              return true;
            }
            if ((s == senseParts.length - 1 && typeof senseOpt === 'object' && senseOpt.all) || senseOpt === true) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}