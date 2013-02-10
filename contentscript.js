var liftPage = function(page) {
	var main = page.find('div > table > tbody > tr > td:nth-child(3)');
	page.html('');
	main.children().each(function(i, child) {
		page.append(child);
	});
};

var page = $('.page').first();

restore(function(conf) {

	if (conf.removeAds) {
		removeAll(document.getElementsByTagName('script'));
		removeAll($('#adl_728x90').parent().parent().parent().parent());
		//removeAll(document.getElementsByClassName('cajasprin'));
		removeAll(document.getElementsByTagName('ins'));
	}
	if (conf.liftpage && window.location.pathname.indexOf('/foro/forumdisplay.php') === 0) {
		liftPage(page);
	}
	if (conf.enableNotifications) {
		getUsername();
	}

	if (conf.disableJS) {
		/*chrome.extension.sendMessage({enable: true}, function() {
			console.log('enabled');*/

			var iframes = $('iframe.youtube-player');
			var loaded = 0;
			var iframeOnload = function() {
				loaded += 1;
				if (loaded === iframes.length) {
					console.log('all iframes loaded');
					chrome.extension.sendMessage({enable: false}, function() {
						console.log('disabled');
					});
				}
			};

			console.log('switching ' + iframes.length + ' iframes...');
			iframes.each(function(i, iframe) {
				/*var fresh = $('<iframe/>');
				fresh[0].onload = iframeOnload;
				fresh[0].src = iframe.src + (iframe.src.indexOf('?') === -1 ? '?html5=1&version=3' : '&html5=1&version=3');
				fresh[0].width = iframe.width;
				fresh[0].height = iframe.height;*/
				var src = iframe.src + (iframe.src.indexOf('?') === -1 ? '?html5=1' : '&html5=1');
				$(iframe).replaceWith($('<a/>').text(iframe.src).attr('href', iframe.src).attr('target', '_blank').click(function() {
					console.log('click');
				})/*.append(fresh)*/);
			});
		//});
	}
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	console.log('go?');
});




var getUsername = function() {
	var userlink = page.find('table.tborder td.alt2 > div > strong a').first();
	if (userlink) {
		try {
			var id = userlink.attr('href').substring('member.php?u='.length);
			if (userlink.text() !== conf.username) {
				chrome.extension.sendMessage({
					setuser: {
						name: userlink.text(),
						id: id
					}
				});
			}

			
			console.log('userlink sent');
		} catch (e) {
			console.log('Cannot detect user');
		}
	} else {
		console.log('No userlink');
	}
};

