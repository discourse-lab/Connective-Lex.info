/******************************************
 * 
 * c24-settings.js 
 * @file Contains a global settings object.
 * @author Felix Dombek
 * @version 1.0
 * 
 ******************************************/

/**
 * Global settings object for use by all other app objects.
 */
let gSettings = {

  /** 
   * True iff {@link LocationDataService} should compress the URL data with an LZ library.
   * This is only smaller for large data strings (e.g., when storeSensesInUrl is enabled).
   */
  compressUrlData: false,

  /** 
   * True iff {@link OptionsComponent} should write the selected senses into its URL data.
   * The downside is that the URLs get very, very big, even though the component is smart
   * enough to only write *true* options instead of all options.
   */
  storeSensesInUrl: true,

  /**
   * Use bootstrap tooltips or regular, native ones.
   */
  useBootstrapTooltips: true
}