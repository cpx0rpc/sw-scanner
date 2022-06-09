<?php
	$files = array_diff(scandir('./included_files/'.$_GET['folder']), array('.', '..'));
	echo(json_encode($files));
?>
