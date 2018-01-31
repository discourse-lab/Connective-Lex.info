<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml" indent="yes" doctype-system="dimlex.dtd"/> 

    <xsl:template match="/"> 
    <vals>
        <xsl:comment>
        konnadv (adverb),
        padv    (adverb with prepositional part),
        konj    (coordinating conjunction), 'und'
        subj    (subordinating conjunction), 'weil', 'obwohl' (requires verb-final complement, can be moved in matrix clause)
        v2emb   (v2-embedder), 'vorausgesetzt' (V2 complement, but embedded clause can be moved in matrix)
        postp   (postponer), 'weshalb' (verb-final complement, cannot be moved in matrix clause)
        appr    (preposition), 'anstatt'
        appo    (postposition), 'wegen'
        apci    (circumposition), 'um ... willen'
        einzel  (isolated) 'dass'
        </xsl:comment>
        <syn-cats>
        <xsl:for-each select="distinct-values(/dimlex/entry/syn/cat)">
            <cat name="{.}"/>
        </xsl:for-each>
        </syn-cats>
        
        <xsl:comment>
        KON     nebenordnende Konjunktion   und, oder, aber
        ADV     Adverb  schon, bald, doch
        APPR    Präposition; Zirkumposition links   in [der Stadt], ohne [mich]
        KOUI    unterordnende Konjunktion mit (zu-)Infinitiv    um [zu leben], anstatt [zu fragen]
        XXX         anstelle dessen
        PAV     Pronominaladverb	dafür, dabei, deswegen, trotzdem (=PROAV)
        KOUS    unterordnende Konjunktion   weil, dass, damit, wenn, ob
        PROAV   Pronominaladverb 
        PWAV    adverbiales Interrogativpronomen    warum, wo, wann, worüber, wobei
        </xsl:comment>
        <stts-types>
        <xsl:for-each select="distinct-values(/dimlex/entry/stts/example/@type)">
            <type name="{.}"/>
        </xsl:for-each>
        </stts-types>
        
        <relations>
        <xsl:for-each select="distinct-values(/dimlex/entry/syn/sem/*/@sense)">
            <xsl:sort select="." />
            | <xsl:value-of select="." />
        </xsl:for-each>
        </relations>
        
    </vals>
    </xsl:template>

</xsl:stylesheet> 