const moment = require("moment");

const closestCommitTime = moment.utc("2020-06-05 14:07:55 -0300").format();
const firstReviewAtTime = moment.utc("2020-06-10 13:42:53 -0300").format();

const diff = firstReviewAtTime.diff(closestCommitTime);
const diffDuration = moment.duration(diff);
console.log("Days:", diffDuration.days());
console.log("Hours:", diffDuration.hours());
console.log("Minutes:", diffDuration.minutes());

console.log("closestCommitTime", closestCommitTime);
console.log("firstReviewAtTime", firstReviewAtTime);
