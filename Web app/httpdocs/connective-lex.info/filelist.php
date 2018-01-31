<?php
/**************************************************************

    Document   : filelist.php
    Created on : 2017/02/20
    Author     : Felix Dombek
    Description: 
        REST interface which lists available lexicon files.
    
    GET params :
        force - (true|false). Optional - default: false.
                If true, all XML files are converted to JSON. 
                If false, only those newer than their JSON 
                counterparts (by last modified timestamp) are
                converted.
                
    Example    :
        filelist.php?force=false

**************************************************************/

// Load classes for settings and conversion
include_once "LexiconXmlToJsonConverter.php";

// All output is in JSON format
header('Content-Type: application/json; charset=utf-8');

// Evaluate GET param 'force'
$force = filter_input(INPUT_GET, 'force', FILTER_VALIDATE_BOOLEAN) || false;

// Load settings (e.g. XML paths) from JSON file
$settings = SettingsLoader::GetSettings();

// Create converter instance with loaded settings
$xml_conv = new LexiconXmlToJsonConverter($settings);

// Enumerate files and convert from XML to JSON, if necessary
if ($settings->autoConvert) {
  $conv_info = $xml_conv->TryConvertAll($force);
}
else {
  $conv_info = $xml_conv->GetFileInfo();
}

// Send data to user
$json_flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK;
if ($settings->prettyPrintJson)
{
  $json_flags |= JSON_PRETTY_PRINT;
}
echo json_encode($conv_info, $json_flags);

?>