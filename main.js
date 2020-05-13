
const Apify = require('apify');

Apify.main(async () => {

    try{
   
        //const input = await Apify.getValue('INPUT');
        const input = 
                {
                    appId: 'com.aparkin.bestwifi',
                    limit: 100
                };


    const url = `https://play.google.com/store/apps/details?id=${input.appId}&showAllReviews=true`;

    console.log('Input:');
   
    const appId = input.appId;
    const limit = input.limit;

    const browser = await Apify.launchPuppeteer();
   
    console.log(`Opening URL: ${url}`);  
    const page = await browser.newPage();
    await page.goto(url);
    await Apify.utils.puppeteer.injectJQuery(page);
 
    let numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
    if (numberOfReviews < limit)
    {
        // timeoutSecs: If 0, will scroll until bottom of page.
        // waitForSecs: How many seconds to wait for no new content to load before exit
        await Apify.utils.puppeteer.infiniteScroll(page, { timeoutSecs: 0, waitForSecs: 10 });
        numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
        if (numberOfReviews < limit)
        {

            while ((await page.evaluate(x => $('span:contains(Show More)[JSSLOT]') )) != null  && numberOfReviews <= limit)
            {
                await page.evaluate(x => $('span:contains(Show More)[JSSLOT]').click());
                await Apify.utils.puppeteer.infiniteScroll(page, { timeoutSecs: 0, waitForSecs: 10 });
                numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
            }
        }
    }

    let reviews = await page.evaluate(x =>
    {
        let reviews=[];

        reviewDivs = $('div[jscontroller][jsdata][jsmodel]').not('[jsaction]');
        reviewDivs.each(function (index)
        {
            review = {}
            const spans = $('span',this).map(function ()
            {
                return $(this).text();
            });

            // shift() Remove the first item of an array
            const rating = $('div[aria-label*=Rated]',this).attr('aria-label').match(/\d+/).shift();
            const text = $('span[jsname]',this).map(function ()
            {
                return $(this).text();
            });
 
            review.name = spans[0];
            review.date = spans[2];
            review.rating = rating;
            review.text = text[text.length-1];
            if (review.text=='') {
                review.text = text[text.length-2];
            }
            reviews.push(review);
        })
        return reviews;
    })

    if (reviews.length > limit)
        reviews = reviews.slice(0, limit);
 
    // Save output
    const appNameHash = appId.replace(/\./g, '-')

    const dataset = await Apify.openDataset(`Google-play-reviews-${appNameHash}`);
    await dataset.pushData(reviews);
           
    console.log('Data saved..')
    
}

catch(err){

    console.log(err)
    throw(err)
   
};

});
