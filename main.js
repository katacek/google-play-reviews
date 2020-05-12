
const Apify = require('apify');

Apify.main(async () => {

    try{
   
        //const input = await Apify.getValue('INPUT');
        const input = 
                {
                    appId: 'com.neverland.alreader',
                    limit: 100
                };


    const url = `https://play.google.com/store/apps/details?id=${input.appId}&showAllReviews=true`;

    //https://play.google.com/store/apps/details?id=com.neverland.alreader&showAllReviews=true
    
    console.log('Input:');
   
    const appId = input.appId;
    const limit = input.limit;

    const browser = await Apify.launchPuppeteer();
   
    console.log(`Opening URL: ${url}`);  
    const page = await browser.newPage();
    await page.goto(url);
    await Apify.utils.puppeteer.injectJQuery(page);

   // await page.hover(`div[data-value="2"]`);
   // await page.click(`div[data-value="2"]`);
    await page.evaluate(x =>
    {
        $('span[jsslot]:contains(Most relevant)').click();
        $('span[jsslot]:contains(Newest)').eq(0).click();
     
    });

   
    let numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
    if (numberOfReviews < limit)
    {
        // timeoutSecs: If 0, will scroll until bottom of page.
        // waitForSecs: How many seconds to wait for no new content to load before exit
        await Apify.utils.puppeteer.infiniteScroll(page, { timeoutSecs: 0, waitForSecs: 10 });
        numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
        if (numberOfReviews < limit)
        {

            while (await page.evaluate(x => $('span:contains(Show More)[JSSLOT]') != null) && numberOfReviews <= limit)
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
 
            review.name = spans[0];
            review.date = spans[2];
            review.rating = rating;
            review.text = spans[13];
            reviews.push(review);
        })
        return reviews;
    })

    if (reviews.length > limit)
        reviews = reviews.slice(0, limit);
 
    // Save output
    const splittedName = appId.split('.')[2]

    const dataset = await Apify.openDataset(`Google-play-reviews-${splittedName}`);
    await dataset.pushData(reviews);
           
    console.log('Data saved..')
    
}

catch(err){

    console.log(err)
   
};

});
