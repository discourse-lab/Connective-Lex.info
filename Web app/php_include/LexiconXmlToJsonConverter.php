<?php
/**************************************************************

    Document   : LexiconXmlToJsonConverter.php
    Created on : 2017/02/20
    Author     : Felix Dombek
    Description: 
        Contains classes for xml-to-json conversion, 
        file listing and settings.
        
**************************************************************/

/**
 * A class derived from Exception which wraps XML parser errors.
 */
class XmlException extends Exception
{
  private $xml_errors;
  
  public function __construct(array $xml_errors, $message = '', $code = 0, Exception $prev = null)
  {
    parent::__construct($message, $code, $prev);
    $this->xml_errors = $xml_errors;
  }
  
  public function getXmlErrors()
  {
    return $this->xml_errors;
  }
}

/**
 * Helper class to load global settings from a JSON file
 * and cache them.
 */
class SettingsLoader
{
  // Cache the settings so they are only read once.
  static $s_settings = null;
  
  // Prevent object creation.
  private function __construct() {}
  
  /**
   *
   */
  public static function GetSettings()
  {
    if (!self::$s_settings) {
      self::$s_settings = self::LoadSettings();
    }
    return self::$s_settings;
  }
  
  /**
   *
   */
  private static function LoadSettings()
  {
    $settings_str = file_get_contents("settings.json", FILE_USE_INCLUDE_PATH);
    if (!$settings_str)
    {
      throw new Exception("Could not load settings file.");
    }
    $settings = json_decode($settings_str);
    if (!$settings) {
      throw new Exception("Could not parse JSON settings file.");
    }
    return $settings;
  }
}

/**
 * A class to list lexicons and convert XML lexicons to JSON. 
 */
class LexiconXmlToJsonConverter
{
  private $m_settings;
  private $m_xmldir = "";
  private $m_allowForce;
  
  /**
   * Sets up class member values.
   */
  public function __construct($settings)
  {
    $this->m_settings = $settings;
    $this->m_xmldir = $this->m_settings->xmlDirectory;
    $this->m_allowForce = $this->m_settings->allowForceReparse;
  }
  
  /**
   * Enumerates all XML files and converts them if necessary.
   * By default, it only converts those files which are newer 
   * than their corresponding JSON counterparts.
   */
  public function TryConvertAll(bool $force = false)
  {
    $xmlentries = $this->GetFileInfo();
    $force = $this->m_allowForce && $force;
    foreach ($xmlentries as &$xmlentry) {
      if ($xmlentry['needsConversion'] || $force) {
        $this->TryConvert($xmlentry);
      }
    }
    return $xmlentries;
  }
  
  /**
   * Tries to convert an XML file to JSON, catching any errors
   * that arise during the process.
   */
  public function TryConvert(array &$xmlentry)
  {
    $xmlfile  = new SplFileInfo($this->m_xmldir . '/' . $xmlentry['xmlFile']);
    $jsonfile = new SplFileInfo($this->m_xmldir . '/' . $xmlentry['jsonFile']);
    
    try {
      // Convert
      $this->Convert($xmlfile, $jsonfile);
      
      // On success: update structure
      $xmlentry['success'] = true;
      $xmlentry['beforeConversion'] = array(
        'hasJson'         => $xmlentry['hasJson'],        
        'needsConversion' => $xmlentry['needsConversion']);
      if (array_key_exists('jsonModified', $xmlentry)) 
      {
        $xmlentry['beforeConversion']['jsonModified'] = $xmlentry['jsonModified'];
      }
      
      $xmlentry['hasJson']         = true;      
      $xmlentry['jsonModified']    = gmdate('Y-m-d\TH:i:s\Z', $jsonfile->getMTime());
      $xmlentry['needsConversion'] = false;
      return true;
    }
    catch (Exception $e) {
      // On error: write error to structure
      $xmlentry['success'] = false;
      $xmlentry['error'] = array(
        'message' => $e->getMessage(),
        'code'    => $e->getCode());
      if ($e instanceof XmlException) {
        $xmlentry['error']['xmlErrors'] = $e->getXmlErrors();
      }      
      return false;
    }
  }
  
  /**
   * Converts the XML object to a PHP array that is more suitable for
   * JSON output.
   * Taken from https://outlandish.com/blog/xml-to-json/
   */
  public function xmlToArray($xml, $options = array()) {
    $defaults = array(
      'namespaceSeparator' => ':',//you may want this to be something other than a colon
      'attributePrefix' => '@',   //to distinguish between attributes and nodes with the same name
      'alwaysArray' => array(),   //array of xml tag names which should always become arrays
      'autoArray' => true,        //only create arrays for tags which appear more than once
      'textContent' => '$',       //key used for the text content of elements
      'autoText' => true,         //skip textContent key if node has no attributes or child nodes
      'keySearch' => false,       //optional search and replace on tag and attribute names
      'keyReplace' => false       //replace values for above search values (as passed to str_replace())
    );
    $options = array_merge($defaults, $options);
    $namespaces = $xml->getDocNamespaces();
    $namespaces[''] = null; //add base (empty) namespace
 
    //get attributes from all namespaces
    $attributesArray = array();
    foreach ($namespaces as $prefix => $namespace) {
      foreach ($xml->attributes($namespace) as $attributeName => $attribute) {
        //replace characters in attribute name
        if ($options['keySearch']) $attributeName =
          str_replace($options['keySearch'], $options['keyReplace'], $attributeName);
        $attributeKey = $options['attributePrefix']
          . ($prefix ? $prefix . $options['namespaceSeparator'] : '') . $attributeName;
        $attributesArray[$attributeKey] = (string)$attribute;
      }
    }
 
    //get child nodes from all namespaces
    $tagsArray = array();
    foreach ($namespaces as $prefix => $namespace) {
      foreach ($xml->children($namespace) as $childXml) {
        //recurse into child nodes
        $childArray = $this->xmlToArray($childXml, $options);
        $childTagName = key($childArray);
        $childProperties = current($childArray);

        //replace characters in tag name
        if ($options['keySearch']) $childTagName =
          str_replace($options['keySearch'], $options['keyReplace'], $childTagName);
        //add namespace prefix, if any
        if ($prefix) $childTagName = $prefix . $options['namespaceSeparator'] . $childTagName;

        if (!isset($tagsArray[$childTagName])) {
          //only entry with this key
          //test if tags of this type should always be arrays, no matter the element count
          $tagsArray[$childTagName] =
                  in_array($childTagName, $options['alwaysArray']) || !$options['autoArray']
                  ? array($childProperties) : $childProperties;
        } elseif (
          is_array($tagsArray[$childTagName]) && array_keys($tagsArray[$childTagName])
          === range(0, count($tagsArray[$childTagName]) - 1)
        ) {
          //key already exists and is integer indexed array
          $tagsArray[$childTagName][] = $childProperties;
        } else {
          //key exists so convert to integer indexed array with previous value in position 0
          $tagsArray[$childTagName] = array($tagsArray[$childTagName], $childProperties);
        }
      }
    }
 
    //get text content of node
    $textContentArray = array();
    $plainText = trim((string)$xml);
    if ($plainText !== '') $textContentArray[$options['textContent']] = $plainText;
 
    //stick it all together
    $propertiesArray = !$options['autoText'] || $attributesArray || $tagsArray || ($plainText === '')
      ? array_merge($attributesArray, $tagsArray, $textContentArray) : $plainText;
 
    //return node as array
    return array(
      $xml->getName() => $propertiesArray
    );
  }

  /**
   * Converts an XML file to JSON. Errors are simply handed to the calling function.
   */
  public function Convert(SplFileInfo $xmlfile, SplFileInfo $jsonfile)
  {
    libxml_use_internal_errors(true); // suppress warnings on XML errors
    $xmlerrors = array();
    try 
    {
      $sxe = new SimpleXMLElement($xmlfile->getRealPath(), null, true);
      $jsonfile = $jsonfile->openFile("w");
      $json_flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK;
      if ($this->m_settings->prettyPrintJson)
      {
        $json_flags |= JSON_PRETTY_PRINT;
      }

      $sxe = $this->xmlToArray($sxe, Array(
        'attributePrefix' => '',
        'alwaysArray' => Array('orth', 'part', 'synonym', 'example', 'syn', 'sem', 'pdtb3_relation', 'pdtb2_relation', 'sdrt_relation', 'case'),
        'autoText' => false,
        'textContent' => 't'
      ));
      foreach($sxe as $root => $child) 
      {
        $sxe = $child;
        break;
      }

      $jsonfile->fwrite(str_replace(array("<", ">"), array("&lt;", "&gt;"), json_encode($sxe, $json_flags)));
    } 
    catch (Exception $e) 
    {
      // add xml error info if necessary, then rethrow
      $xmlerrors = libxml_get_errors();
      if (count($xmlerrors) > 0) {
        throw new XmlException($xmlerrors, $e->getMessage(), $e->getCode(), $e);
      }
      else {
        throw $e;
      }
    }
  }
  
  /**
   * Retrieve info for all files in the data directory.
   */
  public function GetFileInfo()
  {
    $files_in_dir = scandir($this->m_xmldir);
    $file_info_all = array();
    foreach ($files_in_dir as $file) {  
      $xmlfile = new SplFileInfo($this->m_xmldir . '/' . $file);
      
      if ($xmlfile->isFile() && $xmlfile->getExtension() === 'xml') {
        // create json filename from xml filename
        $jsonpath = $xmlfile->getPath() . '/' . $xmlfile->getBaseName('.xml') . '.json';
        $jsonfile = new SplFileInfo($jsonpath);
        $jsonfile_exists = $jsonfile->isFile();
        
        // create meta filename from xml filename
        $metapath = $xmlfile->getPath() . '/' . $xmlfile->getBaseName('.xml') . '.meta';
        $metafile = new SplFileInfo($metapath);
        $metafile_exists = $metafile->isFile();
        
        $xml_modified = $xmlfile->getMTime();
        
        $file_info = array(
          'xmlFile'     => $xmlfile->getFilename(),
          'lexId'       => str_replace('.', '', str_replace('.xml', '', $xmlfile->getFilename())),
          'jsonFile'    => $jsonfile->getFilename(),
          'metaFile'    => $metafile->getFilename(),
          'hasJson'     => $jsonfile_exists,
          'hasMeta'     => $metafile_exists,
          'xmlModified' => gmdate('Y-m-d\TH:i:s\Z', $xml_modified));
        
        // check if xml needs to be converted to json because it's newer     
        $needs_conversion = true;        
        if ($jsonfile_exists) {      
          $json_modified = $jsonfile->getMTime();
          $file_info['jsonModified'] = gmdate('Y-m-d\TH:i:s\Z', $json_modified);
          
          if ($json_modified >= $xml_modified) {
            $needs_conversion = false;
          }
        }
        $file_info['needsConversion'] = $needs_conversion;
                
        if ($metafile_exists) {
          $meta_modified = $metafile->getMTime();
          $file_info['metaModified'] = gmdate('Y-m-d\TH:i:s\Z', $meta_modified);
        }
        
        $file_info_all[] = $file_info;
      }
    }
    return $file_info_all;
  }
  
}

?>