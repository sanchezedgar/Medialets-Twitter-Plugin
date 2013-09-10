<?php
// error_reporting(E_ALL);
// ini_set('display_errors', '1');

require('twitter.class.php');

$consumer_key = (isset($_GET['consumer_key']))? $_GET['consumer_key'] : 'LGqv8YPBjgIQFwu7YZ9IFw';
$consumer_secret = (isset($_GET['consumer_secret']))? $_GET['consumer_secret'] : 'yRKwre0DMJVeCNrmUZUeAR0NqwaiO9ZvE0SiglCYWPY';
$action = $_GET['action'];
$param = (isset($_GET['param']))? $_GET['param'] : '';
$expire = (isset($_GET['expire']) && is_numeric($_GET['expire']))? $_GET['expire'] : 300;
$mmcb = (isset($_GET['mmcb']))? $_GET['mmcb'] : 'callback';

$twitter = new Twitter($consumer_key, $consumer_secret, $expire);

if(isset($action) && method_exists($twitter,$action)){
    $results = $twitter->{$action}($param);
    if($_GET['debug'] == 'true'){
        $results = json_decode($results, true);
        $results["query"] = $_SERVER['QUERY_STRING'];
        $results = json_encode($results);
    }
    print $mmcb.'('. $results .')';
} else {
    $results = $mmcb.'({';
    if($_GET['debug'] == 'true'){
        $results += '"query":"'.$_SERVER['QUERY_STRING'].'",';
    }
    $results += '"code":666,"errors":[{"message":"The action requested does not exist."}]})';
    print $results;
}

$twitter->invalidateBearerToken();

?>
