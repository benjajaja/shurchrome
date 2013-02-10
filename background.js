restore(function() {
	chrome.storage.onChanged.addListener(function(changes, namespace) {
		if (typeof changes.disableJS !== 'undefined') {
			console.log(changes.disableJS);
			chrome.contentSettings.javascript.set({primaryPattern: 'http://*.forocoches.com/*', setting: changes.disableJS.newValue ? 'block' : 'allow'});
		} else if (typeof changes.delay !== 'undefined') {
			console.log('new delay: ' + changes.delay.newValue);
			ALARM_DELAY = parseInt(changes.delay.newValue);
		}
	});

	if (conf.disableJS) {
		chrome.contentSettings.javascript.set({primaryPattern: 'http://*.forocoches.com/*', setting: 'block'});
		console.log('JS disabled');
	}

	if (conf.username) {
		poll(conf.username);
	}

	ALARM_DELAY = conf.delay;
});

var ALARM_DELAY;
var ALARM_NAME = 'alarm';

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
	for (var command in request) {
		if (command === 'setuser') {
			console.log('setuser', request[command].name);
			setConf('username', request[command].name, function(data) {
				console.log('new username set: ' + request[command].name);
				poll(request[command].name);
			});

		} else if (command === 'enable') {
			console.log('enable: ' + request[command]);
			if (request[command] === false) {
				chrome.contentSettings.javascript.set({primaryPattern: 'http://*.forocoches.com/*', setting: 'block'});
				return false;

			} else {
				console.log('enabling');
				chrome.contentSettings.javascript.set({primaryPattern: 'http://*.forocoches.com/*', setting: 'allow'}, callback);
				return true;

			}

		} else if (command === 'settings') {

		}
	}
});

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name === ALARM_NAME) {
		chrome.storage.sync.get('username', function(username) {
			if (username) {
				poll(username);
			} else {
				console.log('no username yet, shutting down.');
			}
		});
	}
});

var poll = function(username) {
	chrome.alarms.getAll(function(alarms) {
		alarms.some(function(alarm) {
			if (alarm.name === ALARM_NAME) {
				chrome.alarms.clear(ALARM_NAME);
				return true;
			}
		});

		chrome.storage.sync.get('quotes', function(data) {
			var quotes = data.quotes;
			console.log('fetched quotes:', quotes ? quotes.length : '(none)');
			var onQuotes = function(err, id, matches) {
				if (err) {
					console.error(err);
					chrome.alarms.create(ALARM_NAME, {delayInMinutes: ALARM_DELAY});

				} else {
					if (id !== null) {
						chrome.storage.sync.set({'search': id});
					}

					if (matches.length > 0) {
						if (quotes && quotes.length !== 0) {
							var i;
							for (i = 0; i < quotes.length; i++) {
								if (quotes[i] === matches[0].url) {
									break;
								}
							}
							if (i > 0) {
								notifyUnread(i);
							} else {
								console.log('no new notifications');
							}
						}

						quotes = matches.map(function(quote) {
							return quote.url;
						});

						chrome.storage.sync.set({'quotes': quotes}, function() {
							console.log('polling again in (m): ' + ALARM_DELAY)
							chrome.alarms.create(ALARM_NAME, {delayInMinutes: ALARM_DELAY});
						});
						//callback(null, quotes);
						
					}
				}
			};

			if (conf.search) {
				repeatSearch(conf.search, onQuotes);
			} else {
				search(username, onQuotes);
			}
		});

		
	});
};

var search = function(string, callback) {
	getToken(function(err, token) {
		if (err) {
			callback(err);
		} else {
			postSearch(string, token, function(err, response) {
				if (err) {
					callback(err);
				} else {
					getId(response, function(err, id, div) {
						if (err) {
							callback(err);
						} else {
							var matches = findMatches(div);
							if (typeof matches === 'string') {
								callback(matches);
							} else {
								callback(null, id, matches);
							}
						}
					});
				}
			});
		}
	});
};

var repeatSearch = function(id, callback) {
	$.ajax({
		url: 'http://www.forocoches.com/foro/search.php?searchid=' + id
	}).done(function(res) {
		var div = $('<div/>');
		div.html(res);

		var matches = findMatches(div);
		if (typeof matches === 'string') {
			callback(matches);
		} else {
			callback(null, null, matches);
		}
	});
};

var getToken = function(callback) {
	$.ajax({
		url: 'http://www.forocoches.com/foro/search.php'
	}).done(function(res) {
		var match = res.match(/<input type="hidden" name="securitytoken" value="([a-f0-9]*-[a-f0-9]*)"/);
		if (match.length >= 2) {
			callback(null, match[1]);
		} else {
			callback('cannot match token');
		}
	}).fail(function() {
		callback('pre-search xhr failed');
	});
};

var postSearch = function(string, token, callback) {
	console.log('POST full search: ' + string);
	$.ajax({
		method: 'POST',
		url: 'http://www.forocoches.com/foro/search.php?do=process',
		data: {
			s: '',
			securitytoken: token,
			searchthreadid: '',
			query: string,
			titleonly: 0,
			searchuser: '',
			starteronly: 0,
			exactname: 1,
			replyless: 0,
			replylimit: 0,
			searchdate: 0,
			beforeafter: 'after',
			sortby: 'lastpost',
			order: 'descending',
			showposts: 1,
			'forumchoice[]': 0,
			childforums: 1,
			saveprefs: 1
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			//'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.27 (KHTML, like Gecko) Chrome/26.0.1386.0 Safari/537.27',
			//'Referer': 'http://www.forocoches.com/foro/search.php'
		}
	}).done(function(data, status, jqXHR) {
		callback(null, data);
	}).fail(function() {
		callback('cannot post search for: ' + string);
	});
};

var getId = function(data, callback) {
	var div = $('<div/>');
	div.html(data);

	var target = div.find('img.inlineimg[alt="RECARGAR"]');
	if (target) {
		try {
			var id = parseInt(target.parent().attr('href').substring('/foro/search.php?searchid='.length))
			callback(null, id, div);
		} catch (e) {
			console.log(target, target.parent());
			callback('got html but search id not found: ' + e);
		}

	} else {
		callback('search id not found');
	}
};



var findMatches = function(div) {
	try {
		return asArray(div.find('a[href^="showthread.php?p"]')).map(function(a) {
			a = $(a);
			try {
				return {
					url: a.attr('href')/*,
					text: a.text(),

					user: (function(a) {
						return {
							name: $(a).text(),
							id: $(a).attr('href').substring('member.php?u='.length)
						};
					})(a.parent().parent().parent().prev().children().first()),

					thread: (function(a) {
						return {
							name: $(a).children().first().text(),
							href: $(a).attr('href')
						};
					})(a.parent().parent().parent().prev().prev().prev().children().last())*/
				};
			} catch (e) {
				console.error(e, a);
			}
		}).concat({
				url: 'asdasd'
			});
	} catch (e) {
		return 'Error: ' + e;
	}
};

var notifyUnread = function(amount) {
	var notification = window.webkitNotifications.createNotification('roto2.png', 'Forocoches', 'Tienes ' + amount + ' notificaciones!');
	notification.show();
	setTimeout(function() {
		notification.close();
	}, 5000);
};
