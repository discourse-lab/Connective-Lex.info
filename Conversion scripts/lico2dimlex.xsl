<?xml version="1.0" encoding="UTF-8" ?>

<!--
    Document   : conano2dimlex.xsl
    Created on : 2017/2/5
    Author     : Felix Dombek
    Description: 
        Transforming LICO/ConAno XML format to DiMLex XML format.
-->

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml" 
            indent="yes" 
            doctype-system="dimlex.dtd"/>
            
    <!-- Load the DiMLex XML file to match synonym IDs to text during synonym translation. -->
    <xsl:variable name="dimlex" select="document('dimlex-2017.xml')" />
    
    <xsl:template match="/"> 
    <dimlex>
        <xsl:apply-templates select="lico/entry" />
    </dimlex>
    </xsl:template>
    
    <!-- Translate entries -->
    <xsl:template match="entry">
    
        <!-- IDs cannot have numeric values, so prepend a 'c' for 'connective'. -->
        <entry id="{concat('c', @id)}" word="{string-join(orth[1]/part, ' ... ')}">
            <orths>
                <xsl:apply-templates select="orth" />
            </orths>
            
            <ambiguity>
                <non_conn />
                <sem_ambiguity />
            </ambiguity>
            
            <focuspart />
            
            <correlate />
			
            <synonyms>
              <xsl:if test="commento/text()">
                  <xsl:apply-templates select="commento" />
              </xsl:if>
            </synonyms>
            
            <non_conn_reading />
            
            <stts />
            
            <xsl:apply-templates select="syn" />
        </entry>
    </xsl:template>
    
    <!-- Translate syn -->
    <xsl:template match="syn">
        <syn>
            <cat><xsl:value-of select="lower-case(normalize-space(@type))" /></cat>
            <integr />
            <ordering />
            
            <xsl:apply-templates select="sem" />
        </syn>
    </xsl:template>
    
    <!-- Translate sem -->
    <xsl:template match="sem">
        <sem>
            <xsl:apply-templates select="coh-relation" />
            <xsl:apply-templates select="example" />
        </sem>
    </xsl:template>
    
    <xsl:template match="coh-relation">
        <pdtb3_relation sense="{.}" />            
    </xsl:template>
    
    <xsl:template match="example">
        <example>
            <xsl:value-of select="." />
        </example>
    </xsl:template>
    
    <!-- Translate the list of synonyms -->
    <xsl:template match="commento">
      <xsl:variable name="lexName" select="lower-case(substring-before(., '.xml'))" />
      <xsl:variable name="lexId" select="substring-before(substring-after(., '&quot;'), '&quot;')" />
      <xsl:variable name="coh" select="substring-after(., 'coh-relation=')" />
        
      <synonym lexicon="{$lexName}" entry-id="{$lexId}">
        <!-- LICO contains only DiMLex IDs as synonyms. To get the actual word for display
             if the referenced lexicon is DiMLex, we load the referenced entry from the DiMLex XML. --> 
        <xsl:if test="$lexName = 'dimlex'">
          <xsl:if test="text() and not(contains(text(), 'ERROR-TODO'))">
            <xsl:variable name="dimlexId" select="substring-before(substring-after(., '&quot;'), '&quot;')" />
            <xsl:variable name="coh" select="substring-after(., 'coh-relation=')" />
            <xsl:variable name="dimlexEntry" select="$dimlex/*/entry[@id=$lexId]" />
            <xsl:value-of select="$dimlexEntry/@word" />
          </xsl:if>
        </xsl:if>
      </synonym>
    </xsl:template>
    
    <!-- Generate orthographic variants. -->
    <xsl:template match="orth">    
      
      <xsl:variable name="parts" 
                    select="part" />
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
                        select="concat('c', ../@id)" />
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
    
</xsl:stylesheet> 