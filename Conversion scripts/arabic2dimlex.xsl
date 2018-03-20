<?xml version="1.0" encoding="UTF-8" ?>

<!--
    Document   : arabic2dimlex.xsl
    Created on : 2018/3/16
    Author     : Felix Dombek
    Description: 
        Transforming Arabic Discourse Cues XML format to DiMLex XML format.
-->

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="xml" 
              indent="yes" 
              doctype-system="dimlex.dtd"/> 
    
  <xsl:template match="/"> 
    <dimlex>
      <!-- Grouping by wording. Equal wordings are aggregated into one <entry>. -->
      <xsl:for-each-group select="/Liste/marqueur" group-by="normalize-space(lemme)">
        
        <!-- Generate a new ID by concatenating all IDs in the group. -->
        <entry id="{string-join(current-group()/@id, '-')}" 
               word="{current-grouping-key()}">
                 
          <!-- Output the source entries as comments. -->
          <xsl:for-each select="current-group()">
            <xsl:text>&#xa;</xsl:text>
            <xsl:comment>
              <xsl:value-of select="@id" /><xsl:text>&#x9;</xsl:text>
            </xsl:comment>
          </xsl:for-each>
          <xsl:text>&#xa;</xsl:text>
          
          <orths>
            <xsl:apply-templates select="lemme" />
          </orths>
          
          <ambiguity>
            <non_conn />
            <sem_ambiguity>
              <!-- A connective is ambiguous iff there are multiple <connecteur>
                   entries for it in the source xml.
                   (This definition only takes into account ambiguities between connectives,
                    it doesn't handle ambiguities between connective and non-connective.) -->
              <xsl:value-of select="number(count(current-group()) > 1)" />
            </sem_ambiguity>
          </ambiguity>
          
          <focuspart />
          
          <non_conn_reading />
          
          <stts />
          
          <!-- Disambiguation of syntactic category. -->
          <xsl:for-each-group select="current-group()" group-by="@cat">
            <syn>
              <cat>
                  <xsl:value-of select="current-grouping-key()" />
              </cat>
              
              <integr />
              <ordering />
              
              <!-- Disambiguation of semantic relations. -->
              <xsl:for-each select="current-group()">
                <sem>
                  <sdrt_relation sense="{rel-EN}" />
                </sem>
              </xsl:for-each>
            </syn>
          </xsl:for-each-group>
          
        </entry>
      </xsl:for-each-group>
    </dimlex>
  </xsl:template>

  <!-- Translation of representation for different orthographical variants. -->
  <xsl:template match="lemme">
    <!-- Trimming and removing parenthesis from wording. -->
    <xsl:variable name="lemme-text" 
                  select="normalize-space(replace(current(), '[()]+', ''))" />
                  
    <!-- Splitting of non-continuous connectives by ellipsis '...'. -->
    <xsl:variable name="parts" 
                  select="tokenize($lemme-text, '[ ]*((\.\.\.)|…)[ ]*')" />
    <xsl:variable name="orth-type" 
                  select="if (count($parts) > 1) 
                          then 'discont' 
                          else 'cont'" />
    
    <xsl:call-template name="orth">
      <xsl:with-param name="type" 
                      select="$orth-type" />
      <xsl:with-param name="canonical" 
                      select="number(position() = 1)" />
      <xsl:with-param name="id" 
                      select="../@id" />
      <xsl:with-param name="lemme-pos" 
                      select="position()" />
      <xsl:with-param name="parts" 
                      select="$parts" />
    </xsl:call-template>
  </xsl:template>
  
  <!-- Enumerating the possible capitalization variants. -->
  <xsl:template name="orth">
    <xsl:param name="type" />
    <xsl:param name="canonical" />
    <xsl:param name="id" />
    <xsl:param name="lemme-pos" />
    <xsl:param name="parts" />
    
    <xsl:choose>
      <xsl:when test="$type = 'cont'">
        <!-- a -->
        <orth type="{$type}" 
              canonical="{$canonical}"
              onr="{concat($id, 'o', $lemme-pos * 2 - 1)}">
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
          </xsl:call-template>
        </orth>
      </xsl:when>
      <xsl:otherwise>
        <!-- a b -->
        <orth type="{$type}" 
              canonical="{$canonical}"
              onr="{concat($id, 'o', $lemme-pos * 4 - 3)}">
            
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
          </xsl:call-template>
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[2]" />
          </xsl:call-template>
        </orth>
	  </xsl:otherwise>
	</xsl:choose>
  </xsl:template>
  
  <!-- Generation of an orthographical variant with a particular capitalization. -->
  <xsl:template name="part">
    <xsl:param name="part-text" />
    
    <!-- A form containing spaces or apostrophes within the word (not as last char)
         is of type phrasal, otherwise of type single. -->
    <xsl:variable name="part-type"
                  select="if (matches($part-text, '[ ''].')) 
                            then 'phrasal' 
                            else 'single'" />
                            
    <part type="{$part-type}">
      <xsl:value-of select="$part-text" />  
    </part>
  </xsl:template>

</xsl:stylesheet> 