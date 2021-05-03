
const Apify = require('apify');

Apify.main(async () =>
{

    try
    {
   
        //const input = await Apify.getValue('INPUT');
        const input =
        {
            "appUrl": "https://play.google.com/store/apps/details?id=com.nick.noggin&hl=en_US&gl=US",
            "appId": "com.nick.noggin",
            "limit": 1000,
            "sort": 'Newest'
        };


        if (input.appUrl == undefined && input.appId == undefined)
        {
            throw (new Error('input.appUrl or input.appId must be provided'))
        }

        let url = '';
   
        if (input.appUrl)
        {
            url = `${input.appUrl}&showAllReviews=true`;
        }
        else
        {
            url = `https://play.google.com/store/apps/details?id=${input.appId}&showAllReviews=true`;
        }
        //const appId = input.appId;
        const limit = input.limit;
    
        if (input.limit > 4000)
        {
            throw (new Error('Maximum reviews limit is set to 4000.'))
        }

        const browser = await Apify.launchPuppeteer();
   
        console.log(`Opening URL: ${url}`);
        const page = await browser.newPage();
        await page.goto(url);
        await Apify.utils.puppeteer.injectJQuery(page);
        if (input.sort)
        {
            await page.click('div[jscontroller="iDykod"]');
            await page.waitForTimeout(1000);
            await page.keyboard.type(input.sort);
            await page.waitForTimeout(1000);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
        }
        
        let numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
        if (numberOfReviews < limit)
        {
            // timeoutSecs: If 0, will scroll until bottom of page.
            // waitForSecs: How many seconds to wait for no new content to load before exit
            await Apify.utils.puppeteer.infiniteScroll(page, { timeoutSecs: 0, waitForSecs: 10 });
            numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
            if (numberOfReviews < limit)
            {

                while ((await page.evaluate(x => $('span:contains(Show More)[JSSLOT]').text())) != null && numberOfReviews <= limit)
                {
                    await page.evaluate(x => $('span:contains(Show More)[JSSLOT]').click());
                    await Apify.utils.puppeteer.infiniteScroll(page, { timeoutSecs: 0, waitForSecs: 10 });
                    numberOfReviews = await page.evaluate(x => ($('div[jscontroller][jsdata][jsmodel]').not('[jsaction]').get().length));
                }
            }
        }

        console.log('Downloading reviews...');
        let reviews = await page.evaluate(x =>
        {
            let reviews = [];

            reviewDivs = $('div[jscontroller][jsdata][jsmodel]').not('[jsaction]');
            reviewDivs.each(function (index)
            {
                review = {}
                const spans = $('span', this).map(function ()
                {
                    return $(this).text();
                });

                // shift() Remove the first item of an array
                const rating = $('div[aria-label*=Rated]', this).attr('aria-label').match(/\d+/).shift();
                const text = $('span[jsname]', this).map(function ()
                {
                    return $(this).text();
                });
 
                review.name = spans[0];
                review.date = spans[2];
                review.rating = rating;
                review.text = text[text.length - 1];
                if (review.text == '')
                {
                    review.text = text[text.length - 2];
                }
                reviews.push(review);
            })
            return reviews;
        })

        if (reviews.length > limit)
            reviews = reviews.slice(0, limit);
 
        // Save output
        //const appNameHash = appId.replace(/\./g, '-')
    
        //await Apify.setValue(`Google-play-reviews-${appNameHash}`, reviews);

        //const dataset = await Apify.openDataset(`Google-play-reviews-${appNameHash}`);
        //await dataset.pushData(reviews);
    
        await Apify.pushData(reviews);
           
        console.log('Data saved..')
    
    }

    catch (err)
    {

        console.log(err)
        throw (err)
   
    };

});
