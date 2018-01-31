$xml = "<dmarkers>\n"; # write root tag
$skip1stline = 1;
while (<>) {
	if ($skip1stline || /^\t*\n?$/) { # Skip first line and empty lines
		$skip1stline = 0;
		next;
	}
	$line = $_;
	chop($line);
	( $word, $id, $orth1type, $orth1typep1, $orth1part1, $orth1typep2, $orth1part2, $type, $cat, $mood, $tense, $modifier1, $modifier2, $relationl1, $relationl2, $relationl3, $lexicon, $entryid, $synonym,  $ex1source, $example1, $ex2source, $example2, $ex3source, $example3, $comment ) = split("\t", $line);

		
	$entry = "	<dmarker word=\"$word\" id=\"$id\">
			<orth1 type=\"$orth1type\">
				<part1 type=\"$orth1typep1\">$orth1part1</part1>
				<part2 type=\"$orth1typep2\">$orth1part2</part2>
			</orth1>				
		<syn>
			<type>$type</type>
			<cat>$cat</cat>	
			<context>
				<mood>$mood</mood> 
				<tense>$tense</tense>
			</context>	
			<modifier1>$modifier1</modifier1>
			<modifier2>$modifier2</modifier2>
		</syn>	
		<sem>
			<relationl1>$relationl1</relationl1>
			<relationl2>$relationl2</relationl2>
			<relationl3>$relationl3</relationl3>
		</sem>	
		<synonym lexicon=\"$lexicon\" entry-id=\"$entryid\">$synonym</synonym>
		<examples>
			<example1 source=\"$ex1source\">$example1</example1>
			<example2 source=\"$ex2source\">$example2</example2>
			<example3 source=\"$ex3source\">$example3</example3>			
		</examples>
		<comment>$comment</comment>
	</dmarker>";

	$xml .= "$entry\n";
};
$xml .= "</dmarkers>";
binmode STDOUT; # Write LF linefeeds on every system
print $xml;
