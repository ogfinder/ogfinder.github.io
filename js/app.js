parseUrl();

function parseUrl() {
	var searchParam = new URL(location).searchParams.get('search');
	var sortParam = new URL(location).searchParams.get('sort_type');

	var searchInput = document.getElementsByClassName("header_searchbox")[0];
	searchInput.value = searchParam;

	selectSortType(sortParam == null || sortParam === "undefined" || sortParam.length == 0 ? 0 : parseInt(sortParam));
}

window.addEventListener('resize', function(event) {
	setTitleWidths();
}, true);

window.addEventListener('click', function(click) {
	var e = document.getElementsByClassName("header_sortselect")[0];

	if(!e.contains(click.target)) {
		closeSortMenu(e);
	}
});

var debounce = function(func, wait) {
	var timeout;
	
	return function() {
		var context = this, args = arguments;
		
		var later = function() {
			timeout = null;
			
			func.apply(context, args);
		};
		
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

document.querySelector(".header_searchbox").addEventListener('keyup', debounce(function() {
	search(this);
}, 500));

function removePreloading() {
	var e = document.getElementById("preloading");

	setVisibility(e, false);

	document.body.style.removeProperty("overflow");
}

var list;

var query;
var sortType;

var currentList;
var loadedTo = 0;

loadList();

function loadList() {
	loadText("https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/names.txt").then(function(data) {
		loadText("https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/blocked_names.txt").then(function(data2) {
			var blockedNames = data2.split('\n');

			var lines = data.split('\n');

			list = [];

			for(var line of lines) {
				var split = line.split(" ");

				list.push({
					name: split[0],
					popularity: parseFloat(split[1]),
					og: false,
					status: blockedNames.includes(split[0]) ? 3 : split[2] === "null" ? (isAvailableNow(parseInt(split[3])) ? 0 : 1) : 2
				});
			}

			updateStats();

			var searchInput = document.getElementsByClassName("header_searchbox")[0];
			search(searchInput);

			removePreloading();
		});
	});
}

function isAvailableNow(time) {
	return Date.now() - time >= 3196800000;
}

function updateStats() {
	var displays = document.getElementsByClassName("stat_number");

	var availableCount = list.filter((e) => e.status == 0).length;
	var availableSoonCount = list.filter((e) => e.status == 1).length;

	displays[0].innerText = formatNumber(availableCount);
	displays[1].innerText = formatNumber(availableSoonCount);
}

function formatNumber(x) {
	if(x >= 1000) return compactNumber(x);
	
	x = roundifyNumber(x);
	
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function compactNumber(x) {
	var suffixes = ["K", "M", "B", "T"];
	
	var n = Math.ceil(Math.log10(x + 1));
	
	var i = Math.floor((n - 3) / 3);
	
	var d = Math.pow(10, i * 3 + 3);
	
	var result = x / d;
	
	var rounded = Math.round(result);
	
	var s = rounded + suffixes[i];
	
	if(result - rounded >= 0.05) s += "+";
	
	return s;
}

function roundifyNumber(x) {
	if(x < 1000) return x;

	var n = 3;
	var l = Math.ceil(Math.log10(x + 1));
	var d = Math.pow(10, l - n);

	return Math.round(x / d) * d;
}

function updateCurrentList() {
	clearEntryList();

	currentList = [];

	for(var e of list) {
		if(matches(e)) currentList.push(e);
	}

	currentList.sort(function(e1, e2) {
		return compare(e1, e2);
	});

	loadedTo = 0;

	showNothingFound(currentList.length == 0);

	loadEntries(150);
}

function showNothingFound(b) {
	var e = document.getElementsByClassName("nothing_found_text")[0];

	setVisibility(e, b);
}

function hideTitles() {
	var list = document.getElementsByClassName("list_title");

	for(var e of list) {
		setVisibility(e, false);
	}
}

function showTitle(i, container) {
	var e = document.getElementsByClassName("list_title")[i];

	setVisibility(e, true);
}

function setTitleWidths() {
	var cardWidth = 200 + 8 * 2;

	var containers = document.getElementsByClassName("list_container");

	var maxWidth = 0;
	var maxCount = 0;

	for(var container of containers) {
		maxWidth = Math.max(container.offsetWidth, maxWidth);
		maxCount = Math.max(container.childElementCount, maxCount);
	}

	var lineWidth = cardWidth * maxCount;

	if(lineWidth > maxWidth * 3) {
		lineWidth = Math.floor(maxWidth / cardWidth) * cardWidth - 8 * 2;
	} else {
		lineWidth = 0;
	}

	var titles = document.getElementsByClassName("list_title");

	for(var e of titles) {
		if(lineWidth == 0) e.style.removeProperty("width");
		else e.style.width = lineWidth + "px";
	}
}

function setVisibility(e, b) {
	if(b) e.style.removeProperty("display");
	else e.style.display = "none";
}

function isVisible(e) {
	return e.style.display != "none";
}

function matches(e) {
	return query == null || e.name.includes(query);
}

function compare(e1, e2) {
	var i = e1.status - e2.status;
	
	if(i != 0) return i;
	
	if(sortType == 1) {
		i = e2.popularity - e1.popularity;
		if(i != 0) return i;
	} else if(sortType == 2) {
		i = e1.name.length - e2.name.length;
		if(i != 0) return i;
	}
	
	if(query != null && query.length != 0) {
		i = e1.name.indexOf(query) - e2.name.indexOf(query);

		if(i != 0) return i;

		var diff1 = e1.name.length - query.length;
		var diff2 = e2.name.length - query.length;

		i = diff1 - diff2;

		if(i != 0) return i;
	}
	
	return e1.name.localeCompare(e2.name);
}

function loadEntries(amount) {
	if(currentList == null || loadedTo >= currentList.length) return;

	var template = document.getElementsByClassName("entry_card")[0];

	var frags = [];

	for(var i = 0; i < 4; i++) {
		var frag = document.createDocumentFragment();

		frags.push(frag);
	}

	for(var i = loadedTo; i < loadedTo + amount; i++) {
		if(i >= currentList.length) break;

		var e = currentList[i];

		addEntry(e, template, frags);
	}

	var containers = document.getElementsByClassName("list_container");

	for(var i = 0; i < frags.length; i++) {
		var frag = frags[i];

		if(frag.children.length != 0) {

			var container = containers[i];

			setVisibility(container, true);

			showTitle(i, container);

			container.appendChild(frag);
		}
	}

	loadedTo += amount;

	setTitleWidths();
}

function addEntry(e, template, frags) {
	var card = template.cloneNode(true);

	card.style = "";

	card.querySelector('div[class="entry_card_text"]').innerText = e.name;

	var tags = card.querySelectorAll('div[class="entry_card_tag"]');

	toggleTagVisibility(tags.item(e.status));
	if(e.og) toggleTagVisibility(tags.item(4));

	card.addEventListener('click', event => {
		copyToClipboard(e.name);

		showCopiedSign(card);
	});

	addEmoji(card, e);

	frags[e.status].appendChild(card);
}

function toggleTagVisibility(tag) {
	setVisibility(tag, true);
}

window.onscroll = function(ev) {
	if((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
		loadEntries(150);
	}
};

function copyToClipboard(s) {
	var tempInput = document.createElement("input");
	tempInput.value = s;

	document.body.appendChild(tempInput);
	tempInput.select();

	document.execCommand("copy");

	document.body.removeChild(tempInput);
}

function showCopiedSign(card) {
	var e = card.querySelector(".copied_sign");

	if(e.style.opacity != "0") return false;

	e.style.opacity = "1";

	setTimeout(() => e.style.opacity = "0", 1000);
}

function search(e) {
	if(query == e.value) return;

	query = e.value;

	const url = new URL(location);

	if(query.length != 0) url.searchParams.set('search', query);
	else url.searchParams.delete('search');

	history.replaceState(null, null, url);

	query = query.toLowerCase().replaceAll(" ", "");

	updateCurrentList();
}

function sort(type) {
	if(sortType == type) return;

	sortType = type;

	const url = new URL(location);

	if(sortType != 0) url.searchParams.set('sort_type', sortType);
	else url.searchParams.delete('sort_type');

	history.replaceState(null, null, url);

	updateCurrentList();
}

function clearEntryList() {
	var containers = document.getElementsByClassName("list_container");

	for(var container of containers) {
		container.innerHTML = "";

		setVisibility(container, false);
	}

	hideTitles();
}

function onSortMenuClick(e) {
	if(e.classList.contains("open")) {
		closeSortMenu(e);
	} else {
		openSortMenu(e);
	}
}

function openSortMenu(e) {
	e.classList.add("open");

	var options = e.querySelector(".header_sortselect_options");

	setVisibility(options, true);
}

function closeSortMenu(e) {
	e.classList.remove("open");

	var options = e.querySelector(".header_sortselect_options");

	setVisibility(options, false);
}

function selectSortType(type) {
	var e = document.getElementsByClassName("header_sortselect")[0];

	var options = e.querySelector(".header_sortselect_options");

	selectSortElement(options.children[type], type, false);
}

function selectSortElement(e, type, update) {
	var span = document.getElementsByClassName("header_sortselect")[0].children[0];

	span.innerText = e.innerText;

	if(update) sort(type);
	else sortType = type;

	e.classList.add("selected");

	var menu = document.getElementsByClassName("header_sortselect")[0];

	var options = menu.querySelector(".header_sortselect_options");

	for(var option of options.children) {
		if(option != e) option.classList.remove("selected");
	}
}

function addEmoji(card, e) {
	var p = e.popularity;
	
	if(p > 2 / 1000000) {
		setEmoji(card, '💎');
	} else if(p > 3.5 / 10000000) {
		setEmoji(card, '🔥');
	}
}

function setEmoji(card, emoji) {
	var unicode = emojiUnicode(emoji);

	var url = "https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/imgs/emojis/" + unicode + ".svg";
	
	var image = document.createElement("img");

	image.src = url;
	image.alt = emoji;

	image.style.maxWidth = "19px";
	image.style.maxHeight = "19px";

	image.style.display = "flex";
	image.style.alignItems = "center";

	image.style.marginRight = "9px";
	card.children[0].style.marginRight = "7px";

	image.style.pointerEvents = "none";

	card.insertBefore(image, card.children[1]);
}

function emojiUnicode(emoji) {
	var s = "";

	var n = Math.ceil(emoji.length / 2);

	for(var i = 0; i < n; i++) {
		s += emoji.codePointAt(i * 2).toString(16) + (i == n - 1 ? "" : "-");
	}

	return s;
}

function loadText(url) {
	return new Promise(
		function(resolve, reject) {
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.send(null);

			request.onreadystatechange = function() {
				if(request.readyState === 4 && request.status === 200) {
					var type = request.getResponseHeader('Content-Type');
					if(type.indexOf("text") !== 1) {
						resolve(request.responseText);
					}
				}
			}
		});
}