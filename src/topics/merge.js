'use strict';

var async = require('async');

module.exports = function (Topics) {
	Topics.merge = function (tids, uid, callback) {
		var mergeIntoTid = findOldestTopic(tids);

		var otherTids = tids.filter(function (tid) {
			return tid && parseInt(tid, 10) !== parseInt(mergeIntoTid, 10);
		});

		async.eachSeries(otherTids, function (tid, next) {
			async.waterfall([
				function (next) {
					Topics.getPids(tid, next);
				},
				function (pids, next) {
					async.eachSeries(pids, function (pid, next) {
						Topics.movePostToTopic(uid, pid, mergeIntoTid, next);
					}, next);
				},
				function (next) {
					Topics.setTopicField(tid, 'mainPid', 0, next);
				},
				function (next) {
					Topics.delete(tid, uid, next);
				},
				function (next) {
					Topics.setTopicFields(tid, {
						mergeIntoTid: mergeIntoTid,
						mergerUid: uid,
						mergedTimestamp: Date.now(),
					}, next);
				},
			], next);
		}, callback);
	};

	function findOldestTopic(tids) {
		return Math.min.apply(null, tids);
	}
};
