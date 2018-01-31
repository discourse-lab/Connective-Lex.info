<?xml version="1.0" encoding="UTF-8" ?>

<!--
    Document   : lico_updateDimlexIds.xsl
    Created on : 2017/02/07
    Author     : Felix Dombek
    Description: 
        Exchanges ConAnoLex IDs in <commento> tags with Dimlex IDs.
-->

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml" 
            indent="no" />

    <xsl:variable name="oldIds" select="document('conanolex2016_ids_fixed.xml')" />
    <xsl:variable name="newIds" select="document('dimlex_ids.xml')" />
    
    <xsl:template match="@* | node()">
      <xsl:copy>
        <xsl:apply-templates select="@* | node()"/>
      </xsl:copy>
    </xsl:template>
    
    <xsl:template match="commento">      
      <xsl:variable name="oldId" select="replace(., '\D', '')" />
      <xsl:variable name="word" select="$oldIds/*/entry[@id=$oldId]/@orth" />            
      <xsl:variable name="newId" select="$newIds/*/entry[@orth=$word]/@id" />
      <xsl:variable name="coh" select="substring-after(., 'coh-relation=')" />
     
      <commento>
        <xsl:if test="text()">
          <xsl:value-of select="concat('DimLex.xml/id=&quot;', 
                                       if ($newId) 
                                         then $newId 
                                         else concat('ERROR-TODO: ', $oldId), 
                                       '&quot;',
                                       if ($coh)
                                         then concat('/coh-relation=', $coh)
                                         else '')" />
        </xsl:if>
      </commento>
    </xsl:template>
    
</xsl:stylesheet> 