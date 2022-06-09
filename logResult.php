<?php
function decodeString($data)
{
	$data = str_replace("@_0", "{", $data);
	$data = str_replace("@_1", "}", $data);
	$data = str_replace("@_2", "\"", $data);
	$data = str_replace("@_3", "[", $data);
	$data = str_replace("@_4", "]", $data);
	return $data;
}

$content = file_get_contents("php://input");
$decoded = json_decode($content, true);
$filename = $decoded["filename"];

//print_r($content);
file_put_contents("results/".strval($filename).".txt", decodeString($decoded["data"]), FILE_APPEND);
?>
