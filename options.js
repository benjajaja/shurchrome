

function onChange() {
	for (var key in conf) {
		var el = document.querySelector('#' + key);
		if (el.type === 'checkbox') {
			conf[key] = el.checked;
		} else {
			conf[key] = el.value;
		}
	}
	save();
};

function setInputs() {
	console.log('setInputs', conf);
	for (var key in conf) {
		var el = document.querySelector('#' + key);
		if (el.type === 'checkbox') {
			el.checked = conf[key];

		} else {
			if ((typeof conf[key] !== 'string' && typeof conf[key] !== 'number') || conf[key] === null) {
				el.value = '';
			} else {
				el.value = conf[key];
			}
		}
	}
};





document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#reset').addEventListener('click', function() {
		chrome.storage.sync.clear(function() {
			console.log('cleared', chrome.runtime.lastError);
			restore(setInputs);
			document.getElementById('quotes').innerHTML = '<li class="muted">Ninguna</li>';
		})
	});

	restore(setInputs);

	for (var key in defaults) {
		console.log(key, defaults[key]);
		var el = document.querySelector('#' + key);
		if (el.type === 'checkbox') {
			el.addEventListener('change', onChange);
		} else {
			el.addEventListener('input', onChange);
		}
	}

	chrome.storage.sync.get('quotes', function(data) {
		if (data.quotes) {
			document.getElementById('quotes').innerHTML = data.quotes.reduce(function(html, url) {
				return html += '<li><a href="' + url + '">' + url + '</a></li>';
			}, '');
		} else {
			document.getElementById('quotes').innerHTML = '<li class="muted">Ninguna</li>';
		}
	});

	chrome.storage.onChanged.addListener(function(changes, namespace) {
		console.log('changes: ', changes);
		for (var key in changes) {
			var el = document.querySelector('#' + key);
			var value = changes[key].newValue;
			if (typeof value === 'undefined') {
				value = defaults[key];
			}
			if (el.type === 'checkbox') {
				if (el.checked !== value) {
					el.checked = value;
				}

			} else if (key === 'quotes') {
				document.getElementById('quotes').innerHTML = value.reduce(function(html, url) {
					return html += '<li><a href="' + url + '">' + url + '</a></li>';
				}, '');

			} else {
				if (el.value !== value) {
					el.value = value;
				}
			}
		}
	});
});
