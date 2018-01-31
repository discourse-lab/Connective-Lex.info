<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml" indent="yes" doctype-system="dimlex.dtd"/> 

  <xsl:key name="sdrt_key" match="/dimlex/entry" use="*/sdrt_lexconn/*/name()" />

    <xsl:template match="/"> 
    
    <map>
        <xsl:for-each-group select="//sdrt_lexconn/*" group-by="name()">
          <xsl:sort select="name()" /> 
          <xsl:variable name="sdrtRel" select="name()" />
          <xsl:variable name="entriesWithSdrt" select="key('sdrt_key', $sdrtRel)" />
          <entry sdrt="{$sdrtRel}">
          <counts>
            <xsl:for-each-group select="$entriesWithSdrt//pdtb3_relation" group-by="@sense">
              <xsl:sort select="count(current-group())" order="descending" />
              <pdtb3 name="{@sense}" 
                     count="{count(current-group())}">
                <xsl:for-each select="current-group()">
                  <xsl:variable name="entriesWithSdrtToPdtb3Sense"
                                select="../../.." />
                  <src entry-id="{$entriesWithSdrtToPdtb3Sense/@id}"
                       word="{$entriesWithSdrtToPdtb3Sense/@word}">
                  <xsl:variable name="sdrtRelsForEntry" select="$entriesWithSdrtToPdtb3Sense//sdrt_lexconn/*" />
                  <xsl:choose>
                  <xsl:when test="count($sdrtRelsForEntry) = count($entriesWithSdrtToPdtb3Sense//sdrt_lexconn/$sdrtRel)">
                    <xsl:attribute name="unique">true</xsl:attribute>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:attribute name="other">
                      <xsl:for-each-group select="$sdrtRelsForEntry" group-by="name()">
                        <xsl:if test="name() != $sdrtRel">
                          <xsl:value-of select="concat(name(), ' ')" />
                        </xsl:if>
                      </xsl:for-each-group>
                    </xsl:attribute>
                  </xsl:otherwise>
                  </xsl:choose>
                  </src>
                </xsl:for-each>
              </pdtb3>
            </xsl:for-each-group>
          </counts>
          </entry>
        </xsl:for-each-group>
    </map>
    </xsl:template>

</xsl:stylesheet> 