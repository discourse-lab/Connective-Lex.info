::
::
:: File       : run_saxon.bat
:: Created on : 2017/2/1
:: Author     : Felix Dombek
:: Description:
::     Run the Saxon XSL processor on a given file.
::     Uncomment only the line(s) you want to execute.
::
@echo off

:: LEXCONN
::transform -s:../xml/lexconn/lexconn.xml -xsl:lexconn2dimlex.xsl -o:lexconn_d.xml

:: LICO
::transform -s:../XML/LICO/LICO-v.1.0.xml -xsl:lico2dimlex.xsl -o:lico_d.xml

:: LDM-PT
::transform -s:../XML/LDM-PT/LDM_Lexicon_Discourse_Markers_1_3_dimlex.xml -xsl:ldm-pt2dimlex.xsl -o:ldm-pt_d.xml

:: CONCOLEDISCO
::transform -s:../xml/concoledisco/concoledisco.xml -xsl:concoledisco2dimlex.xsl -o:concoledisco_d.xml

:: ARABIC
::transform -s:"../Original lexicons/Arabic Discours cues.xml" -xsl:arabic2dimlex.xsl -o:arabic_d.xml

:: ATTRIBUTE LISTS
:: - LEXCONN
::transform -s:../xml/lexconn/lexconn.xml -xsl:Intermediate/lexconn2attrlist.xsl -o:Intermediate/lexconn_attrlist.xml
::transform -s:"lexconn_as_dimlex.xml"  -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/lexconn_as_dimlex_attrlist.xml

:: - DIMLEX
::transform -s:dimlex_public.xml -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/dimlex_attrlist.xml
::transform -s:"../XML/dimlex public 2017/DimLex.xml"  -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/dimlex_attrlist.xml
::transform -s:"dimlex-2017.xml"  -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/dimlex-2017_attrlist.xml

:: - PDTB-DIMLEX
::transform -s:../XML/en_dimlex.xml -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/en_dimlex_attrlist.xml

:: - LICO
::transform -s:"lico_as_dimlex.xml"  -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/lico_as_dimlex_attrlist.xml

:: - LDM-PT
::transform -s:ldm-pt_as_dimlex.xml -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/ldm-pt_attrlist.xml

:: - CONCOLEDISCO
::transform -s:../xml/concoledisco/concoledisco.xml -xsl:Intermediate/lexconn2attrlist.xsl -o:Intermediate/lexconn_attrlist.xml

:: ARABIC
transform -s:arabic_d.xml -xsl:Intermediate/dimlex2attrlist.xsl -o:Intermediate/arabic_attrlist.xml

:: MAPS
::transform -s:"../XML/dimlex public 2016/ConAnoConnectorLexicon.xml"  -xsl:Intermediate/make_id_map.xsl -o:Intermediate/conanolex2016_ids.xml
::transform -s:"../XML/dimlex public 2017/ConAnoConnectorLexicon.xml"  -xsl:Intermediate/make_id_map.xsl -o:Intermediate/conanolex2017_ids.xml
::transform -s:"dimlex_public.xml"  -xsl:Intermediate/make_id_map.xsl -o:Intermediate/dimlex_ids.xml
::transform -s:"..\XML\Dimlex nonpublic 2017\dimlex.xml" -xsl:Intermediate/dimlex_sdrt2pdtb3.xsl -o:Intermediate/dimlex_sdrt-pdtb3_map.xml

:: TESTS
::transform -s:../xml/lexconn.xml -xsl:Intermediate/test.xsl -o:Intermediate/testout.html