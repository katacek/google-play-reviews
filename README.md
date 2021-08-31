# Google play store application reviews

Apify actor to download application reviews from [Google Play Store](https://play.google.com/store/apps). The actor creates dataset called "Google-play-reviews-applicationName" containing name, date, rating and text of each review.

## Input 

The following table shows specification of the actor INPUT fields as defined by its input schema. 

Field |	Type	| Description
---| ---| ---|
appUrl|	*String*|	Application url on google play
appId|	*String*|	Application id on google play - in url address after 'id='
limit|	*Integer*|	(required) Number of reviews to be scraped. Maximum is set to 4000.

## How to run

To run the actor, you'll need an [Apify account](https://my.apify.com/). Simply create a new task for the actor by clicking the green button above, modify the actor input configuration, click Run and get your results.
Please, note that the runtime may vary depending on the time-period. For longer runs, the actor timeout must be increased in your settings. 

## API

To run the actor from your code, send a HTTP POST request to the following API endpoint: 

https://api.apify.com/v2/acts/katerinahronik~google-play-reviews?token=<YOUR_API_TOKEN>

## CU usage 

Depends on number of reviews needed - approximatelly 0.006 CU per 100 reviews.
