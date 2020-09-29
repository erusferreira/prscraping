const moment = require('moment');

// const prCreatedAt = '2020-07-09T15:58:06Z';
// const parse = moment.utc(prCreatedAt).local().format();

// console.log('prCreatedAt', prCreatedAt);
// console.log('parsed', parse);

const closestCommitTime = moment.utc('2020-06-05 14:07:55 -0300').format();
const firstReviewAtTime = moment.utc('2020-06-10 13:42:53 -0300').format();

// const closestCommitTime = moment.parseZone('2020-06-05 14:07:55 -0300');
// const firstReviewAtTime = moment.parseZone('2020-06-10 13:42:53 -0300');
// const closestCommitTime = moment('2020-07-09T15:58:06Z');
// const firstReviewAtTime = moment('2020-07-12T17:59:06Z');

const diff = firstReviewAtTime.diff(closestCommitTime);
const diffDuration = moment.duration(diff);
console.log("Days:", diffDuration.days());
console.log("Hours:", diffDuration.hours());
console.log("Minutes:", diffDuration.minutes());

console.log('closestCommitTime', closestCommitTime);
console.log('firstReviewAtTime', firstReviewAtTime);