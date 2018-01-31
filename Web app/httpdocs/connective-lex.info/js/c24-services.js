/******************************************
 * 
 * c24-services.js 
 * @file Contains Services; singleton classes for accessing
 * and caching data sources (backend, location bar):
 *  - LexListService obtains the list of lexicons from the server.
 *  - LexFileService is used to load JSON files (lexicons, metadata, tagset mappings).
 *  - LocationDataService stores the app's current state in the URL 
 *    and retrieves state from URL data at program begin.
 * @author Felix Dombek
 * @version 1.0
 * 
 ******************************************/



/** 
 * LexListService:
 * Class for accessing the list of available files. 
 * The downloaded files are cached after download so
 * that they only have to be downloaded once.
 */
class LexListService {

  /**
   * Creates a LexListService instance.
   */
  constructor() {

    /** The cache for the file list from the server. */
    this.lexListCache = undefined;

    /** The URL of the PHP script which provides the REST API for this service. */
    this.lexListUrl = 'filelist.php';
  }

  /**
   * Asynchronously retrieves the list of lexicon and metadata files.
   * The list is downloaded from the server if it is not
   * in the cache or if the forceRefresh parameter is false.
   * 
   * @param {boolean} forceRefresh - Refresh the list from the server 
   *                                 even if it is already in the cache.
   * @return {Promise} A promise which gets set when the requested file is ready.
   */
  getList(forceRefresh = false) {
    // test cache and forceRefresh flag first
    if (!this.lexListCache || forceRefresh) {
      // list must be downloaded
      return $.get(this.lexListUrl).then(
        response => (this.lexListCache = response)
      ).catch(
        this.handleError.bind(this)
      );
    } else {
      // use value from cache
      return Promise.resolve(this.lexListCache);
    }
  }

  /**
   * Callback function for getList which is executed in case of error.
   * Displays the error and logs it to the browser's console.
   * 
   * @param {*} error - Error info, set by Promise.catch
   */
  handleError(error) {
    console.error(`Could not load list of lexicons from ${this.lexListUrl}`, error);
    return Promise.reject(error.message || error);
  }
}

/*********************************************************************************************************
 * 
 ********************************************************************************************************/

/** 
 * LexFileService:
 * Class for retrieving JSON and metadata files from the server.
 * The downloaded files are cached so that they only have to be
 * downloaded once.
 */
class LexFileService {

  /**
   * Constructs a LexFileService instance.
   */
  constructor() {

    /** The cache for downloaded files, a mapping {filename -> JSON object} */
    this.fileCache = {};

    /** The URL of the PHP script which provides the REST API for this service. */
    this.lexFileUrl = 'getfile.php';
  }

  /**
   * Asynchronously retrieve a JSON or metadata file from the server or
   * the cache, if present.
   * 
   * @param {string} filename The name of the requested file (no paths allowed).
   * @param {boolean} forceReload Reload file from server even if it is already cached.
   * @return {Promise} A promise which gets set when the requested file is ready.
   */
  getFile(filename, forceReload = false) {
    // check if file must be redownloaded
    if (!(filename in this.fileCache) || forceReload) {
      // download file from server
      return $.get(this.lexFileUrl, { 'file': filename }).then(
        response => (this.fileCache[filename] = response)
      ).catch(
        error => this.handleError(error, filename)
      );
    } else {
      // use file from cache
      return Promise.resolve(this.fileCache[filename]);
    }
  }

  /**
   * Callback function for getList which is executed in case of error.
   * Displays the error and logs it to the browser's console.
   * 
   * @param {*} error - Error info, set by Promise.catch
   */
  handleError(error, filename) {
    console.error(`Could not load ${filename} from ${this.lexFileUrl}`, error);
    return Promise.reject(error.message || error);
  }
}

/*********************************************************************************************************
 * 
 ********************************************************************************************************/

/**
 * LocationDataService:
 * Enables Components to write and retrieve state to/from location data.
 * This enables the app to express its current state as its location
 * and restore that state if such a URL is shared.
 */
class LocationDataService {

  /**
   * Initializes the object's cache as empty.
   */
  constructor() {
    this.stateObjects = {};
  }

  /**
   * Adds info to the current URL or modifies it.
   * The total size of all data cannot exceed ~2 KB in JSON-serialized form.
   * 
   * @param {string} objectName - An identifier under which the data can be accessed later, e.g. Component name. Keep it short.
   * @param {*} objectData - The data the component wants to write. Can be any JSON-serializable data object.
   */
  UpdateLocation(objectName, objectData) {
    this.stateObjects[objectName] = objectData;
    this.locationState = JSON.stringify(this.stateObjects);
    if (gSettings.compressUrlData) {
      this.locationState = LZString.compressToEncodedURIComponent(this.locationState);
    }
    document.location.hash = this.locationState;
  }

  /**
   * Reads info from the current URL.
   * 
   * @param {string} [objectName] - Optional; the identifier with which the data was written.
   * @return {*} - If objectName is set: the data written for this identifier or undefined if no data was written;
   *               if objectName is not set or empty: an object with all data from the URL, which can be an empty object.
   */
  GetLocation(objectName) {
    this.locationState = document.location.hash;
    if (this.locationState.length > 1) {
      try {
        this.locationState = decodeURIComponent(this.locationState.substring(1));
        if (gSettings.compressUrlData) {
          this.locationState = LZString.decompressFromEncodedURIComponent(this.locationState);
        }
        this.stateObjects = JSON.parse(this.locationState);
        if (!this.stateObjects) {
          throw 'Location data evaluated to empty result';
        }
      } catch (e) {
        console.warn('Invalid data in URL, state cannot be retrieved and is reset.', e);
        document.location.hash = '';
        this.stateObjects = {};
      }
    } else {
      this.stateObjects = {};
    }
    return objectName ?
      (typeof this.stateObjects[objectName] === 'object' ?
        $.extend({}, this.stateObjects[objectName]) :
        this.stateObjects[objectName]) :
      $.extend({}, this.stateObjects);
  }
}