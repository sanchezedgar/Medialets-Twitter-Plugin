<?php
/**
*   Twitter.class.php
*
* Created by Edgar Sanchez on 2013-09-01.
*
* Medialets Twitter Application-only Authentication App V 1.0
*/
class Twitter
{
    protected
        $consumer_key,
        $consumer_secret,
        $bearer_token;

    function __construct($key, $secret, $expire=300) {
        header("Content-Type: application/javascript");
        header("Cache-Control: must-revalidate");
        header("Expires: " . gmdate("D, d M Y H:i:s", time() + $expire) . " GMT");

        $this->consumer_key = $key;
        $this->consumer_secret = $secret;
        $this->getBearerToken();
    }

    /**
    * Get the Bearer Token, this is an implementation of steps 1&2
    * from https://dev.twitter.com/docs/auth/application-only-auth
    */
    private function getBearerToken(){
        $bearer_token = urlencode($this->consumer_key).':'.urlencode($this->consumer_secret);
        $base64_encoded_bearer_token = base64_encode($bearer_token);
        $headers = array(
            "POST /oauth2/token HTTP/1.1",
            "Host: api.twitter.com",
            "User-Agent: Medialets Twitter Application-only OAuth App v.1",
            "Authorization: Basic ".$base64_encoded_bearer_token,
            "Content-Type: application/x-www-form-urlencoded;charset=UTF-8",
            "Content-Length: 29"
        );
        $response = $this->curl('oauth2/token', $headers, "grant_type=client_credentials");

        $output = explode("\n", $response);
        $bearer_token = '';
        foreach($output as $line) {
            if($line === false) {
                // there was no bearer token
            }else{
                $bearer_token = $line;
            }
        }
        $bearer_token = json_decode($bearer_token);
        $this->bearer_token = $bearer_token->{'access_token'};
    }

    /**
    * Invalidates the Bearer Token
    * Should the bearer token become compromised or need to be invalidated for any reason,
    * call this method/function.
    */
    public function invalidateBearerToken(){
        $consumer_token = urlencode($this->consumer_key).':'.urlencode($this->consumer_secret);
        $base64_encoded_consumer_token = base64_encode($consumer_token);

        $headers = array(
            "POST /oauth2/invalidate_token HTTP/1.1",
            "Host: api.twitter.com",
            "User-Agent: Medialets Twitter Application-only OAuth App v.1",
            "Authorization: Basic ".$base64_encoded_consumer_token,
            "Accept: */*",
            "Content-Type: application/x-www-form-urlencoded",
            "Content-Length: ".(strlen($this->bearer_token)+13)
        );

        return $this->curl('oauth2/invalidate_token', $headers, "access_token=".$this->bearer_token);
    }

    /**
    * Search
    * Basic Search of the Search API
    * Based on https://dev.twitter.com/docs/api/1.1/get/search/tweets
    */
    public function search($query, $count='15', $result_type='mixed'){
        $formed_url ='?q='.urlencode(trim($query)); // fully formed url
        if($result_type!='mixed'){ // result type - mixed(default), recent, popular
            $formed_url = $formed_url.'&result_type='.$result_type;
        }
        if($count!=='15'){ // results per page - defaulted to 15
            $formed_url = $formed_url.'&count='.$count;
        }
        $formed_url = $formed_url.'&include_entities=true'; // makes sure the entities are included, note @mentions are not included see documentation

        return $this->get("1.1/search/tweets.json".$formed_url);
    }

    /**
    * User Timeline Stream
    * Returns a collection of the most recent Tweets posted by the user indicated by the $user parameter (screen_name or user_id).
    * https://dev.twitter.com/docs/api/1.1/get/statuses/user_timeline
    */
    public function userTimeline($user, $count='15'){
        $formed_url = '?'. (is_int($user)? 'user_id' : 'screen_name') .'='.$user; // fully formed url
        if($count!=='15'){ // results per page - defaulted to 15
            $formed_url = $formed_url.'&count='.$count;
        }
        $formed_url = $formed_url.'&include_entities=true'; // makes sure the entities are included, note @mentions are not included see documentation

        return $this->get("1.1/statuses/user_timeline.json".$formed_url);
    }

    /**
    * Rate Limit Status
    * Returns the current rate limits for methods belonging to the specified resource families.
    * Based on https://dev.twitter.com/docs/api/1.1/get/application/rate_limit_status
    */
    public function rateLimitStatus() {
        return $this->get("1.1/application/rate_limit_status.json");
    }

    public function get($url){
        $url = explode('twitter.com/', $url);
        $url = $url[ count($url)-1 ];

        $headers = array (
            "GET /".$url." HTTP/1.1",
            "Host: api.twitter.com",
            "User-Agent: Medialets Twitter Application-only OAuth App v.1",
            "Authorization: Bearer ".$this->bearer_token,
        );
        return $this->curl($url, $headers);
    }

    private function curl($url, $headers, $fields="") {
        $full_url = "https://api.twitter.com/".$url; // url to send data to for authentication

        $ch = curl_init();  // setup a curl
        curl_setopt($ch, CURLOPT_URL,$full_url);  // set url to send to
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers); // set custom headers
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // return output

        if($fields !== ""){
            curl_setopt($ch, CURLOPT_POST, 1); // send as post
            curl_setopt($ch, CURLOPT_POSTFIELDS, $fields); // post body/fields to be sent
            $header = curl_setopt($ch, CURLOPT_HEADER, 1); // send custom headers
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        }
        $response = curl_exec ($ch); // execute the curl
        curl_close($ch); // close the curl

        return $response;
    }

}
?>
