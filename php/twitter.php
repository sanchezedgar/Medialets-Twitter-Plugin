<?php

$expire = (isset($_GET['expire']) && is_numeric($_GET['expire']))? $_GET['expire'] : 300;
header("Cache-Control: must-revalidate, public, max-age=".$expire.", s-maxage=".$expire);
// header("Cache-Control: public");
// header("Expires: " . gmdate("D, d M Y H:i:s", time() + $expire) . " GMT");
header("Content-Type: application/x-www-form-urlencoded");

require('lib/Twitter.class.php');

$consumer_key = (isset($_GET['consumer_key']))? $_GET['consumer_key'] : 'LGqv8YPBjgIQFwu7YZ9IFw';
$consumer_secret = (isset($_GET['consumer_secret']))? $_GET['consumer_secret'] : 'yRKwre0DMJVeCNrmUZUeAR0NqwaiO9ZvE0SiglCYWPY';
$action = $_GET['action'];
$param = (isset($_GET['param']))? $_GET['param'] : '';
$expire = (isset($_GET['expire']) && is_numeric($_GET['expire']))? $_GET['expire'] : 300;
$callback = 'medialets.twitter.jsonp.'.$_GET['callback'];

$twitter = new Twitter($consumer_key, $consumer_secret, $expire);

if(isset($action) && method_exists($twitter,$action)){
    $results = $twitter->{$action}($param);
    if($_GET['debug'] == 'true'){
        $results = json_decode($results, true);
        $results["query"] = $_SERVER['QUERY_STRING'];
        $results = json_encode($results);
    }
    print $callback.'('. $results .')';
} else {
    $results = $callback.'({';
    if($_GET['debug'] == 'true'){
        $results += '"query":"'.$_SERVER['QUERY_STRING'].'",';
    }
    $results += '"code":666,"errors":[{"message":"The action requested does not exist."}]})';
    print $results;
}

$twitter->invalidateBearerToken();

?>
