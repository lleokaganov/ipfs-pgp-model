<?php
// https://site.lleo.me/ipfs-pgp-model5/pinger.php?action=save&account=14ETeSygHv2VBQJSQuBWnzf1TujhfvxehcXHqEdEPxJqRw6o&hash=0x0101010101010101010101010101010101010101010101010101010101010102
// https://site.lleo.me/ipfs-pgp-model5/pinger.php?action=read&account=14ETeSygHv2VBQJSQuBWnzf1TujhfvxehcXHqEdEPxJqRw6o

header('Access-Control-Allow-Origin: *'); // Разрешить доступ с любых источников
header('Content-Type: application/json'); // Установить тип содержимого как JSON

$baseDir = __DIR__ . '/pingdata';

$action = $_GET['action'] ?? null;

$account = $_GET['account'] ?? null;

if(!$account || !preg_match('/^[1-9A-HJ-NP-Za-km-z]{47,55}$/', $account)) die('Error 404 account');

$hash = $_GET['hash'] ?? null;
if($hash && !preg_match('/^0x[0-9a-f]{64}$/', $hash)) $hash=null;

if(!file_exists($baseDir)) mkdir($baseDir, 0777, true);

$dir = $baseDir.'/'.$account;

if($action === 'save') {
    if(!$hash) die('Error 404 hash');
    if(!file_exists($dir)) mkdir($dir, 0777, true);
    touch($dir.'/'.$hash);
    die('OK');
}

if($action === 'read') {
    if(!file_exists($dir)) die('[]');
    $files = scandir($dir);
    $files = array_diff($files,['.', '..']);
    $result = [];
    foreach($files as $file) {
        $f = $dir.'/'.$file;
        $result[$file] = filemtime($f);
    }
    array_map('unlink',glob($dir.'/*')); rmdir($dir); // Удаляем файлы и пустую папку
    die(json_encode($result));
}

die('Error 404');
?>