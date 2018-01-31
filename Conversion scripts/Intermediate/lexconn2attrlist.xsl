<?xml version="1.0" encoding="UTF-8" ?>

<!--
    Document   : lexconn2attrlist.xsl
    Created on : 2017/2/1
    Author     : Felix Dombek
    Description: 
        Transforming LEXCONN XML format to DiMLex XML format.
-->

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml" indent="yes" doctype-system="dimlex.dtd"/> 

    <xsl:template match="/"> 
    <vals>
        <xsl:comment>
        prep    Preposition     avant de
        csu     Subordinating conjunction
        adv     Adverb
        cco     Coordinating conjunction
        unknown
        prep-V-ant  Preposition with present participle (Gérondif)   en, tout en
        </xsl:comment>
        <cats>
        <xsl:for-each select="distinct-values(/liste/connecteur/@cat)">
            <xsl:sort select="."/>
            <cat name="{.}"/>
        </xsl:for-each>
        </cats>
        
        <rels>
        <xsl:for-each select="distinct-values(/liste/connecteur/@relations)">
            <xsl:sort select="."/>
            <rel name="{.}"/>
        </xsl:for-each>
        </rels>
        
        <types>
        <xsl:for-each select="distinct-values(/liste/connecteur/@type)">
            <xsl:sort select="."/>
            <type name="{.}"/>
        </xsl:for-each>
        </types>
        
        <pos-advs>
        <xsl:for-each select="distinct-values(/liste/connecteur/@position-adv)">
            <xsl:sort select="."/>
            <pos-adv name="{.}"/>
        </xsl:for-each>
        </pos-advs>
        
        <pos-subs>
        <xsl:for-each select="distinct-values(/liste/connecteur/@position-sub)">
            <xsl:sort select="."/>
            <pos-sub name="{.}"/>
        </xsl:for-each>
        </pos-subs>
    </vals>
    </xsl:template>

</xsl:stylesheet> 