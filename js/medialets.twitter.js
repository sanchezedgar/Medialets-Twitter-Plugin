/**
 * @class medialets.twitter
 * @description
 * Facilitates using twitter web intents. Also retrieves JSON results from the twitter REST API.
 * Documentation can be found here:
 *      Web Intents: https://dev.twitter.com/docs/intents
 *      REST API v1.1 Resources: https://dev.twitter.com/docs/api/1.1
 * @namespace medialets
 * @requires medialets.core.js, medialets.jsonp.js and on the server side, requires php for oauth
 * @author edgar.sanchez@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.html5Video.js
 * @compressed http://creative.medialytics.com/javascript/medialets.html5Video.min.js
 * @demo https://gist.github.com/b92b2914050868bc9e2c
 * @version 1.0.0
 *
 * @usage
simple implementation:

<script src="js/medialets.js" type="text/javascript" charset="utf-8"></script>
<script src="js/medialets.twitter.js" type="text/javascript" charset="utf-8"></script>
...
<script type="text/javascript">

//Clickthrough to tweet predetermined tweet content. User will have to login in seperate window.
$m.bind(document, $m.ui.tap, function(){
    $m.twitter.tweet('This week in mobile news...');
});

//Retrieve search results
$m.twitter.search('@medialets', function(data){
    console.log(data);
});

</script>
**/

(function(medialets) {
    if (medialets) {

        // data
        // ----- ----- -----
        var local = {
            intents : 'https://twitter.com/intent/',
            php : '../lib/twitter.php',
            consumer_key : 'LGqv8YPBjgIQFwu7YZ9IFw',
            consumer_secret : 'yRKwre0DMJVeCNrmUZUeAR0NqwaiO9ZvE0SiglCYWPY',
            expire : 300, //In seconds
            debug : 'false' // This includes an extra key value pair named "query" with the value of the querystring the PHP file recieved
        },

        // Private Methods
        // ----- ----- -----

        /**
         * @ngdoc function
         * @name clickThrough
         * @function Private
         *
         * @description Handles clickthroughs for the Twitter web intents.
         * @param {String} A full URL to open externally
         */
        clickThrough = function(url) {
            setTimeout(function(){
                try{
                    medialets.open(url);
                } catch (err){
                    top.window.open(url);
                }
            }, 150);
        },

        /**
         * @ngdoc function
         * @name serialize
         * @function Private
         *
         * @description Formats objects into a query string
         * @param {Object} obj Object to convert key/value pairs into query string.
         * @returns {String} Formated query string
         */
        serialize = function(obj) {
            var str = [];
            for(var k in obj) {
                str.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
            }
            return str.join("&");
        },

        /**
         * @ngdoc function
         * @name get
         * @function Private
         *
         * @description Handles the jsonp request to the PHP script to retrieve Twitter API results.
         * @param {Object} params Object Containing values used in the query string sent to the PHP script.
         * @param {Function} callback Function to call once results are retrieved.
         * @param {Number} expire A number in seconds used in the php "Expires:..." header.
         * @returns {Function} Callback function with the retrieved JSON object from the Twitter REST API as a parameter.
         */
        get = function(params, callback, expire) {

            // Checks if jsonp plugin is available before proceeding, otherwise returns error
            if(!medialets.jsonp){
                var response = error(666, 'The required plugin, medialets.jsonp.js, could not be found. Please make sure to include it. You can download it at the following location: http://creative.medialytics.com/javascript/build/?js=medialets.jsonp.min.js');
                return callback(response);
            }

            /**
             * Combine any given values from the params parameter with the values below. Needed by the PHP script.
             * This occurs on every execution of this method to assure the latest values are collected and sent.
            */
            params = medialets.deepCopy({
                debug : local.debug,
                consumer_key : local.consumer_key,
                consumer_secret : local.consumer_secret,
                expire : expire || local.expire
            },params);

            // New medialets.jsonp object
            var results = new medialets.jsonp({
                url : local.php,
                callback : 'mmcb',
                params : params,
                success : function(data){
                    if(typeof data !== 'object') {
                        var response = error(666,'Data returned was blank.');
                        return callback(response);
                    }
                    return callback(data);
                }
            });
        },

        /**
         * @ngdoc function
         * @name get
         * @function Private
         *
         * @description
         * Returns an object formatted to match errors returned from the Twitter REST API
         *
           <pre>
               {
                   "errors" : [
                      {
                          "code" : 25,
                          "message" : "Query parameters are missing"
                      }
                   ]
               }
           </pre>
         *
         * @param {Number} code Error number given
         * @param {String|Array} A string or array of strings containing error messeges.
         * @returns {Object} Custom error object matching error json from Twitter API
         */
        error = function(code, messeges){

            var errorObj = {
                code : code,
                errors : []
            };
            if(Object.prototype.toString.call( messeges ) === '[object Array]') {
                for(i=0,len=messeges.length; i<len; i++){
                    errorObj.errors.push({
                        message : messeges[i]
                    });
                }
            } else {
                errorObj.errors.push({
                    message : messeges
                });
            }

            return errorObj;
        };

        // Main plugin api
        // ----- ----- -----
        medialets.twitter = {

            /**
             * @ngdoc function
             * @name medialets.twitter.intent
             * @function
             *
             * @description
             * https://dev.twitter.com/docs/intents
             * Compiles Twitter Intent URI string and calls clickthrough.
             * Intent URIs:
             *      https://twitter.com/intent/tweet
             *      https://twitter.com/intent/retweet
             *      https://twitter.com/intent/favorite
             *      https://twitter.com/intent/user
             * Example fully formed Intent URI:
             * https://twitter.com/intent/favorite?tweet_id=12795262836
             *
             * @param {String} intent Either a fully formed URI as in the example above or main Intent (tweet, retweet, favorite, user)
             * @param {Object} params Object containing parameters to be used as query string appended to the intent URI.
             * Refer to twitter intents documentation for available parameters on each intent
             */
            intent : function(intent, params) {
                var intentURI = local.intents+(intent.split(local.intents).join(''));
                if(typeof params === "object"){
                    intentURI = intentURI+'?'+serialize(params);
                }
                clickThrough(intentURI);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.tweet
             * @function
             *
             * @description Shortcut method for Web Intent: creating a tweet web intent.
             *
             * @param {String} text Pre-prepared, properly UTF-8 & percent-encoded Tweet body text. Users will still be able to edit the pre-prepared text.
             * @param {Number} in_reply_to Associate this Tweet with a specific Tweet by indicating its status ID here.
             * The originating Tweet Author's screen name will be automatically prepended to the reply.
             */
            tweet : function(text, in_reply_to) {
                var params = {
                    text : encodeURIComponent(text)
                };
                if(typeof parseFloat(in_reply_to) === "number" && !isNaN(in_reply_to)){
                    params.in_reply_to = encodeURIComponent(in_reply_to);
                }
                this.intent('tweet', params);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.retweet
             * @function
             *
             * @description Shortcut method for Web Intent: retweeting.
             *
             * @param {Number} tweet_id Every Tweet is identified by an ID.
             * You can find this value from the API or by viewing the permalink page for any Tweet,
             * usually accessible by clicking on the "published at" date of a tweet.
             */
            retweet : function(tweet_id) {
                this.intent('retweet', {
                    tweet_id : encodeURIComponent(tweet_id)
                });
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.favorite
             * @function
             *
             * @description Shortcut method for Web Intent: favorite a specified tweet.
             *
             * @param {Number} tweet_id Every Tweet is identified by an ID.
             * You can find this value from the API or by viewing the permalink page for any Tweet,
             * usually accessible by clicking on the "published at" date of a tweet.
             */
            favorite : function(tweet_id) {
                this.intent('favorite', {
                    tweet_id : encodeURIComponent(tweet_id)
                });
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.follow
             * @function
             *
             * @description Shortcut method for Web Intent: view profile page of user with a chance to follow.
             *
             * @param {String|Number} user The user alphanumerical screen name OR numerical user id
             */
            follow : function(user) {
                var params = {};
                if(typeof parseFloat(user) === "number" && !isNaN(user)){
                    params.user_id = encodeURIComponent(user);
                } else {
                    params.screen_name = encodeURIComponent(user);
                }
                this.intent('user', params);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.search
             * @function
             *
             * @description REST API v1.1: Returns a collection of relevant Tweets matching a specified query.
             *
             * @param {String} query A search query of 1,000 characters maximum, including operators.
             * Queries may additionally be limited by complexity.
             * Example Values: @medialets
             * @param {Function} Callback function to return with the data from the API
             * @param {Number} expire A number in seconds used in the php "Expires:..." header.
             * @returns {Function} Callback function with the retrieved JSON object from the Twitter REST API as a parameter.
             */
            search :  function(query, callback, expire) {
                get({
                    action : 'search',
                    param : encodeURIComponent(query)
                }, callback, expire);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.userTimeline
             * @function
             *
             * @description REST API v1.1: Returns a collection of the most recent Tweets posted by the user indicated by the user parameter.
             *
             * @param {String|Number} user The alphanumerical user name OR numerical user id of the user for whom to return results for.
             * @param {Function} Callback function to return with the data from the API
             * @param {Number} expire A number in seconds used in the php "Expires:..." header.
             * @returns {Function} Callback function with the retrieved JSON object from the Twitter REST API as a parameter.
             */
            userTimeline :  function(user, callback, expire) {
                get({
                    action : 'userTimeline',
                    param : encodeURIComponent(user)
                }, callback, expire);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.custom
             * @function
             *
             * @description
             * Documentation: REST API v1.1: https://dev.twitter.com/docs/api/1.1
             * You can request any of the resources available in the above documentation which does not requires a user context for authorization.
             * Refer to each resources documentation page for examples of json responses from each resource.
             *
             * @param {String} uri Fully form URI including query string. Example: "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=twitterapi&count=2"
             * @param {Function} Callback function to return with the data from the API
             * @param {Number} expire A number in seconds used in the php "Expires:..." header.
             * @returns {Function} Callback function with the retrieved JSON object from the Twitter REST API as a parameter.
             */
            custom :  function(uri, callback, expire) {
                get({
                    action : 'get',
                    param : encodeURIComponent(uri)
                }, callback, expire);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.rateLimitStatus
             * @function
             *
             * @description
             * Documentation: https://dev.twitter.com/docs/api/1.1/get/application/rate_limit_status
             * Returns the current rate limits for methods belonging to the specified resource families.
             *
             * @param {Function} Callback function to return with the data from the API
             * @param {Number} expire A number in seconds used in the php "Expires:..." header.
             * @returns {Function} Callback function with the retrieved JSON object from the Twitter REST API as a parameter.
             */
            rateLimitStatus :  function(callback, expire) {
                get({
                    action: 'rateLimitStatus'
                }, callback, expire);
            },

            /**
             * @ngdoc function
             * @name medialets.twitter.updateRequestToken
             * @function
             *
             * @description
             * Update the request token useed for twitter oauth2. Currently using one generated vie medialets twitter account.
             * To obtain one, log into https://dev.twitter.com using a twitter account. Go to "My Applications". Create an application and generate an access token.
             *
             * @param {String} key Consumer key generated under your applications in dev.twitter.com
             * @param {String} secret Consumer secret generated under your applications in dev.twitter.com
             */
            updateRequestToken : function(key, secret) {
                if(key){
                    local.consumer_key = key;
                }
                if(secret){
                    local.consumer_secret = secret;
                }
            }
        };
    }
}((typeof medialets !== 'undefined') ? medialets : false));
