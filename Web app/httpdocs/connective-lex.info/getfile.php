<?php
/**************************************************************

    Document   : getfile.php
    Created on : 2017/02/20
    Author     : Felix Dombek
    Description: 
        REST interface which outputs a desired lexicon.
    
    GET params :
        file -  String. Required.
                The lexicon filename (.json).
                
    Example    :
        getfile.php?file=dimlex.json

**************************************************************/

// Include helper class to load settings
include_once "LexiconXmlToJsonConverter.php";

// Send data compressed as gzip if supported by client
ob_start('ob_gzhandler');

// All output is in JSON format
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:4200');

try
{
  // Evaluate GET param 'file'.
  // Filename must not contain characters outside the ASCII range
  // nor slashes or backslashes. Any of those leads to an error.
  $filename = filter_input(INPUT_GET, 'file', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
  if (!$filename 
   || strpos($filename, '/') !== false
   || strpos($filename, '\\') !== false)
  {
    throw new Exception('Invalid filename');
  }

  // If filename does not end in '.json', append '.json'
  if (strstr($filename, '.json') !== '.json'
   && strstr($filename, '.meta') !== '.meta') {
    $filename .= '.json';
  }

  // Load settings (e.g. XML paths) from JSON file
  $settings = SettingsLoader::GetSettings();

  // Try loading requested file
  $jsonfile = new SplFileInfo($settings->xmlDirectory . '/' . $filename);
  if (!$jsonfile->isFile()) {
    throw new Exception('File not found.', 404);
  }

  header('Content-Length: ' . $jsonfile->getSize());
  echo file_get_contents($jsonfile->getRealPath());
}
catch (Exception $e)
{
  http_response_code($e->getCode());
  echo json_encode(array('error' => $e->getMessage()));
}

?>