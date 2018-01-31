<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!--
	html
	Created by Grégoire Détrez on 2009-05-18.
	Copyright (c) 2009 __MyCompanyName__. All rights reserved.
-->
<xsl:stylesheet version="1.0"
				xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
				xmlns="http://www.w3.org/1999/xhtml" >
	<xsl:strip-space elements="forme"/> 
	<xsl:output encoding="UTF-8" indent="yes" method="xml" />
	
	<xsl:template match="exemple">
		<tr>
			<td colspan="4">
				<dl>
					<dt>Exemple:</dt>
					<dd style="font-style:italic;"><xsl:value-of select="."/></dd>
				</dl>
			</td>
		</tr>
	</xsl:template>

	<xsl:template match="commentaire">
		<tr>
			<td colspan="4">
				<dl>
					<dt>Commentaire:</dt>
					<dd><xsl:value-of select="."/></dd>
				</dl>
			</td>
		</tr>
	</xsl:template>
	
	<xsl:template match="exemple" mode="dl">
		<dt>Exemple :</dt>
		<dd style="font-style:italic;"><xsl:value-of select="."/></dd>
	</xsl:template>

	<xsl:template match="commentaire" mode="dl">
		
		<dt>Commentaire :
		  <xsl:if test="@reference"> [<xsl:value-of select="@reference"/>]</xsl:if>
		</dt>
		<dd><xsl:value-of select="."/></dd>
	</xsl:template>
	
	<xsl:template match="forme">
		<xsl:choose>
			<xsl:when test="position() = last()">
				<xsl:value-of select="."/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="."/>,
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="synonyme" mode="link">
		<xsl:variable name="syn_id"><xsl:value-of select="@connecteur"/></xsl:variable>
		<xsl:choose>
			<xsl:when test="position() = last()">
				<a href="#{@connecteur}"><xsl:value-of select="//connecteur[@id=current()/@connecteur]/forme" /></a>
			</xsl:when>
			<xsl:otherwise>
				<a href="#{@connecteur}"><xsl:value-of select="//connecteur[@id=current()/@connecteur]/forme" /></a>,&nbsp;
			</xsl:otherwise>
		</xsl:choose>			 
	</xsl:template>

<xsl:template match="/">
<html lang="fr" xml:lang="fr" xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<style>
table {
	font: 11px/24px Verdana, Arial, Helvetica, sans-serif;
	border-collapse: collapse;
	width: 100%;
	}

th {
	padding: 0 0.5em;
	text-align: left;
	}

thead tr th {
	text-align: center;
	border-top: 2px solid #FB7A31;
	border-bottom: 2px solid #FB7A31;
	background: #FFC;
	}
	thead tr th:first-child {
		text-align: left;
		}

tbody tr td {
	border-bottom: 1px solid #CCC;
	padding: 0 0.5em;
	border-left: 1px solid #CCC;
	text-align: center;
	}
	tbody td:first-child {
		width: 190px;
		border-left: none;
		text-align: left;
		}
	tbody tr:last-child td {
		border-bottom: 2px solid black;
		}

dt {
  font-weight: bold;
  }
				</style>
			</head>
			<body>
				<table cellspacing="0">
					<thead>
						<tr>
							<th>Forme</th>
							<th>Cat</th>
							<th>Type</th>
							<th>Relations</th> 
						</tr>
					</thead>
					<xsl:for-each select="liste/connecteur">
						<tbody>
						<tr class="connecteur">
							<td>
								<a>
									<xsl:attribute name="name">
										<xsl:value-of select="@id"/>
										</xsl:attribute>
								</a>
								<xsl:apply-templates select="forme"/>
							</td>
							<td>
								<xsl:value-of select="@cat"/>
								<xsl:if test="@position-adv">
								[position: <xsl:value-of select="@position-adv"/>]
								</xsl:if>
								<xsl:if test="@position-sub">
								[subordonnée <xsl:value-of select="@position-sub"/>]
								</xsl:if>
							</td>
							<td><xsl:value-of select="@type"/></td>
							<td><xsl:value-of select="@relations"/></td>
						</tr>
						<xsl:if test="synonyme|exemple|commentaire">
						<tr><td colspan="4">
						  <dl>
								<xsl:apply-templates select="exemple|commentaire" mode="dl"/>
								<xsl:if test="synonyme">
								<dt>Synonymes :</dt>
								<dd><xsl:apply-templates select="synonyme" mode="link"/></dd>
								</xsl:if>
						  </dl>
						</td></tr>
						</xsl:if>
						</tbody>
					</xsl:for-each>
				</table>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
