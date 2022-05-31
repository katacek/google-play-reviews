const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();

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


    console.log('Launching Puppeteer...');
    const proxyConfiguration = await Apify.createProxyConfiguration({groups:['BUYPROXIES94952']});
    const browser = await Apify.launchPuppeteer({
        proxyUrl:proxyConfiguration.newUrl()
    });

    console.log(`Opening page ${url}...`);
    const page = await browser.newPage();
    await page.goto(url);
    await page.evaluate(function () {
        Array.from(document.querySelectorAll('button'))
    .find(el => el.textContent === 'See all reviews').click();});
    let count=(await page.$$('div.RHo1pe')).length;
    while(count<limit)
    {
        await Apify.utils.puppeteer.infiniteScroll(page,{timeoutSecs:5});
        let newCount = (await page.$$('div.RHo1pe')).length;
        if(count==newCount)
        {
            console.log('All reviews found '+count);
            break;
        }
        else
        {
            count = newCount;
        }
    }
    const reviews = await page.$$('div.RHo1pe');
    for(const review of reviews.slice(0,input.limit))
    {
        const result = {};
        result.name = await review.$eval('header div.YNR7H div.X5PpBb', (el)=>el.textContent);
        result.date = await review.$eval('.bp9Aid', (el)=>el.textContent);
        result.rating = (await review.$$('span.Z1Dz7b')).length;
        result.text = await review.$eval('.h3YV2d', (el)=>el.textContent);
        await Apify.pushData(result);
    }
  
  

    console.log('Closing Puppeteer...');
    await browser.close();

    console.log('Done.');
});
