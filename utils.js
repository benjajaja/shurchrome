var defaults = {
	disableJS: false,
	removeAds: true,
	liftpage: true,
	enableNotifications: true,
	username: '',
	search: 0,
	delay: 5
};
var conf = {};
for (var key in defaults) {
	conf[key] = defaults[key];
}


function restore(callback) {
	chrome.storage.sync.get(defaults, function(data) {
		for (var key in defaults) {
			if (typeof defaults[key] === 'number') {
				conf[key] = parseInt(data[key]);
			} else {
				conf[key] = data[key];
			}
			
		}
		callback(conf);
	});
};

function save(callback) {
	var set = {};
	var remove = [];
	for (var key in defaults) {
		var value;
		if (conf[key] !== defaults[key]) {
			set[key] = conf[key];
		} else {
			remove.push(key);
		}
	}

	chrome.storage.sync.set(set, callback);
	if (remove.length > 0) {
		chrome.storage.sync.remove(remove, callback);
	}
};

function setConf(key, value, callback) {
	conf[key] = value;
	if (defaults[key] !== value) {
		var set = {};
		set[key] = value;
		console.log('set: ', set);
		chrome.storage.sync.set(set, callback);
	} else {
		chrome.storage.sync.remove([key], callback);
	}
}

function asArray(a) {
	return Array.prototype.slice.call(a);
}

function remove(element) {
	element.parentNode.removeChild(element);
}

function removeAll(nodeList) {
	console.log('remove:', nodeList);
	asArray(nodeList).forEach(remove);
	return nodeList.length;
}