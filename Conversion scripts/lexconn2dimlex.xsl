<?xml version="1.0" encoding="UTF-8" ?>

<!--
    Document   : lexconn2dimlex.xsl
    Created on : 2017/2/1
    Author     : Felix Dombek
    Description: 
        Transforming LEXCONN XML format to DiMLex XML format.
-->

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="xml" 
              indent="yes" 
              doctype-system="dimlex.dtd"/> 
    
  <xsl:template match="/"> 
    <dimlex>
      <!-- Grouping by wording. Equal wordings are aggregated into one <entry>. -->
      <xsl:for-each-group select="/liste/connecteur" group-by="normalize-space(forme[1])">
        
        <!-- Generate a new ID by concatenating all IDs in the group. -->
        <entry id="{string-join(current-group()/@id, '-')}" 
               word="{current-grouping-key()}">
                 
          <!-- Output the source entries as comments. -->
          <xsl:for-each select="current-group()">
            <xsl:text>&#xa;</xsl:text>
            <xsl:comment>
              <xsl:value-of select="@id" /><xsl:text>&#x9;</xsl:text>
              <xsl:value-of select="@cat" /><xsl:text>&#x9;</xsl:text>
              <xsl:value-of select="@relations" /><xsl:text>&#x9;</xsl:text>
              <xsl:value-of select="@type" />
            </xsl:comment>
          </xsl:for-each>
          <xsl:text>&#xa;</xsl:text>
          
          <orths>
            <xsl:apply-templates select="forme" />
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
                  <!-- Translation of compound relations, e.g. "flashback,explanation",
                       into multiple grouped relations. -->
                  <xsl:variable name="relations"
                                select="tokenize(@relations, ',')" />
                  <xsl:variable name="rel-type"
                                select="@type" />
                                
                  <xsl:for-each select="$relations">
                    <sdrt_relation sense="{.}"
                                   type="{$rel-type}" />
                  </xsl:for-each>
                  <xsl:apply-templates select="exemple" />
                  <synonyms>
                    <xsl:apply-templates select="synonyme" />
                  </synonyms>
                </sem>
              </xsl:for-each>
            </syn>
          </xsl:for-each-group>
          
        </entry>
      </xsl:for-each-group>
    </dimlex>
  </xsl:template>

  <!-- Translation of representation for different orthographical variants. -->
  <xsl:template match="forme">
    <!-- Trimming and removing parenthesis from wording. -->
    <xsl:variable name="forme-text" 
                  select="normalize-space(replace(current(), '[()]+', ''))" />
                  
    <!-- Splitting of non-continuous connectives by ellipsis '...'. -->
    <xsl:variable name="parts" 
                  select="tokenize($forme-text, '[ ]*((\.\.\.)|…)[ ]*')" />
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
      <xsl:with-param name="forme-pos" 
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
    <xsl:param name="forme-pos" />
    <xsl:param name="parts" />
    
    <xsl:choose>
      <!-- Two capitalization variants for continuous connectives. -->
      <xsl:when test="$type = 'cont'">
        <!-- a -->
        <orth type="{$type}" 
              canonical="{$canonical}"
              onr="{concat($id, 'o', $forme-pos * 2 - 1)}">
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
            <xsl:with-param name="capitalize"
                            select="false()" />
          </xsl:call-template>
        </orth>
        <!-- A -->
        <orth type="{$type}" 
              canonical="0"
              onr="{concat($id, 'o', $forme-pos * 2)}">
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
            <xsl:with-param name="capitalize"
                            select="true()" />
          </xsl:call-template>
        </orth>
      </xsl:when>
      <!-- Four capitalization variants for discontinuous connectives. -->
      <xsl:otherwise>
        <!-- a b -->
        <orth type="{$type}" 
              canonical="{$canonical}"
              onr="{concat($id, 'o', $forme-pos * 4 - 3)}">
            
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
            <xsl:with-param name="capitalize"
                            select="false()" />
          </xsl:call-template>
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[2]" />
            <xsl:with-param name="capitalize"
                            select="false()" />
          </xsl:call-template>
        </orth>
        <!-- A b -->
        <orth type="{$type}" 
              canonical="0"
              onr="{concat($id, 'o', $forme-pos * 4 - 2)}">
            
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
            <xsl:with-param name="capitalize"
                            select="true()" />
          </xsl:call-template>
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[2]" />
            <xsl:with-param name="capitalize"
                            select="false()" />
          </xsl:call-template>
        </orth>
        <!-- a B -->
        <orth type="{$type}" 
              canonical="0"
              onr="{concat($id, 'o', $forme-pos * 4 - 1)}">
            
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
            <xsl:with-param name="capitalize"
                            select="false()" />
          </xsl:call-template>
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[2]" />
            <xsl:with-param name="capitalize"
                            select="true()" />
          </xsl:call-template>
        </orth>
        <!-- A B -->
        <orth type="{$type}" 
              canonical="0"
              onr="{concat($id, 'o', $forme-pos * 4)}">
            
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[1]" />
            <xsl:with-param name="capitalize"
                            select="true()" />
          </xsl:call-template>
          <xsl:call-template name="part">
            <xsl:with-param name="part-text"
                            select="$parts[2]" />
            <xsl:with-param name="capitalize"
                            select="true()" />
          </xsl:call-template>
        </orth>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- Generation of an orthographical variant with a particular capitalization. -->
  <xsl:template name="part">
    <xsl:param name="part-text" />
    <xsl:param name="capitalize" />
    
    <!-- A form containing spaces or apostrophes within the word (not as last char)
         is of type phrasal, otherwise of type single. -->
    <xsl:variable name="part-type"
                  select="if (matches($part-text, '[ ''].')) 
                            then 'phrasal' 
                            else 'single'" />
                            
    <part type="{$part-type}">
      <xsl:choose>
        <xsl:when test="$capitalize">
          <xsl:value-of select="concat(upper-case(substring($part-text, 1, 1)), 
                                                  substring($part-text, 2))" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$part-text" />
        </xsl:otherwise>
      </xsl:choose>   
    </part>
  </xsl:template>
  
  <!-- Translation of examples. -->
  <xsl:template match="exemple">
    <example> 
      <xsl:value-of select="normalize-space()" />
    </example>
  </xsl:template>
  
  <!-- Translation of synonyms -->
  <xsl:template match="synonyme">
    <synonym entry-id="{@connecteur}">
      <xsl:value-of select="normalize-space(/liste/connecteur[@id=current()/@connecteur]/forme[1])" />
    </synonym>
  </xsl:template>
  
  <!-- Currently unused. -->
  <xsl:template match="commentaire">
    <xsl:comment><xsl:value-of select="." /></xsl:comment>
  </xsl:template>
    
</xsl:stylesheet> 