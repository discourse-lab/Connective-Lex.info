<?xml version="1.0" encoding="UTF-8" ?>

<!--
    Document   : make_id_map.xsl
    Created on : 2017/02/27
    Author     : Felix Dombek
    Description: 
        Creates a mapping of ConAnoLex words to their IDs.
-->

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml" 
            indent="yes" />
    
    <xsl:template match="/"> 
      <map>
      <xsl:apply-templates select="//entry" />
      </map>
    </xsl:template>
    
    
    <xsl:template match="entry">
        <entry id="{@id}" orth="{.//orth[1]}" />
    </xsl:template>
    
</xsl:stylesheet> 