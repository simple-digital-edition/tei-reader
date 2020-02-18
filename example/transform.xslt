<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:room3b="https://www.room3b.eu">
  <xsl:template match="tei:TEI">
    <tei:TEI><xsl:apply-templates select="tei:teiHeader|tei:text"/></tei:TEI>
  </xsl:template>
  <xsl:template match="tei:persName">
    <tei:persName><xsl:value-of select="tei:forename/text()"/><xsl:text> </xsl:text><xsl:value-of select="tei:surname/text()"/></tei:persName>
  </xsl:template>
  <xsl:template match="tei:text">
    <tei:text><tei:body><xsl:apply-templates select="tei:front/*|tei:body/*" /></tei:body></tei:text>
  </xsl:template>
  <xsl:template match="tei:choice">
    <xsl:variable name="choice_id" select="room3b:uid('choice')"/>
    <tei:ref type="choice"><xsl:attribute name="target">#<xsl:value-of select="$choice_id"/></xsl:attribute><xsl:apply-templates select="tei:corr/* | tei:corr/text()"/></tei:ref>
    <tei:choice>
      <xsl:attribute name="xml:id"><xsl:value-of select="$choice_id"/></xsl:attribute>
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="tei:corr"/>
      <xsl:apply-templates select="tei:sic"/>
    </tei:choice>
  </xsl:template>
  <xsl:template match="tei:head">
    <tei:head>
      <xsl:attribute name="xml:id"><xsl:value-of select="room3b:uid('heading')"/></xsl:attribute>
      <xsl:apply-templates select="@* | node()"/>
    </tei:head>
  </xsl:template>
  <xsl:template match="@* | node()">
    <xsl:copy><xsl:apply-templates select="@* | node()"/></xsl:copy>
  </xsl:template>
</xsl:stylesheet>
