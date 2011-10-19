<?php

$path = "/home/bdalziel/dev/sly/trunk/node/tests/";

$files = array(
               "missingParen.less",
               "barLessVar.less",
               "colorManip.less",
               );

$testIndex = 1;
foreach ($files as $file) {
    print "############ Test " . $testIndex . ": " . $file . "\n";
    curlLess($path . $file);
    $testIndex++;
}

function curlLess ($fileName) {
    $url = "http://127.0.0.1:8000" . $fileName;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE); 
    $response = curl_exec($ch); 
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
    curl_close($ch);
    print "NODE {LESS}: " . $response;
    return;
}

?>
