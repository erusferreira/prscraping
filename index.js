const moment = require('moment');
const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const login = require('./login');

const inputLogin = '#login_field';
const inputPassword = '#password';
const submit = 'input[type="submit"]';
const inputToken = '#otp';
const verifyToken = 'button[type="submit"]';

async function startBrowser() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return {browser, page};
}

async function closeBrowser(browser) {
  return browser.close();
}

async function doLogin(url) {
  const {browser, page} = await startBrowser();
  page.setViewport({width: 1366, height: 768});
  await page.goto(url);
  await page.click(inputLogin);
  await page.keyboard.type(login.username);
  await page.click(inputPassword);
  await page.keyboard.type(login.password);
  await page.click(submit);
  await page.waitForNavigation();
  
  await page.click(inputToken);
  await page.keyboard.type(login.token);
  await page.click(verifyToken);
  await page.waitForNavigation();

  const START_DATE = '2020-09-15';
  const END_DATE = '2020-09-18';
  const LAST_PAGE = 7;
  const REPO_NAME = 'james.store'
  let pagesList = [];
  let pullRequestsList = [];
  
  // get pages
  [...Array(LAST_PAGE)].forEach((_, i) => {
    const currentPage = (i + 1).toString();
    const pageLink = `https://github.com/james-delivery/${REPO_NAME}/pulls?page=${currentPage}&q=is%3Apr+created%3A${START_DATE}..${END_DATE}`;
    pagesList.push(pageLink);
  });

  // get pull requests links of each page
  for (const response of pagesList) {
    await page.goto(response);
    await page.waitForSelector('.js-navigation-container');
    const prs = await page.$$eval('.js-navigation-container > .js-navigation-item', links => {
      return links.map(el => {
        return el.querySelector('a.js-navigation-open').href;
      });
    });
    prs.forEach(response => {
      if (response.indexOf('?') < 1) {
        pullRequestsList.push(response);
      }
    })
  };
  // console.log(pullRequestsList);

  let pullRequestsData = [];

  // go to each pr link and grab the data
  // for (let prlink of pullRequestsList) {
    // await page.goto(prlink);
    await page.goto('https://github.com/james-delivery/james.admin/pull/386');
  
    await page.waitForSelector('h3.timeline-comment-header-text .js-timestamp relative-time');

    const pr = await page.$eval('.gh-header-title span:last-child', pr => pr && pr.textContent ? pr.textContent: '');
    const prAuthor = await page.$eval('.gh-header-meta a.author', author => author && author.textContent ? author.textContent: '');
    const prTitle = await page.$eval('.gh-header-title .js-issue-title', title => title && title.outerText ? title.outerText : '');
    const prCreatedAt = await page.$eval('h3.timeline-comment-header-text .js-timestamp relative-time', createdAt => {
      if (createdAt) {
        return createdAt.getAttribute("datetime");
      } else {
        return
      }
    });

    // return discussion
    const discussion = await page.$$eval('.js-discussion .js-timeline-item', createdAt => {
      return createdAt.map(el => {
        if (el.querySelector('.TimelineItem-body relative-time')) {
          const time = el.querySelector('.TimelineItem-body relative-time').getAttribute("datetime");
          const author = el.querySelector('.TimelineItem-body a.author') && el.querySelector('.TimelineItem-body a.author').textContent ?
            el.querySelector('.TimelineItem-body a.author').textContent : 
            '';
          return {
            author,
            time
          };
        } else {
          // disconsider in progress, 
          return
        }
      });
    });
    // console.log('PR: ', prlink);
    // console.log('discussion:', discussion);
    let indexOfLastCommit;
    const prFirstReview = discussion.find((val, index) => {
      indexOfLastCommit = index -1; // if previous doesnt have time try the next previous
      if (val && val.author) {
        return val.author !== prAuthor && val.author !== 'vercel'
      } else {
        return
      }
    });

    // get valid prClosestCommitToFirstReview 
    const length = await page.$$eval('.js-discussion .js-timeline-item', items => items.length);
    console.log('LENGTH OF ITENS', length);

    const length2 = await page.$$eval('.js-discussion .js-timeline-item .TimelineItem-body relative-time', items => items.length);
    console.log('LENGTH OF WITH TIME', length2);
    
    const pullrequest = {
      pr: pr,
      prAuthor: prAuthor,
      prTitle: prTitle,
      prCreatedAt: moment.utc(prCreatedAt).local().format(),
      prClosestCommitToFirstReview: discussion[indexOfLastCommit] && discussion[indexOfLastCommit].time ? moment.utc(discussion[indexOfLastCommit].time).local().format() : '',
      prFirstReviewAt: prFirstReview && prFirstReview.time ? moment.utc(prFirstReview.time).local().format(): '',
      prFirstReviewAuthor: prFirstReview && prFirstReview.author ? prFirstReview.author : '',
      prTimeToFirstReview: ''
    };

    // get the duration
    if (prFirstReview && prFirstReview.time && discussion[indexOfLastCommit] && discussion[indexOfLastCommit].time ) {
      const startTime = moment(discussion[indexOfLastCommit].time);
      const endTime = moment(prFirstReview.time);
      const diff = endTime.diff(startTime);
      const diffDuration = moment.duration(diff);
      pullrequest.prTimeToFirstReview = `${diffDuration.days()} days, ${diffDuration.hours()} hours, ${diffDuration.minutes()} minutes`;
    }
    pullRequestsData.push(pullrequest);
  // }

  // console.log('pullRequestsData', pullRequestsData);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(pullRequestsData);
  xlsx.utils.book_append_sheet(wb, ws);
  xlsx.writeFile(wb, 'test.xlsx')

  // await page.screenshot({path: 'screenshot.png'});
}

(async () => {
  await doLogin("https://github.com/login");
  process.exit(1);
})();
